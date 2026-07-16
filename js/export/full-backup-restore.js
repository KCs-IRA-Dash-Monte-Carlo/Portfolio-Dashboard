import { STORE_NAMES } from '../persistence/schema.js';
import { indexedDbPersistence } from '../persistence/indexed-db.js';
import { loadSettingsState, saveSettingsState } from '../settings/settings-state.js';
import { FULL_BACKUP_FORMAT, FULL_BACKUP_SCHEMA_VERSION, PORTABLE_STORE_NAMES, checksumForBackup, stripCredentials } from './full-backup-export.js';

export async function parseAndValidateFullBackup(input) {
  let backup;
  try { backup = typeof input === 'string' ? JSON.parse(input) : structuredClone(input); } catch (_) { throw new Error('Backup is not valid JSON.'); }
  if (!backup || backup.format !== FULL_BACKUP_FORMAT) throw new Error('This is not a Portfolio Dashboard full backup.');
  if (!Number.isInteger(backup.schemaVersion) || backup.schemaVersion > FULL_BACKUP_SCHEMA_VERSION) throw new Error('Backup schema version is unsupported or from a future app.');
  if (backup.schemaVersion !== FULL_BACKUP_SCHEMA_VERSION) throw new Error('Backup schema version is unsupported.');
  validateBackupMetadata(backup);
  if (!backup.integrity || backup.integrity.algorithm !== 'SHA-256' || !/^[a-f0-9]{64}$/.test(backup.integrity.checksum || '')) throw new Error('Backup integrity metadata is malformed.');
  if (await checksumForBackup(backup) !== backup.integrity.checksum) throw new Error('Backup checksum failed; nothing was restored.');
  validateSettings(backup.settings);
  if (!backup.stores || typeof backup.stores !== 'object' || Array.isArray(backup.stores)) throw new Error('Backup store sections are malformed.');
  PORTABLE_STORE_NAMES.forEach((name) => validateRecords(name, backup.stores[name]));
  validateSectionCounts(backup);
  validateHistoricalConsistency(backup);
  rejectCredentials(backup);
  return backup;
}

export function createRestorePreview(backup) {
  const candles = backup.stores[STORE_NAMES.HISTORICAL_CANDLES] || [];
  const dates = candles.map((c) => c.date).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)).sort();
  const symbols = [...new Set(candles.map((c) => c.symbol))].sort();
  const warnings = [];
  if (!candles.length) warnings.push('No historical candles are in this backup.');
  if (backup.runtimeLiveDataSetupRequired) warnings.push('The Finnhub key is not portable. Enter it again for this page session after restore.');
  return {
    appVersion: backup.appVersion, schemaVersion: backup.schemaVersion,
    createdAt: backup.createdAt, sourceDeviceLabel: backup.sourceDeviceLabel,
    datasetVersion: backup.datasetVersion, datasetVersions: backup.datasetVersions,
    adjustmentBasis: backup.historicalAdjustmentBasis,
    integrity: 'SHA-256 verified', counts: backup.sectionCounts, symbols,
    firstDate: dates[0] || null, lastDate: dates.at(-1) || null, warnings
  };
}

export async function restoreFullPortableBackup(input, options = {}) {
  const backup = await parseAndValidateFullBackup(input);
  const persistence = options.persistence || indexedDbPersistence;
  const saveSettings = options.saveSettings || saveSettingsState;
  const previousSettings = options.loadSettings ? options.loadSettings() : loadSettingsState();
  // Keep an in-memory preflight snapshot only until Settings has also saved.
  // This closes the otherwise small gap between the IDB transaction and the
  // separate Local Storage settings write.
  const previousStores = Object.fromEntries(await Promise.all(
    PORTABLE_STORE_NAMES.map(async (name) => [name, await persistence.getAll(name)])
  ));
  let storesCommitted = false;
  try {
    await persistence.replaceStoresAtomically(Object.fromEntries(PORTABLE_STORE_NAMES.map((name) => [name, backup.stores[name]])));
    storesCommitted = true;
    const restored = invalidateDerivedState(stripCredentials(backup.settings));
    saveSettings(restored, { incrementEditCount: false });
    await recordRestoreDiagnostic(persistence, 'backup-restore-success', { createdAt: backup.createdAt, counts: backup.sectionCounts });
    return { backup, preview: createRestorePreview(backup), state: restored };
  } catch (error) {
    // A failed store transaction changes nothing. If the subsequent Settings
    // write fails, restore the in-memory store snapshot as a second atomic
    // transaction so the complete portable state rolls back together.
    if (storesCommitted) {
      try { await persistence.replaceStoresAtomically(previousStores); } catch (_) {}
    }
    try { saveSettings(previousSettings, { incrementEditCount: false }); } catch (_) {}
    await recordRestoreDiagnostic(persistence, 'backup-restore-failure', { message: error.message });
    throw error;
  }
}

function validateSettings(settings) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new Error('Backup settings are malformed.');
  ['holdings', 'lots', 'benchmarks', 'activeSymbols'].forEach((key) => { if (!Array.isArray(settings[key])) throw new Error(`Backup settings.${key} must be an array.`); });
  const ids = new Set();
  [...settings.holdings, ...settings.lots, ...settings.benchmarks].forEach((record) => {
    if (!record || typeof record !== 'object' || !record.id || ids.has(record.id)) throw new Error('Backup contains duplicate or invalid configuration identifiers.');
    ids.add(record.id);
  });
  settings.holdings.forEach((holding) => {
    if (!validSymbol(holding.ticker)) throw new Error('Backup contains an invalid holding.');
  });
  const holdingIds = new Set(settings.holdings.map((holding) => holding.id));
  settings.lots.forEach((lot) => {
    if (!validSymbol(lot.ticker) || !holdingIds.has(lot.holdingId) || !Number.isFinite(Number(lot.shares)) || Number(lot.shares) <= 0 || !Number.isFinite(Number(lot.purchasePrice)) || Number(lot.purchasePrice) < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(lot.acquisitionDate || '')) throw new Error('Backup contains an invalid lot.');
  });
  settings.benchmarks.forEach((benchmark) => { if (!validSymbol(benchmark.ticker)) throw new Error('Backup contains an invalid benchmark.'); });
}

function validateBackupMetadata(backup) {
  if (typeof backup.appVersion !== 'string' || !backup.appVersion.trim()) throw new Error('Backup application version is malformed.');
  if (!validTimestamp(backup.createdAt)) throw new Error('Backup creation timestamp is malformed.');
  if (typeof backup.sourceDeviceLabel !== 'string' || !backup.sourceDeviceLabel.trim() || backup.sourceDeviceLabel.length > 80) throw new Error('Backup source device label is malformed.');
  if (typeof backup.runtimeLiveDataSetupRequired !== 'boolean') throw new Error('Backup runtime live-data status is malformed.');
  if (typeof backup.datasetVersion !== 'string' || !backup.datasetVersion) throw new Error('Backup dataset version is malformed.');
  if (!Array.isArray(backup.datasetVersions) || !backup.datasetVersions.every((value) => typeof value === 'string' && value)) throw new Error('Backup dataset versions are malformed.');
  if (!Array.isArray(backup.excludedSections) || !backup.excludedSections.every((value) => typeof value === 'string')) throw new Error('Backup excluded-section metadata is malformed.');
  const basis = backup.historicalAdjustmentBasis;
  if (basis !== null && (!plainObject(basis) || !['source', 'frequency', 'priceAdjustment', 'dividendAdjustment'].every((key) => typeof basis[key] === 'string' && basis[key]))) throw new Error('Backup historical adjustment metadata is malformed.');
}

function validateRecords(name, records) {
  if (!Array.isArray(records)) throw new Error(`Backup section ${name} must be an array.`);
  const keys = new Set();
  records.forEach((record) => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error(`Backup section ${name} contains an invalid record.`);
    const key = recordKey(name, record);
    if (!key || keys.has(key)) throw new Error(`Backup section ${name} contains duplicate keys.`);
    keys.add(key);
    if (name === STORE_NAMES.HISTORICAL_CANDLES) validateHistoricalCandle(record);
    if (name === STORE_NAMES.HISTORICAL_DATASET_MANIFESTS) validateHistoricalManifest(record);
    if (name === STORE_NAMES.HISTORICAL_IMPORT_BATCHES) validateHistoricalImport(record);
    if (name === STORE_NAMES.HISTORICAL_QUALITY_FLAGS) validateHistoricalQualityFlag(record);
  });
}

function validSymbol(value) { return /^[A-Z0-9.-]+$/.test(value || ''); }

function recordKey(name, record) {
  if (name === STORE_NAMES.HISTORICAL_CANDLES) return `${record.symbol}|${record.date}`;
  if (name === STORE_NAMES.COMPANY_METADATA) return record.symbol;
  return typeof record.id === 'string' ? record.id : null;
}

function validateHistoricalCandle(record) {
  const prices = ['open', 'high', 'low', 'close'];
  if (!validSymbol(record.symbol) || !validDate(record.date) || !prices.every((key) => finiteNonNegative(record[key])) || !finiteNonNegative(record.volume) || Number(record.low) > Number(record.high) || Number(record.open) < Number(record.low) || Number(record.open) > Number(record.high) || Number(record.close) < Number(record.low) || Number(record.close) > Number(record.high) || typeof record.datasetVersion !== 'string' || !hash(record.sourceFileHash) || typeof record.source !== 'string' || typeof record.frequency !== 'string' || typeof record.priceAdjustment !== 'string' || typeof record.dividendAdjustment !== 'string') throw new Error('Backup contains an invalid historical candle.');
}

function validateHistoricalManifest(record) {
  if (!record.id || !['symbol', 'dataset'].includes(record.recordType) || !record.datasetVersion || !record.source || !record.frequency || !record.priceAdjustment || !record.dividendAdjustment) throw new Error('Backup contains an invalid historical dataset manifest.');
  if (record.recordType === 'symbol' && (!validSymbol(record.symbol) || !Number.isInteger(record.recordCount) || record.recordCount < 1 || !validDate(record.firstDate) || !validDate(record.lastDate) || record.firstDate > record.lastDate || !hash(record.sourceFileHash))) throw new Error('Backup contains an invalid historical symbol manifest.');
}

function validateHistoricalImport(record) {
  if (!record.id || !validSymbol(record.symbol) || typeof record.datasetVersion !== 'string' || !hash(record.sourceFileHash) || !Number.isInteger(record.recordCount) || record.recordCount < 0 || typeof record.mode !== 'string' || typeof record.status !== 'string') throw new Error('Backup contains an invalid historical import record.');
}

function validateHistoricalQualityFlag(record) {
  if (!record.id || !validSymbol(record.symbol) || typeof record.datasetVersion !== 'string' || typeof record.code !== 'string' || typeof record.severity !== 'string') throw new Error('Backup contains an invalid historical quality flag.');
}

function validateSectionCounts(backup) {
  const counts = backup.sectionCounts;
  if (!counts || typeof counts !== 'object') throw new Error('Backup section counts are malformed.');
  const expected = {
    settings: 1, holdings: backup.settings.holdings.length, lots: backup.settings.lots.length, benchmarks: backup.settings.benchmarks.length, activeSymbols: backup.settings.activeSymbols.length,
    quoteSnapshots: backup.stores[STORE_NAMES.QUOTE_SNAPSHOTS].length,
    candles: backup.stores[STORE_NAMES.CANDLES].length,
    companyMetadata: backup.stores[STORE_NAMES.COMPANY_METADATA].length,
    historicalCandles: backup.stores[STORE_NAMES.HISTORICAL_CANDLES].length,
    historicalManifests: backup.stores[STORE_NAMES.HISTORICAL_DATASET_MANIFESTS].length,
    historicalImports: backup.stores[STORE_NAMES.HISTORICAL_IMPORT_BATCHES].length,
    historicalQualityFlags: backup.stores[STORE_NAMES.HISTORICAL_QUALITY_FLAGS].length,
    diagnostics: backup.stores[STORE_NAMES.DIAGNOSTICS_HISTORY].length
  };
  Object.entries(expected).forEach(([key, value]) => {
    if (!Number.isInteger(counts[key]) || counts[key] !== value) throw new Error(`Backup section count ${key} is invalid.`);
  });
}

function validateHistoricalConsistency(backup) {
  const candles = backup.stores[STORE_NAMES.HISTORICAL_CANDLES];
  const manifests = backup.stores[STORE_NAMES.HISTORICAL_DATASET_MANIFESTS].filter((record) => record.recordType === 'symbol');
  if (!candles.length && (manifests.length || backup.datasetVersion !== 'none' || backup.datasetVersions.length || backup.historicalAdjustmentBasis !== null)) throw new Error('Backup historical metadata does not match an empty historical section.');
  if (candles.length && !manifests.length) throw new Error('Backup historical candles are missing dataset manifests.');
  const manifestBySymbol = new Map(manifests.map((record) => [record.symbol, record]));
  const grouped = new Map();
  candles.forEach((candle) => grouped.set(candle.symbol, [...(grouped.get(candle.symbol) || []), candle]));
  grouped.forEach((records, symbol) => {
    const manifest = manifestBySymbol.get(symbol);
    if (!manifest) throw new Error(`Backup historical candles for ${symbol} have no manifest.`);
    const dates = records.map((record) => record.date).sort();
    if (manifest.recordCount !== records.length || manifest.firstDate !== dates[0] || manifest.lastDate !== dates.at(-1)) throw new Error(`Backup historical counts or dates do not match the ${symbol} manifest.`);
    if (!records.every((record) => record.datasetVersion === manifest.datasetVersion && record.sourceFileHash === manifest.sourceFileHash && record.source === manifest.source && record.frequency === manifest.frequency && record.priceAdjustment === manifest.priceAdjustment && record.dividendAdjustment === manifest.dividendAdjustment)) throw new Error(`Backup historical adjustment metadata does not match the ${symbol} manifest.`);
  });
  if (manifests.some((manifest) => !grouped.has(manifest.symbol))) throw new Error('Backup contains a historical manifest without candles.');
  const versions = [...new Set(manifests.map((record) => record.datasetVersion))].sort();
  const basis = manifests[0] ? pickBasis(manifests[0]) : null;
  if (manifests.some((record) => JSON.stringify(pickBasis(record)) !== JSON.stringify(basis))) throw new Error('Backup historical data has incompatible adjustment bases.');
  if (JSON.stringify(versions) !== JSON.stringify(backup.datasetVersions) || backup.datasetVersion !== (versions.length === 1 ? versions[0] : 'multiple') || JSON.stringify(basis) !== JSON.stringify(backup.historicalAdjustmentBasis)) throw new Error('Backup historical summary metadata is inconsistent.');
}

function pickBasis(record) { return { source: record.source, frequency: record.frequency, priceAdjustment: record.priceAdjustment, dividendAdjustment: record.dividendAdjustment }; }
function plainObject(value) { return value && typeof value === 'object' && !Array.isArray(value); }
function validDate(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)); }
function validTimestamp(value) { return typeof value === 'string' && !Number.isNaN(Date.parse(value)); }
function finiteNonNegative(value) { return Number.isFinite(Number(value)) && Number(value) >= 0; }
function hash(value) { return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value); }

function rejectCredentials(value) {
  const forbidden = /(api[_-]?key|authorization|token|secret|request.?url)/i;
  const scan = (item) => {
    if (typeof item === 'string' && /[?&](token|apikey|api_key|authorization)=/i.test(item)) throw new Error('Backup contains credential-bearing request data and cannot be restored.');
    if (Array.isArray(item)) return item.forEach(scan);
    if (item && typeof item === 'object') Object.entries(item).forEach(([key, child]) => { if (forbidden.test(key)) throw new Error('Backup contains credentials and cannot be restored.'); scan(child); });
  };
  scan(value);
}

function invalidateDerivedState(state) {
  const next = structuredClone(state);
  next.dependentDataState = { ...(next.dependentDataState || {}), charts: 'stale', analytics: 'stale', simulations: 'stale', staleReason: 'portable-restore', invalidatedAt: new Date().toISOString() };
  next.api = { ...(next.api || {}), apiKey: '', hasKey: false, keySource: 'session-entry' };
  next.backup = { ...(next.backup || {}), lastRestoredAt: new Date().toISOString() };
  return next;
}

async function recordRestoreDiagnostic(persistence, category, detail) {
  try { await persistence.put(STORE_NAMES.DIAGNOSTICS_HISTORY, { id: `restore:${Date.now()}`, level: category.endsWith('success') ? 'info' : 'error', category, createdAt: new Date().toISOString(), detail }); } catch (_) {}
}

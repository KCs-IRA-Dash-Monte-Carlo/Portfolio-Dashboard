// Credential-free portable backup writer. Designed for AirDrop and the iOS
// Files picker: the result is a single JSON file with no server dependency.
import { APP_VERSION, STORE_NAMES } from '../persistence/schema.js';
import { indexedDbPersistence } from '../persistence/indexed-db.js';
import { loadSettingsState, saveSettingsState } from '../settings/settings-state.js';

export const FULL_BACKUP_SCHEMA_VERSION = 1;
export const FULL_BACKUP_FORMAT = 'mvp-portfolio-dashboard-full-backup';
export const PORTABLE_STORE_NAMES = Object.freeze([
  STORE_NAMES.QUOTE_SNAPSHOTS,
  STORE_NAMES.CANDLES,
  STORE_NAMES.COMPANY_METADATA,
  STORE_NAMES.DIAGNOSTICS_HISTORY,
  STORE_NAMES.HISTORICAL_CANDLES,
  STORE_NAMES.HISTORICAL_DATASET_MANIFESTS,
  STORE_NAMES.HISTORICAL_IMPORT_BATCHES,
  STORE_NAMES.HISTORICAL_QUALITY_FLAGS
]);

export async function createFullPortableBackup(options = {}) {
  const persistence = options.persistence || indexedDbPersistence;
  const settings = stripCredentials(options.settings || loadSettingsState());
  const stores = {};
  for (const storeName of PORTABLE_STORE_NAMES) stores[storeName] = await persistence.getAll(storeName);
  const historicalMetadata = deriveHistoricalMetadata(stores);
  const backup = {
    format: FULL_BACKUP_FORMAT,
    schemaVersion: FULL_BACKUP_SCHEMA_VERSION,
    appVersion: options.appVersion || APP_VERSION,
    createdAt: options.createdAt || new Date().toISOString(),
    sourceDeviceLabel: safeDeviceLabel(options.sourceDeviceLabel),
    runtimeLiveDataSetupRequired: Boolean(settings.api?.hasKey),
    datasetVersion: historicalMetadata.datasetVersion,
    datasetVersions: historicalMetadata.datasetVersions,
    historicalAdjustmentBasis: historicalMetadata.adjustmentBasis,
    excludedSections: [STORE_NAMES.EXPORT_STAGING],
    settings,
    stores,
    sectionCounts: sectionCounts(settings, stores),
    integrity: { algorithm: 'SHA-256', checksum: '' }
  };
  backup.integrity.checksum = await checksumForBackup(backup);
  return backup;
}

export async function exportFullPortableBackup(options = {}) {
  const backup = await createFullPortableBackup(options);
  const text = JSON.stringify(backup, null, 2);
  if (typeof document !== 'undefined' && options.download !== false) downloadBackup(text, backup.createdAt);
  await recordBackupDiagnostic(options.persistence || indexedDbPersistence, 'backup-export-success', backup.sectionCounts);
  try {
    const current = options.settings || loadSettingsState();
    current.backup = { ...(current.backup || {}), lastExportedAt: backup.createdAt };
    (options.saveSettings || saveSettingsState)(current, { incrementEditCount: false });
    writeReminderBaseline(current, backup.createdAt);
  } catch (_) { /* A completed download must not be reported as failed if metadata cannot persist. */ }
  return { backup, text, filename: backupFilename(backup.createdAt) };
}

export function stripCredentials(value) {
  if (Array.isArray(value)) return value.map(stripCredentials);
  if (!value || typeof value !== 'object') return value;
  const safe = {};
  Object.entries(value).forEach(([key, child]) => {
    // Request URLs are not required to recreate portable state and can carry
    // query credentials in older provider-cache records, so omit them too.
    if (/api[_-]?key|authorization|token|secret|request.?url/i.test(key)) return;
    safe[key] = stripCredentials(child);
  });
  return safe;
}

export async function checksumForBackup(backup) {
  const canonical = structuredClone(backup);
  if (canonical.integrity) canonical.integrity.checksum = '';
  const bytes = new TextEncoder().encode(JSON.stringify(canonical));
  if (!globalThis.crypto?.subtle) throw new Error('SHA-256 support is required to create a portable backup.');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function backupFilename(createdAt = new Date().toISOString()) {
  return `portfolio-dashboard-backup-${createdAt.slice(0, 10)}.json`;
}

function sectionCounts(settings, stores) {
  return {
    settings: 1,
    holdings: settings.holdings?.length || 0, lots: settings.lots?.length || 0,
    benchmarks: settings.benchmarks?.length || 0,
    activeSymbols: settings.activeSymbols?.length || 0,
    quoteSnapshots: stores[STORE_NAMES.QUOTE_SNAPSHOTS].length,
    candles: stores[STORE_NAMES.CANDLES].length,
    companyMetadata: stores[STORE_NAMES.COMPANY_METADATA].length,
    historicalCandles: stores[STORE_NAMES.HISTORICAL_CANDLES].length,
    historicalManifests: stores[STORE_NAMES.HISTORICAL_DATASET_MANIFESTS].length,
    historicalImports: stores[STORE_NAMES.HISTORICAL_IMPORT_BATCHES].length,
    historicalQualityFlags: stores[STORE_NAMES.HISTORICAL_QUALITY_FLAGS].length,
    diagnostics: stores[STORE_NAMES.DIAGNOSTICS_HISTORY].length
  };
}

function deriveHistoricalMetadata(stores) {
  const manifests = stores[STORE_NAMES.HISTORICAL_DATASET_MANIFESTS]
    .filter((record) => record?.recordType === 'symbol');
  if (!manifests.length) {
    return { datasetVersion: 'none', datasetVersions: [], adjustmentBasis: null };
  }
  const datasetVersions = [...new Set(manifests.map((record) => record.datasetVersion).filter(Boolean))].sort();
  const bases = [...new Set(manifests.map((record) => `${record.source}|${record.frequency}|${record.priceAdjustment}|${record.dividendAdjustment}`))];
  if (bases.length !== 1) throw new Error('Historical data uses incompatible adjustment bases and cannot be exported as one portable backup.');
  const [source, frequency, priceAdjustment, dividendAdjustment] = bases[0].split('|');
  return {
    datasetVersion: datasetVersions.length === 1 ? datasetVersions[0] : 'multiple',
    datasetVersions,
    adjustmentBasis: { source, frequency, priceAdjustment, dividendAdjustment }
  };
}

function safeDeviceLabel(label) {
  if (typeof label === 'string' && label.trim()) return label.trim().slice(0, 80);
  return typeof navigator === 'undefined' ? 'Unknown device' : `Browser on ${navigator.platform || 'device'}`;
}

function downloadBackup(text, createdAt) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = backupFilename(createdAt);
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
}

// Phase 9B reminder semantics apply to either backup type. Keep the marker
// credential-free and local so a full portable export resets its 10-edit clock.
function writeReminderBaseline(state, exportedAt) {
  try {
    globalThis.localStorage?.setItem('mvpPortfolioDash.backupReminder.v1', JSON.stringify({
      lastExportedAt: exportedAt,
      revisionAtLastExport: Math.max(0, Number(state.portfolioRevision || 0)) + Math.max(0, Number(state.registryRevision || 0)),
      dismissedUntil: null
    }));
  } catch (_) { /* A successful portable download remains successful if local storage is blocked. */ }
}

async function recordBackupDiagnostic(persistence, category, detail) {
  try { await persistence.put(STORE_NAMES.DIAGNOSTICS_HISTORY, { id: `backup:${Date.now()}`, level: 'info', category, createdAt: new Date().toISOString(), detail }); } catch (_) { /* diagnostics must not prevent backup */ }
}

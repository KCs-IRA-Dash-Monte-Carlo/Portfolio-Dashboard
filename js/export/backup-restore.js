// Configuration restore never reads or replaces Phase 9A portable stores.
import { STORE_NAMES } from '../persistence/schema.js';
import { indexedDbPersistence } from '../persistence/indexed-db.js';
import { loadSettingsState, saveSettingsState } from '../settings/settings-state.js';
import { stripCredentials } from './full-backup-export.js';
import { CONFIG_BACKUP_FORMAT, CONFIG_BACKUP_SCHEMA_VERSION } from './backup-export.js';

export function parseAndValidateConfigurationBackup(input) {
  let backup;
  try { backup = typeof input === 'string' ? JSON.parse(input) : structuredClone(input); } catch (_) { throw new Error('Configuration backup is not valid JSON.'); }
  if (!backup || backup.format !== CONFIG_BACKUP_FORMAT) throw new Error('This is not a Portfolio Dashboard configuration backup.');
  if (backup.schemaVersion !== CONFIG_BACKUP_SCHEMA_VERSION) throw new Error('Configuration backup schema is unsupported.');
  if (backup.includesHistoricalData !== false || !validTimestamp(backup.createdAt) || typeof backup.appVersion !== 'string' || typeof backup.runtimeLiveDataSetupRequired !== 'boolean') throw new Error('Configuration backup metadata is malformed.');
  rejectCredentials(backup);
  validateSettings(backup.settings);
  return backup;
}

export function createConfigurationRestorePreview(backup) {
  const value = parseAndValidateConfigurationBackup(backup);
  return Object.freeze({ appVersion: value.appVersion, createdAt: value.createdAt, holdings: value.settings.holdings.length, lots: value.settings.lots.length, benchmarks: value.settings.benchmarks.length, activeSymbols: value.settings.activeSymbols.length, warning: value.runtimeLiveDataSetupRequired ? 'The Finnhub key is not included; enter it again for this page session.' : null, preservesHistoricalData: true });
}

export async function restoreConfigurationBackup(input, options = {}) {
  const backup = parseAndValidateConfigurationBackup(input);
  const save = options.saveSettings || saveSettingsState;
  const previous = options.loadSettings ? options.loadSettings() : loadSettingsState();
  try {
    // Preserve runtime-only credential state in memory, but never import it.
    const next = { ...stripCredentials(backup.settings), api: { ...(stripCredentials(backup.settings).api || {}), apiKey: previous.api?.apiKey || '', hasKey: Boolean(previous.api?.apiKey), keySource: 'session-entry' }, backup: { ...(backup.settings.backup || {}), lastRestoredAt: new Date().toISOString() } };
    const state = save(next, { incrementEditCount: false });
    await diagnostic(options.persistence || indexedDbPersistence, 'configuration-backup-restore-success', { createdAt: backup.createdAt });
    return { backup, state, preview: createConfigurationRestorePreview(backup) };
  } catch (error) {
    try { save(previous, { incrementEditCount: false }); } catch (_) {}
    await diagnostic(options.persistence || indexedDbPersistence, 'configuration-backup-restore-failure', { reason: error instanceof Error ? error.name : 'unknown' });
    throw new Error('Configuration restore failed safely; existing configuration remains in place.');
  }
}

function validateSettings(settings) { if (!settings || typeof settings !== 'object' || !['holdings', 'lots', 'benchmarks', 'activeSymbols'].every((key) => Array.isArray(settings[key]))) throw new Error('Configuration backup settings are malformed.'); }
function validTimestamp(value) { return typeof value === 'string' && !Number.isNaN(Date.parse(value)); }
function rejectCredentials(value) { const forbidden = /(api[_-]?key|authorization|token|secret|request.?url)/i; const scan = (item) => { if (typeof item === 'string' && /[?&](token|apikey|api_key|authorization)=/i.test(item)) throw new Error('Configuration backup contains credentials.'); if (Array.isArray(item)) item.forEach(scan); else if (item && typeof item === 'object') Object.entries(item).forEach(([key, child]) => { if (forbidden.test(key)) throw new Error('Configuration backup contains credentials.'); scan(child); }); }; scan(value); }
async function diagnostic(persistence, category, detail) { try { await persistence.put(STORE_NAMES.DIAGNOSTICS_HISTORY, { id: `config-restore:${Date.now()}`, level: category.endsWith('success') ? 'info' : 'error', category, createdAt: new Date().toISOString(), detail }); } catch (_) {} }

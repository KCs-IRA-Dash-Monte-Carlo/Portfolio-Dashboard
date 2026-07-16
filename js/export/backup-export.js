// Lightweight configuration backups deliberately do not contain IndexedDB data.
import { APP_VERSION, STORE_NAMES } from '../persistence/schema.js';
import { indexedDbPersistence } from '../persistence/indexed-db.js';
import { loadSettingsState, saveSettingsState } from '../settings/settings-state.js';
import { stripCredentials } from './full-backup-export.js';

export const CONFIG_BACKUP_FORMAT = 'mvp-portfolio-dashboard-configuration-backup';
export const CONFIG_BACKUP_SCHEMA_VERSION = 1;

export function createConfigurationBackup(options = {}) {
  const settings = stripCredentials(options.settings || loadSettingsState());
  const createdAt = options.createdAt || new Date().toISOString();
  return {
    format: CONFIG_BACKUP_FORMAT,
    schemaVersion: CONFIG_BACKUP_SCHEMA_VERSION,
    appVersion: options.appVersion || APP_VERSION,
    createdAt,
    runtimeLiveDataSetupRequired: Boolean(settings.api?.hasKey),
    // This explicit boundary prevents a small convenience backup being
    // mistaken for the Phase 9A device-transfer format.
    includesHistoricalData: false,
    settings
  };
}

export async function exportConfigurationBackup(options = {}) {
  try {
    const backup = createConfigurationBackup(options);
    const text = JSON.stringify(backup, null, 2);
    const filename = configurationBackupFilename(backup.createdAt);
    if (options.download !== false && typeof document !== 'undefined') download(text, filename, options.document || document);
    await recordDiagnostic(options.persistence || indexedDbPersistence, 'configuration-backup-export-success', { schemaVersion: backup.schemaVersion });
    markBackupExported(options.settings || loadSettingsState(), options);
    return { backup, text, filename };
  } catch (error) {
    await recordDiagnostic(options.persistence || indexedDbPersistence, 'configuration-backup-export-failure', { reason: safeFailureReason(error) });
    throw new Error('Configuration backup could not be created safely.');
  }
}

export function configurationBackupFilename(createdAt = new Date().toISOString()) {
  return `portfolio-dashboard-configuration-${String(createdAt).slice(0, 10)}.json`;
}

export function backupReminderStatus(state = loadSettingsState(), options = {}) {
  const now = new Date(options.now || Date.now());
  const marker = readReminderMarker(options.storage);
  const lastExportedAt = state.backup?.lastExportedAt || marker.lastExportedAt;
  // A legacy/full-backup timestamp may predate the reminder marker. Its edit
  // baseline is unknowable, so count only edits saved after a known marker.
  const hasRevisionBaseline = Number.isFinite(Number(marker.revisionAtLastExport));
  const edits = hasRevisionBaseline ? Math.max(0, revisionTotal(state) - Number(marker.revisionAtLastExport)) : 0;
  const elapsedDays = lastExportedAt ? calendarDaysBetween(new Date(lastExportedAt), now) : Infinity;
  const dismissed = marker.dismissedUntil && now < new Date(marker.dismissedUntil);
  return Object.freeze({ due: !dismissed && (elapsedDays >= 30 || edits >= 10), elapsedDays, edits, dismissedUntil: marker.dismissedUntil || null });
}

export function dismissBackupReminder(options = {}) {
  const now = new Date(options.now || Date.now());
  writeReminderMarker({ ...readReminderMarker(options.storage), dismissedUntil: new Date(now.getTime() + 30 * 86400000).toISOString() }, options.storage);
}

export function markBackupExported(state = loadSettingsState(), options = {}) {
  const createdAt = options.createdAt || new Date().toISOString();
  const next = structuredClone(state);
  next.backup = { ...(next.backup || {}), lastExportedAt: createdAt };
  (options.saveSettings || saveSettingsState)(next, { incrementEditCount: false });
  writeReminderMarker({ lastExportedAt: createdAt, revisionAtLastExport: revisionTotal(next), dismissedUntil: null }, options.storage);
  return next;
}

function revisionTotal(state) { return Number(state.portfolioRevision || 0) + Number(state.registryRevision || 0); }
function calendarDaysBetween(start, end) {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return Infinity;
  const day = (value) => Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
  return Math.max(0, Math.round((day(end) - day(start)) / 86400000));
}
function storageFor(storage) { return storage || globalThis.localStorage; }
function readReminderMarker(storage) { try { return JSON.parse(storageFor(storage)?.getItem('mvpPortfolioDash.backupReminder.v1') || '{}') || {}; } catch (_) { return {}; } }
function writeReminderMarker(value, storage) { try { storageFor(storage)?.setItem('mvpPortfolioDash.backupReminder.v1', JSON.stringify(value)); } catch (_) {} }
function download(text, filename, ownerDocument) { const url = URL.createObjectURL(new Blob([text], { type: 'application/json' })); const a = ownerDocument.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 0); }
function safeFailureReason(error) { return error instanceof Error ? error.name : 'unknown'; }
async function recordDiagnostic(persistence, category, detail) { try { await persistence.put(STORE_NAMES.DIAGNOSTICS_HISTORY, { id: `export:${Date.now()}`, level: category.endsWith('success') ? 'info' : 'error', category, createdAt: new Date().toISOString(), detail }); } catch (_) {} }

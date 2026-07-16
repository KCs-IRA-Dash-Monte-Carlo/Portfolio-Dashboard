import { exportFullPortableBackup } from '../export/full-backup-export.js';
import { createRestorePreview, parseAndValidateFullBackup, restoreFullPortableBackup } from '../export/full-backup-restore.js';
import { applyDisplayPreferences } from '../settings/settings-state.js';

export function initFullBackupManager(root = document) {
  const exportButton = root.querySelector('[data-backup-export]');
  const fileInput = root.querySelector('[data-backup-file]');
  const previewNode = root.querySelector('[data-backup-preview]');
  const confirmButton = root.querySelector('[data-backup-restore-confirm]');
  const status = root.querySelector('[data-backup-status]');
  let pending = null;
  if (!exportButton || !fileInput || !previewNode || !confirmButton) return;
  exportButton.addEventListener('click', async () => {
    setStatus(status, 'Creating credential-free portable backup…');
    try { const result = await exportFullPortableBackup(); setStatus(status, `Backup ready: ${result.filename}. Use AirDrop or Files to transfer it to iPhone.`); }
    catch (error) { setStatus(status, `Backup failed safely: ${error.message}`, true); }
  });
  fileInput.addEventListener('change', async () => {
    pending = null; confirmButton.disabled = true; previewNode.hidden = true;
    const file = fileInput.files?.[0]; if (!file) return;
    setStatus(status, 'Validating backup before any data is changed…');
    try {
      pending = await parseAndValidateFullBackup(await file.text());
      renderPreview(previewNode, createRestorePreview(pending)); previewNode.hidden = false; confirmButton.disabled = false;
      setStatus(status, 'Backup validated. Review the replace preview, then confirm restore.');
    } catch (error) { setStatus(status, `Restore rejected safely: ${error.message}`, true); }
  });
  confirmButton.addEventListener('click', async () => {
    if (!pending || !window.confirm('Replace this browser’s complete portable state? This does not merge historical datasets.')) return;
    confirmButton.disabled = true; setStatus(status, 'Replacing portable state transactionally…');
    try {
      const result = await restoreFullPortableBackup(pending); applyDisplayPreferences(result.state);
      window.dispatchEvent(new CustomEvent('mvp:portable-restore', { detail: { state: result.state, preview: result.preview } }));
      setStatus(status, 'Restore completed. Analytics and simulations are stale; enter a Finnhub key again if live data is needed.'); pending = null;
    } catch (error) { setStatus(status, `Restore failed safely; prior state remains intact: ${error.message}`, true); }
  });
}

function renderPreview(node, preview) {
  const range = preview.firstDate ? `${preview.firstDate} to ${preview.lastDate}` : 'No historical dates';
  node.innerHTML = `<h4>Restore preview</h4><p>Backup v${preview.schemaVersion}, app ${escape(preview.appVersion || 'unknown')}, created ${escape(preview.createdAt || 'unknown')}.</p><p>${preview.counts.holdings} holdings, ${preview.counts.lots} lots, ${preview.counts.benchmarks} benchmarks, ${preview.counts.historicalCandles} candles.</p><p>Symbols: ${escape(preview.symbols.join(', ') || 'None')}. History: ${escape(range)}.</p>${preview.warnings.map((warning) => `<p class="portfolio-notice portfolio-notice--warning">${escape(warning)}</p>`).join('')}`;
}
function escape(value) { const element = document.createElement('span'); element.textContent = String(value); return element.innerHTML; }
function setStatus(node, message, isError = false) { if (!node) return; node.textContent = message; node.classList.toggle('status-pill--warning', isError); }

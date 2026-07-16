import { dataUrlToBlob, createPngFilename, downloadBlob } from '../charts/chart-export.js';
import { exportConfigurationBackup, backupReminderStatus, dismissBackupReminder } from './backup-export.js';
import { parseAndValidateConfigurationBackup, restoreConfigurationBackup } from './backup-restore.js';

// This manager is the Phase 9B integration point. Call registerChart for every
// mounted ChartManager; it produces an image with the same visible context a
// reader needs when the dashboard is no longer open.
export class ExportManager {
  constructor(options = {}) { this.document = options.document || globalThis.document; this.charts = new Map(); this.persistence = options.persistence; }
  registerChart(chartManager) { if (!chartManager?.type) throw new TypeError('A chart manager is required.'); this.charts.set(chartManager.type, chartManager); return () => this.charts.delete(chartManager.type); }
  async exportChart(type, options = {}) {
    const manager = this.charts.get(type); if (!manager?.chart) throw new Error('A rendered chart is required before PNG export.');
    try {
      const dataUrl = manager.chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff', excludeComponents: ['toolbox'] });
      const context = chartContext(manager);
      const blob = await addVisibleContext(dataUrl, context, this.document);
      const filename = createPngFilename(`${manager.title || type}-${context.projectedThroughDate || 'chart'}`);
      (options.save || downloadBlob)(blob, filename, this.document);
      return { blob, filename, context };
    } catch (error) { await this.recordFailure('png-export-failure', error); throw new Error('PNG export failed safely.'); }
  }
  async exportConfiguration(options = {}) { return exportConfigurationBackup({ ...options, persistence: this.persistence }); }
  async restoreConfiguration(input, options = {}) { return restoreConfigurationBackup(input, { ...options, persistence: this.persistence }); }
  validateConfiguration(input) { return parseAndValidateConfigurationBackup(input); }
  reminder(state, options) { return backupReminderStatus(state, options); }
  dismissReminder(options) { return dismissBackupReminder(options); }
  async recordFailure(category, error) { try { await this.persistence?.put?.('diagnosticsHistory', { id: `export:${Date.now()}`, level: 'error', category, createdAt: new Date().toISOString(), detail: { reason: error instanceof Error ? error.name : 'unknown' } }); } catch (_) {} }
}

export function chartContext(manager) {
  const prepared = manager.filteredPrepared || manager.prepared || {};
  const text = (selector) => manager.root?.querySelector(selector)?.textContent?.trim() || '';
  const projection = manager.projectionContext || prepared.projectionContext || {};
  return Object.freeze({ title: manager.title || text('h3') || 'Portfolio chart', methodology: text('[data-chart-methodology]') || String(prepared.methodologyLabel || ''), source: text('[data-chart-source]') || String(prepared.source || prepared.historicalSource || ''), freshness: text('[data-chart-freshness]') || prepared.updatedAt || manager.state?.updatedAt || '', warning: manager.state?.status === 'ready' ? '' : text('[data-chart-state-overlay]'), projectionHorizonYears: projection.horizonYears || null, projectedThroughDate: projection.projectedThroughDate || null });
}

export async function addVisibleContext(dataUrl, context, ownerDocument = globalThis.document) {
  const image = await loadImage(dataUrl, ownerDocument); const lines = [context.title, context.methodology && `Methodology: ${context.methodology}`, context.source && `Source: ${context.source}`, context.freshness && `Freshness: ${context.freshness}`, context.projectionHorizonYears && `Projection horizon: ${context.projectionHorizonYears} years`, context.projectedThroughDate && `Projected through: ${context.projectedThroughDate}`, context.warning && `Warning: ${context.warning}`].filter(Boolean);
  const canvas = ownerDocument.createElement('canvas'); canvas.width = image.width; canvas.height = image.height + 24 * lines.length + 16; const draw = canvas.getContext('2d'); if (!draw) return dataUrlToBlob(dataUrl); draw.fillStyle = '#ffffff'; draw.fillRect(0, 0, canvas.width, canvas.height); draw.drawImage(image, 0, 0); draw.fillStyle = '#111827'; draw.font = '14px sans-serif'; lines.forEach((line, index) => draw.fillText(String(line).slice(0, 220), 12, image.height + 24 + index * 24)); return dataUrlToBlob(canvas.toDataURL('image/png'));
}
function loadImage(src, ownerDocument) { return new Promise((resolve, reject) => { const image = ownerDocument.createElement('img'); image.onload = () => resolve(image); image.onerror = () => reject(new Error('PNG image could not be composed.')); image.src = src; }); }

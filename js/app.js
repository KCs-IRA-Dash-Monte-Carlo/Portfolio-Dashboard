import {
  applyDisplayPreferences,
  getEffectiveTheme,
  loadSettingsState,
  saveSettingsState
} from './settings/settings-state.js';
import { SYMBOL_REGISTRY_CHANGED_EVENT } from './core/symbol-registry.js';
import { initSetupWizard, openSetupWizard } from './ui/setup-wizard.js';
import { initPortfolioPhase3B } from './ui/portfolio-phase-3b.js?v=0.2.3-phase-3b-2';
import { initBenchmarkManagement } from './ui/benchmark-manager.js?v=0.2.3-phase-4a-3';
import {
  CHART_DATA_STATES,
  CHART_THEME_CHANGED_EVENT,
  mountChartManagers
} from './charts/chart-manager.js';
import {
  PROJECTION_HORIZON_CHANGED_EVENT,
  applyProjectionHorizonToMonteCarloInputs,
  createProjectionRunSnapshot,
  createProjectionExportMetadata,
  getProjectionContext,
  initProjectionHorizonControls,
  validateAcceptedProjectionResult
} from './settings/projection-settings.js';
import { createConfidenceFanPreparedData } from './charts/mc-confidence-fan.js';
import { createPercentileBandsPreparedData } from './charts/mc-percentile-bands.js';
import { initFullBackupManager } from './ui/full-backup-manager.js';
import { ExportManager } from './export/export-manager.js';

const APP_VERSION = '0.2.3-v2.3-phase-5a';
const chartManagers = new Map();
const activeProjectionRuns = new Map();
let acceptedProjectionResult = null;
let exportManager = null;

document.addEventListener('DOMContentLoaded', () => {
  bootstrapApp();
});

function bootstrapApp() {
  ensureSetupWizardStyles();
  const state = loadSettingsState();
  applyDisplayPreferences(state);
  renderPhaseOneShellState(state);
  initProjectionHorizonControls(document);
  wireShellActions();
  initPortfolioPhase3B();
  initBenchmarkManagement();
  initCharts();
  initConfigurationBackupControls();
  renderDependentDataState(state);
  registerServiceWorker();
  initSetupWizard();
  initFullBackupManager();
}

function renderDependentDataState(state) {
  const dependent = state.dependentDataState || {};
  document.querySelectorAll('[data-dependent-status]').forEach((node) => {
    const key = node.dataset.dependentStatus;
    if (dependent[key] === 'stale') {
      node.textContent = staleStatusMessage(dependent.staleReason);
      node.classList.add('status-pill--warning');
    }
  });
}

function ensureSetupWizardStyles() {
  if (document.querySelector('link[href$="css/setup-wizard.css"]')) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './css/setup-wizard.css';
  document.head.append(link);
}

function renderPhaseOneShellState(state) {
  const setupStatus = document.querySelector('[data-setup-status]');
  if (setupStatus) setupStatus.textContent = state.setup.completed ? 'Setup complete' : 'Setup incomplete';

  const activeSymbols = document.querySelector('[data-active-symbols]');
  if (activeSymbols) activeSymbols.textContent = state.activeSymbols.length ? state.activeSymbols.join(', ') : 'None';

  const projectionHorizon = document.querySelector('[data-projection-horizon]');
  if (projectionHorizon) projectionHorizon.textContent = `${state.projectionHorizonYears} years`;

  const themeLabel = document.querySelector('[data-theme-label]');
  if (themeLabel) themeLabel.textContent = state.theme;

  const versionNodes = document.querySelectorAll('[data-app-version]');
  versionNodes.forEach((node) => {
    node.textContent = APP_VERSION;
  });
}

function wireShellActions() {
  wireThemeChoices();
  wirePanelNavigation();

  document.querySelectorAll('[data-action="open-setup-wizard"]').forEach((button) => {
    button.addEventListener('click', () => openSetupWizard());
  });

  window.addEventListener('mvp:portfolio-changed', (event) => {
    renderDependentDataState({ dependentDataState: event.detail?.dependentDataState });
  });
  window.addEventListener(SYMBOL_REGISTRY_CHANGED_EVENT, (event) => {
    renderDependentDataState({ dependentDataState: event.detail?.dependentDataState });
  });
  window.addEventListener('mvp:portable-restore', (event) => {
    renderPhaseOneShellState(event.detail.state);
    renderDependentDataState(event.detail.state);
    invalidateProjectionOutputs('Stale after portable restore. Run a new simulation to refresh this visual.');
  });
  window.addEventListener('mvp:chart-data-ready', (event) => {
    const manager = chartManagers.get(event.detail?.type);
    if (manager) manager.setPreparedData(event.detail.prepared);
  });
  window.addEventListener('mvp:monte-carlo-result', (event) => {
    const result = event.detail?.result;
    const context = event.detail?.projectionContext || getProjectionContext(loadSettingsState());
    const accepted = validateAcceptedProjectionResult(result, context);
    if (!accepted.accepted) {
      invalidateProjectionOutputs(accepted.error);
      return;
    }
    acceptedProjectionResult = accepted.value;
    chartManagers.get('monte-carlo-confidence-fan')?.setPreparedData(createConfidenceFanPreparedData(accepted.value, accepted.value.projectionContext));
    chartManagers.get('monte-carlo-percentile-bands')?.setPreparedData(createPercentileBandsPreparedData(accepted.value, accepted.value.projectionContext));
    publishProjectionMetadata(accepted.value.projectionContext, 'accepted-simulation');
  });
  window.addEventListener('mvp:monte-carlo-run-approved', (event) => {
    const detail = event.detail || {};
    const outcome = startApprovedProjection(detail);
    detail.respond?.(outcome);
  });
  window.addEventListener(PROJECTION_HORIZON_CHANGED_EVENT, (event) => {
    const context = event.detail;
    renderPhaseOneShellState(loadSettingsState());
    activeProjectionRuns.forEach((run) => {
      run.controller.markInputsChanged(
        applyProjectionHorizonToMonteCarloInputs(run.rawInputs, context.horizonYears),
        run.alignedHistory
      );
    });
    activeProjectionRuns.clear();
    invalidateProjectionOutputs('Projection horizon changed. Run or approve a new simulation to refresh this visual.');
    renderDependentDataState({ dependentDataState: { simulations: 'stale', staleReason: 'projection-horizon-changed' } });
    publishProjectionMetadata(context, 'projection-horizon-changed');
  });
}

/**
 * Existing Monte Carlo UI may dispatch mvp:monte-carlo-run-approved with its
 * controller, raw inputs, and aligned history. This bridge is deliberately
 * presentation-free: it snapshots the global setting, starts only on explicit
 * approval, and emits only controller-completed output.
 */
export function startApprovedProjection({ controller, rawInputs, alignedHistory, startDate = new Date() } = {}) {
  if (!controller || typeof controller.start !== 'function' || typeof controller.subscribe !== 'function') {
    return { accepted: false, errors: [{ code: 'MONTE_CARLO_CONTROLLER_REQUIRED', message: 'An approved Monte Carlo controller is required.' }] };
  }
  const snapshot = createProjectionRunSnapshot(loadSettingsState(), startDate);
  let inputs;
  try {
    inputs = applyProjectionHorizonToMonteCarloInputs(rawInputs, snapshot.context.horizonYears);
  } catch (error) {
    return { accepted: false, errors: [{ code: 'PROJECTION_HORIZON_INVALID', message: error.message }] };
  }
  const outcome = controller.start(inputs, alignedHistory);
  if (!outcome.accepted) return outcome;

  const unsubscribe = controller.subscribe((state) => {
    if (state.status === 'completed') {
      unsubscribe();
      activeProjectionRuns.delete(outcome.runId);
      window.dispatchEvent(new CustomEvent('mvp:monte-carlo-result', {
        detail: { result: state.result, projectionContext: snapshot.context, acceptedByController: true }
      }));
    } else if (['stale', 'cancelled', 'failed'].includes(state.status)) {
      unsubscribe();
      activeProjectionRuns.delete(outcome.runId);
    }
  });
  activeProjectionRuns.set(outcome.runId, { controller, rawInputs, alignedHistory, snapshot, unsubscribe });
  return { ...outcome, projectionContext: snapshot.context, exportMetadata: snapshot.exportMetadata };
}

function invalidateProjectionOutputs(message) {
  acceptedProjectionResult = null;
  ['monte-carlo-confidence-fan', 'monte-carlo-percentile-bands'].forEach((type) => {
    const manager = chartManagers.get(type);
    manager?.setPreparedData(null);
    manager?.setStatus(CHART_DATA_STATES.STALE, message);
  });
}

function publishProjectionMetadata(context, reason) {
  const detail = Object.freeze({ ...createProjectionExportMetadata(context), reason });
  window.dispatchEvent(new CustomEvent('mvp:projection-export-context', { detail }));
  window.dispatchEvent(new CustomEvent('mvp:projection-backup-metadata-ready', { detail }));
}

function staleStatusMessage(reason) {
  return reason === 'projection-horizon-changed' ? 'Stale after projection horizon change' : 'Stale after portfolio edit';
}

function wireThemeChoices() {
  const buttons = Array.from(document.querySelectorAll('[data-theme-choice]'));
  if (!buttons.length) return;

  const setActiveChoice = (theme) => {
    buttons.forEach((button) => {
      const isActive = button.dataset.themeChoice === theme;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  };

  const currentState = loadSettingsState();
  setActiveChoice(currentState.theme);

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const theme = button.dataset.themeChoice;
      if (!['system', 'light', 'dark'].includes(theme)) return;

      const nextState = loadSettingsState();
      nextState.theme = theme;
      applyDisplayPreferences(nextState);
      setActiveChoice(theme);
      window.dispatchEvent(new CustomEvent(CHART_THEME_CHANGED_EVENT, {
        detail: { theme: getEffectiveTheme(theme) }
      }));

      try {
        saveSettingsState(nextState, { incrementEditCount: false });
      } catch (error) {
        // The selected theme still applies for this page when storage is blocked.
      }
    });
  });

  const systemTheme = window.matchMedia?.('(prefers-color-scheme: dark)');
  systemTheme?.addEventListener?.('change', () => {
    const nextState = loadSettingsState();
    if (nextState.theme !== 'system') return;
    applyDisplayPreferences(nextState);
    setActiveChoice('system');
    window.dispatchEvent(new CustomEvent(CHART_THEME_CHANGED_EVENT, {
      detail: { theme: getEffectiveTheme(nextState) }
    }));
  });
}

function initCharts() {
  chartManagers.forEach((manager) => manager.destroy());
  chartManagers.clear();
  exportManager = new ExportManager();
  mountChartManagers(document, {
    echarts: window.echarts,
    theme: getEffectiveTheme(loadSettingsState()),
    exportManager
  }).forEach((manager, type) => { chartManagers.set(type, manager); exportManager.registerChart(manager); });

  const projectionContext = getProjectionContext(loadSettingsState());
  ['monte-carlo-confidence-fan', 'monte-carlo-percentile-bands'].forEach((type) => {
    const manager = chartManagers.get(type);
    if (manager) manager.projectionContext = projectionContext;
  });

  window.addEventListener('mvp:portfolio-changed', () => {
    chartManagers.forEach((manager) => {
      if (manager.chart) {
        manager.setStatus(CHART_DATA_STATES.STALE, 'Portfolio inputs changed. Supply refreshed prepared series to update this chart.');
      }
    });
  });
  window.addEventListener(SYMBOL_REGISTRY_CHANGED_EVENT, () => {
    const comparison = chartManagers.get('comparison');
    if (comparison?.chart) {
      comparison.setStatus(CHART_DATA_STATES.STALE, 'Benchmark inputs changed. Supply refreshed prepared series to update this chart.');
    }
  });
}

function initConfigurationBackupControls() {
  const exportButton = document.querySelector('[data-configuration-backup-export]');
  const fileInput = document.querySelector('[data-configuration-backup-file]');
  const restoreButton = document.querySelector('[data-configuration-backup-restore]');
  const status = document.querySelector('[data-configuration-backup-status]');
  const reminder = document.querySelector('[data-configuration-backup-reminder]');
  const reminderMessage = document.querySelector('[data-configuration-backup-reminder-message]');
  const dismissReminder = document.querySelector('[data-configuration-backup-reminder-dismiss]');
  let pending = null;
  const show = (message, error = false) => { if (status) { status.textContent = message; status.dataset.status = error ? 'error' : 'ok'; } };
  const refreshReminder = () => {
    if (!reminder || !exportManager) return;
    const due = exportManager.reminder(loadSettingsState());
    reminder.hidden = !due.due;
    if (due.due && reminderMessage) reminderMessage.textContent = 'Backup reminder: export a configuration or full portable backup now.';
  };
  exportButton?.addEventListener('click', async () => { try { await exportManager.exportConfiguration(); show('Configuration backup exported. Historical data was not included.'); refreshReminder(); } catch (error) { show(error.message, true); } });
  fileInput?.addEventListener('change', async () => {
    try { pending = await fileInput.files?.[0]?.text(); if (!pending) return; const preview = exportManager.validateConfiguration(pending); restoreButton.disabled = false; show(`Validated configuration backup from ${preview.createdAt}. Historical data will remain unchanged.`); } catch (error) { pending = null; restoreButton.disabled = true; show(error.message, true); }
  });
  restoreButton?.addEventListener('click', async () => { try { if (!pending) throw new Error('Choose a configuration backup first.'); await exportManager.restoreConfiguration(pending); restoreButton.disabled = true; show('Configuration restored. Existing historical data was preserved.'); } catch (error) { show(error.message, true); } });
  dismissReminder?.addEventListener('click', () => { exportManager.dismissReminder(); refreshReminder(); });
  refreshReminder();
}

function wirePanelNavigation() {
  const buttons = Array.from(document.querySelectorAll('[data-panel-target]'));
  const panels = Array.from(document.querySelectorAll('[data-panel]'));
  if (!buttons.length || !panels.length) return;

  const showPanel = (target) => {
    const targetPanel = document.getElementById(`panel-${target}`);
    if (!targetPanel) return;

    panels.forEach((panel) => {
      panel.hidden = panel !== targetPanel;
    });

    buttons.forEach((button) => {
      const isActive = button.dataset.panelTarget === target;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    });
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => showPanel(button.dataset.panelTarget));
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('./service-worker.js').catch(() => {
    const status = document.querySelector('[data-service-worker-status]');
    if (status) status.textContent = 'Service worker registration failed';
  });
}

import { applyDisplayPreferences, loadSettingsState } from './settings/settings-state.js';
import { initSetupWizard, openSetupWizard } from './ui/setup-wizard.js';

const APP_VERSION = '0.1.0-phase1c';

document.addEventListener('DOMContentLoaded', () => {
  bootstrapApp();
});

function bootstrapApp() {
  ensureSetupWizardStyles();
  const state = loadSettingsState();
  applyDisplayPreferences(state);
  renderPhaseOneShellState(state);
  wireShellActions();
  registerServiceWorker();
  initSetupWizard();
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
  document.querySelectorAll('[data-action="open-setup-wizard"]').forEach((button) => {
    button.addEventListener('click', () => openSetupWizard());
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('./service-worker.js').catch(() => {
    const status = document.querySelector('[data-service-worker-status]');
    if (status) status.textContent = 'Service worker registration failed';
  });
}

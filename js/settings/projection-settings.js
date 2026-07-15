import { loadSettingsState, saveSettingsState } from './settings-state.js';
import {
  createProjectionDateContext,
  parseProjectionHorizon,
  projectionTradingDays
} from '../utils/projection-date-utils.js';

export const PROJECTION_HORIZON_CHANGED_EVENT = 'mvp:projection-horizon-changed';
export const PROJECTION_INPUTS_CHANGED_EVENT = 'mvp:monte-carlo-inputs-changed';
export const PROJECTION_HORIZON_STALE_REASON = 'projection-horizon-changed';

export function getProjectionContext(state = loadSettingsState(), startDate = new Date()) {
  return createProjectionDateContext(state?.projectionHorizonYears, startDate);
}

/**
 * Captures the calendar context at approval time. Completed simulations and
 * exports must keep this snapshot instead of recalculating their end date on a
 * later day.
 */
export function createProjectionRunSnapshot(state = loadSettingsState(), startDate = new Date()) {
  const context = getProjectionContext(state, startDate);
  return Object.freeze({ context, exportMetadata: createProjectionExportMetadata(context) });
}

/** Adds the persisted global horizon to either accepted Monte Carlo method input. */
export function applyProjectionHorizonToMonteCarloInputs(rawInputs = {}, horizonYears) {
  const horizon = parseProjectionHorizon(horizonYears);
  if (horizon === null) throw new RangeError('Projection horizon must be an integer from 1 through 10 years.');
  return { ...rawInputs, horizonYears: horizon };
}

/** Metadata hook for future credential-free backup and PNG export managers. */
export function createProjectionExportMetadata(context) {
  const value = normalizeProjectionContext(context);
  if (!value) throw new TypeError('A valid projection context is required for export metadata.');
  return Object.freeze({
    projectionHorizonYears: value.horizonYears,
    projectionTradingDays: value.tradingDays,
    projectedThroughDate: value.projectedThroughDate,
    projectedThroughLabel: value.projectedThroughLabel
  });
}

/** Rejects output that was not completed for the approved global run snapshot. */
export function validateAcceptedProjectionResult(result, projectionContext) {
  const context = normalizeProjectionContext(projectionContext || result?.projectionContext || result?.horizonYears);
  if (!context) return rejectedResult('The result does not include a valid approved projection-date snapshot.');
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    return rejectedResult('A completed Monte Carlo result is required.');
  }
  if (result.kind !== 'infrastructure-ready' || !['gbm', 'historical-bootstrap'].includes(result.method)) {
    return rejectedResult('The result is not an accepted GBM or Historical Bootstrap simulation.');
  }
  if (result.horizonYears !== context.horizonYears
    || result.tradingDaysPerYear !== projectionTradingDays(1)
    || result.totalTradingDays !== context.tradingDays) {
    return rejectedResult('The result does not match the approved projection horizon and trading-day length.');
  }
  if (!validPercentileSeries(result.confidenceFan, ['p10', 'p50', 'p90'], context.tradingDays)
    || !validPercentileSeries(result.percentileBands, ['p5', 'p10', 'p25', 'p50', 'p75', 'p90', 'p95'], context.tradingDays)) {
    return rejectedResult('The result does not contain complete daily percentile output for the approved horizon.');
  }
  return Object.freeze({
    accepted: true,
    value: Object.freeze({
      ...result,
      projectionContext: context,
      projectionExportMetadata: createProjectionExportMetadata(context)
    })
  });
}

export function saveProjectionHorizon(rawValue, options = {}) {
  const horizonYears = parseProjectionHorizon(rawValue);
  if (horizonYears === null) {
    return { accepted: false, error: 'Enter a whole number from 1 through 10 years.' };
  }
  const loadState = options.loadState || loadSettingsState;
  const saveState = options.saveState || saveSettingsState;
  const startDate = options.startDate || new Date();
  const current = loadState();
  const previousHorizonYears = current.projectionHorizonYears;
  if (previousHorizonYears === horizonYears) {
    return { accepted: true, changed: false, state: current, context: getProjectionContext(current, startDate) };
  }
  const changedAt = new Date().toISOString();
  const next = {
    ...current,
    projectionHorizonYears: horizonYears,
    dependentDataState: {
      ...(current.dependentDataState || {}),
      simulations: 'stale',
      staleReason: PROJECTION_HORIZON_STALE_REASON,
      invalidatedAt: changedAt
    }
  };
  const state = saveState(next, { incrementEditCount: true });
  const context = getProjectionContext(state, startDate);
  return { accepted: true, changed: true, state, previousHorizonYears, context };
}

/**
 * Wires mirrored dashboard-header and Settings inputs to one persisted value.
 * Only committed change events save or notify; input events merely validate,
 * so entering or pasting text never starts an expensive simulation.
 */
export function initProjectionHorizonControls(root = document, options = {}) {
  const ownerWindow = root.defaultView || root.ownerDocument?.defaultView || window;
  const controls = Array.from(root.querySelectorAll('[data-projection-horizon-input]'));
  const listeners = [];
  const now = typeof options.now === 'function' ? options.now : () => new Date();
  const onChanged = typeof options.onChanged === 'function' ? options.onChanged : null;
  let state = (options.loadState || loadSettingsState)();

  const render = (nextState = state) => {
    state = nextState;
    const context = getProjectionContext(state, now());
    controls.forEach((input) => {
      input.value = String(context.horizonYears);
      input.setAttribute('aria-invalid', 'false');
      input.setCustomValidity?.('');
    });
    root.querySelectorAll('[data-projection-horizon]').forEach((node) => { node.textContent = context.horizonLabel; });
    root.querySelectorAll('[data-projection-trading-days]').forEach((node) => { node.textContent = context.tradingDaysLabel; });
    root.querySelectorAll('[data-projected-through]').forEach((node) => { node.textContent = context.projectedThroughLabel; });
    root.querySelectorAll('[data-projection-context]').forEach((node) => {
      node.textContent = `${context.horizonLabel} · Projected Through: ${context.projectedThroughLabel} · ${context.tradingDaysLabel}`;
    });
    return context;
  };

  const validateWithoutCommit = (input) => {
    const valid = parseProjectionHorizon(input.value) !== null;
    input.setAttribute('aria-invalid', String(!valid));
    input.setCustomValidity?.(valid ? '' : 'Enter a whole number from 1 through 10 years.');
  };
  const commit = (input) => {
    const result = saveProjectionHorizon(input.value, {
      loadState: options.loadState,
      saveState: options.saveState,
      startDate: now()
    });
    if (!result.accepted) {
      input.setCustomValidity?.(result.error);
      input.reportValidity?.();
      render(state);
      return;
    }
    const context = render(result.state);
    if (!result.changed) return;
    const detail = {
      previousHorizonYears: result.previousHorizonYears,
      ...context,
      exportMetadata: createProjectionExportMetadata(context),
      applyToMonteCarloInputs: (rawInputs) => applyProjectionHorizonToMonteCarloInputs(rawInputs, context.horizonYears)
    };
    ownerWindow.dispatchEvent(new CustomEvent(PROJECTION_HORIZON_CHANGED_EVENT, { detail }));
    ownerWindow.dispatchEvent(new CustomEvent(PROJECTION_INPUTS_CHANGED_EVENT, { detail }));
    onChanged?.(detail);
  };

  controls.forEach((input) => {
    input.min = '1'; input.max = '10'; input.step = '1'; input.inputMode = 'numeric';
    const onInput = () => validateWithoutCommit(input);
    const onChange = () => commit(input);
    input.addEventListener('input', onInput);
    input.addEventListener('change', onChange);
    listeners.push({ input, onInput, onChange });
  });
  render();
  return {
    getContext: () => getProjectionContext(state, now()),
    applyToMonteCarloInputs: (rawInputs) => applyProjectionHorizonToMonteCarloInputs(rawInputs, state.projectionHorizonYears),
    destroy: () => listeners.forEach(({ input, onInput, onChange }) => {
      input.removeEventListener('input', onInput);
      input.removeEventListener('change', onChange);
    })
  };
}

export { projectionTradingDays };

function normalizeProjectionContext(value) {
  if (value?.horizonYears && value?.tradingDays && value?.projectedThroughDate) {
    const expected = createProjectionDateContext(value.horizonYears, value.startDate || new Date());
    if (value.tradingDays === expected.tradingDays
      && value.projectedThroughDate === expected.projectedThroughDate
      && value.projectedThroughLabel === expected.projectedThroughLabel) return expected;
    return null;
  }
  try {
    return createProjectionDateContext(value ?? 5);
  } catch (_error) {
    return null;
  }
}

function validPercentileSeries(values, keys, totalTradingDays) {
  return Array.isArray(values)
    && values.length === totalTradingDays + 1
    && values.every((point, index) => point?.day === index && keys.every((key) => Number.isFinite(point[key])));
}

function rejectedResult(message) {
  return Object.freeze({ accepted: false, error: message });
}

import { createProjectionDateContext } from '../utils/projection-date-utils.js';
import { createConfidenceFanOption } from './mc-confidence-fan.js';
import { validateAcceptedProjectionResult } from '../settings/projection-settings.js';

const PERCENTILES = ['p5', 'p10', 'p25', 'p50', 'p75', 'p90', 'p95'];

export function createPercentileBandsPreparedData(result, projectionContext) {
  const requestedContext = projectionContext?.tradingDays ? projectionContext : createProjectionDateContext(result?.horizonYears || 5);
  const accepted = validateAcceptedProjectionResult(result, requestedContext);
  if (!accepted.accepted) {
    return { status: 'unavailable', message: accepted.error, projectionContext: requestedContext, series: [], methodologyLabel: 'Monte Carlo percentile bands require a completed GBM or Historical Bootstrap simulation.' };
  }
  const acceptedResult = accepted.value;
  const context = acceptedResult.projectionContext;
  const values = acceptedResult.percentileBands;
  const method = acceptedResult.method === 'historical-bootstrap' ? 'Historical Bootstrap Monte Carlo' : 'Geometric Brownian Motion (GBM) Monte Carlo';
  return {
    status: 'ready', visual: 'mc-percentile-bands', unit: 'currency', projectionContext: context,
    methodologyLabel: `${method}. Daily P5, P10, P25, P50, P75, P90, and P95 portfolio values are percentiles across completed simulated paths.`,
    summary: `${context.horizonLabel}; Projected Through: ${context.projectedThroughLabel}; ${context.tradingDaysLabel}. Bands show daily simulated portfolio-value percentiles.`,
    series: PERCENTILES.map((key) => ({ id: key, name: key.toUpperCase() + (key === 'p50' ? ' median' : ''), data: values.map((point) => [point.day, point[key]]) })),
    percentileBands: values.map((point) => Object.fromEntries(['day', ...PERCENTILES].map((key) => [key, point[key]])))
  };
}

export function createPercentileBandsOption(prepared, context = {}) {
  const points = prepared.percentileBands || [];
  const projection = prepared.projectionContext || context.projectionContext;
  // Reuse the responsive projection-axis, title, tooltip, and PNG context.
  const shared = createConfidenceFanOption({ confidenceFan: points.map((point) => ({ day: point.day, p10: point.p10, p50: point.p50, p90: point.p90 })), projectionContext: projection, title: 'Monte Carlo percentile bands' }, context);
  const styles = { p5: '#7c3aed', p10: '#2563eb', p25: '#0891b2', p50: '#0f172a', p75: '#059669', p90: '#d97706', p95: '#dc2626' };
  return {
    ...shared,
    legend: { ...shared.legend, data: PERCENTILES.map((key) => key.toUpperCase() + (key === 'p50' ? ' median' : '')) },
    series: PERCENTILES.map((key) => ({ name: key.toUpperCase() + (key === 'p50' ? ' median' : ''), type: 'line', data: points.map((point) => [point.day, point[key]]), symbol: 'none', lineStyle: { color: styles[key], width: key === 'p50' ? 3 : 1.75, type: key === 'p50' ? 'solid' : 'dashed' } }))
  };
}

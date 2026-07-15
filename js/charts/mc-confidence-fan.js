import { createProjectionDateContext } from '../utils/projection-date-utils.js';
import { validateAcceptedProjectionResult } from '../settings/projection-settings.js';

export function createConfidenceFanPreparedData(result, projectionContext) {
  const requestedContext = normalizeContext(projectionContext, result?.horizonYears);
  const accepted = validateAcceptedProjectionResult(result, requestedContext);
  if (!accepted.accepted) {
    return unavailable(accepted.error, requestedContext);
  }
  const acceptedResult = accepted.value;
  const context = acceptedResult.projectionContext;
  const values = acceptedResult.confidenceFan;
  const method = methodLabel(acceptedResult.method);
  const points = values.map((point) => ({ day: point.day, p10: point.p10, p50: point.p50, p90: point.p90 }));
  return {
    status: 'ready', visual: 'mc-confidence-fan', unit: 'currency', method: acceptedResult.method,
    projectionContext: context,
    methodologyLabel: `${method}. Shaded P10–P90 range and P50 median are calculated from completed simulated portfolio paths.`,
    summary: `${context.horizonLabel}; Projected Through: ${context.projectedThroughLabel}; ${context.tradingDaysLabel}. ${points.length - 1} daily percentile observations from ${formatPathCount(acceptedResult.pathCount)} paths.`,
    series: [
      { id: 'p10', name: 'P10', data: points.map((point) => [point.day, point.p10]) },
      { id: 'p50', name: 'P50 median', data: points.map((point) => [point.day, point.p50]) },
      { id: 'p90', name: 'P90', data: points.map((point) => [point.day, point.p90]) }
    ],
    confidenceFan: points
  };
}

export function createConfidenceFanOption(prepared, context = {}) {
  const points = prepared.confidenceFan || [];
  const projection = prepared.projectionContext || context.projectionContext;
  const shared = baseProjectionOption(prepared, context, projection);
  return {
    ...shared,
    legend: { ...shared.legend, data: ['P10', 'P50 median', 'P90'] },
    series: [
      { name: 'P10 baseline', type: 'line', data: points.map((point) => [point.day, point.p10]), stack: 'confidence', symbol: 'none', lineStyle: { opacity: 0 }, areaStyle: { opacity: 0 }, silent: true },
      { name: 'P10–P90 confidence range', type: 'line', data: points.map((point) => [point.day, point.p90 - point.p10]), stack: 'confidence', symbol: 'none', lineStyle: { opacity: 0 }, areaStyle: { color: '#60a5fa', opacity: 0.36 }, silent: true },
      { name: 'P10', type: 'line', data: points.map((point) => [point.day, point.p10]), symbol: 'none', lineStyle: { color: '#1d4ed8', type: 'dashed', width: 2 } },
      { name: 'P50 median', type: 'line', data: points.map((point) => [point.day, point.p50]), symbol: 'none', lineStyle: { color: '#0f172a', width: 3 } },
      { name: 'P90', type: 'line', data: points.map((point) => [point.day, point.p90]), symbol: 'none', lineStyle: { color: '#1d4ed8', type: 'dashed', width: 2 } }
    ]
  };
}

function baseProjectionOption(prepared, context, projection) {
  const subtitle = projection ? `${projection.horizonLabel} · Projected Through: ${projection.projectedThroughLabel} · ${projection.tradingDaysLabel}` : '';
  return {
    animation: context.reduceMotion !== true, aria: { enabled: true, decal: { show: true } },
    title: { show: true, text: prepared.title || 'Monte Carlo confidence fan', subtext: subtitle, left: 'center', textStyle: { color: context.textColor, fontSize: 14 }, subtextStyle: { color: context.mutedTextColor, fontSize: 11 } },
    grid: { left: 16, right: 16, top: 74, bottom: 64, containLabel: true },
    legend: { type: 'scroll', top: 44, textStyle: { color: context.textColor } },
    tooltip: { trigger: 'axis', confine: true, valueFormatter: (value) => formatCurrency(value) },
    xAxis: { type: 'value', name: 'Simulation trading day', min: 0, max: projection?.tradingDays, axisLabel: { color: context.mutedTextColor }, axisLine: { lineStyle: { color: context.axisColor } } },
    yAxis: { type: 'value', name: 'Portfolio value', scale: true, axisLabel: { color: context.mutedTextColor, formatter: formatCompactCurrency }, splitLine: { lineStyle: { color: context.gridColor } } },
    dataZoom: [{ type: 'inside', start: context.zoom?.start ?? 0, end: context.zoom?.end ?? 100 }, { type: 'slider', height: 22, bottom: 12, start: context.zoom?.start ?? 0, end: context.zoom?.end ?? 100 }]
  };
}

function normalizeContext(context, horizonYears) { return context?.tradingDays ? context : createProjectionDateContext(horizonYears || 5); }
function unavailable(message, projectionContext) { return { status: 'unavailable', message, projectionContext, series: [], methodologyLabel: 'Monte Carlo confidence fan requires a completed GBM or Historical Bootstrap simulation.' }; }
function methodLabel(method) { return method === 'historical-bootstrap' ? 'Historical Bootstrap Monte Carlo' : 'Geometric Brownian Motion (GBM) Monte Carlo'; }
function formatPathCount(value) { return Number.isFinite(value) ? Number(value).toLocaleString('en-US') : 'the selected'; }
function formatCurrency(value) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value); }
function formatCompactCurrency(value) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: Math.abs(value) >= 1000000 ? 'compact' : 'standard', maximumFractionDigits: 0 }).format(value); }

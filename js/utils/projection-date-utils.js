export const TRADING_DAYS_PER_PROJECTION_YEAR = 252;

export function isValidProjectionHorizon(value) {
  return Number.isInteger(value) && value >= 1 && value <= 10;
}

/** Converts a strict 1–10 year value without accepting decimals or partial text. */
export function parseProjectionHorizon(value) {
  if (typeof value === 'number') return isValidProjectionHorizon(value) ? value : null;
  const text = String(value ?? '').trim();
  if (!/^(?:[1-9]|10)$/.test(text)) return null;
  const parsed = Number(text);
  return isValidProjectionHorizon(parsed) ? parsed : null;
}

export function projectionTradingDays(horizonYears) {
  if (!isValidProjectionHorizon(horizonYears)) throw new RangeError('Projection horizon must be an integer from 1 through 10 years.');
  return horizonYears * TRADING_DAYS_PER_PROJECTION_YEAR;
}

/**
 * Calendar context is deliberately separate from the 252-day statistical run
 * length. It preserves local calendar dates and maps leap-day anniversaries to
 * February 28 in non-leap years.
 */
export function addCalendarYears(startDate, years) {
  const date = normalizeLocalDate(startDate);
  if (!isValidProjectionHorizon(years)) throw new RangeError('Projection horizon must be an integer from 1 through 10 years.');
  const result = new Date(date.getFullYear() + years, date.getMonth(), 1);
  result.setDate(Math.min(date.getDate(), daysInMonth(result.getFullYear(), result.getMonth())));
  return result;
}

export function createProjectionDateContext(horizonYears, startDate = new Date()) {
  const normalizedHorizon = parseProjectionHorizon(horizonYears);
  if (normalizedHorizon === null) throw new RangeError('Projection horizon must be an integer from 1 through 10 years.');
  const start = normalizeLocalDate(startDate);
  const projectedThrough = addCalendarYears(start, normalizedHorizon);
  const tradingDays = projectionTradingDays(normalizedHorizon);
  return Object.freeze({
    horizonYears: normalizedHorizon,
    tradingDays,
    startDate: toLocalIsoDate(start),
    projectedThroughDate: toLocalIsoDate(projectedThrough),
    projectedThroughLabel: formatProjectionDate(projectedThrough),
    horizonLabel: formatProjectionHorizon(normalizedHorizon),
    tradingDaysLabel: `${tradingDays.toLocaleString('en-US')} statistical trading days`
  });
}

export function formatProjectionDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  }).format(normalizeLocalDate(value));
}

export function formatProjectionHorizon(horizonYears) {
  const value = parseProjectionHorizon(horizonYears);
  if (value === null) return 'Invalid horizon';
  return `${value} ${value === 1 ? 'Year' : 'Years'}`;
}

function normalizeLocalDate(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);
    if (parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day) return parsed;
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw new TypeError('A valid projection start date is required.');
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function toLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

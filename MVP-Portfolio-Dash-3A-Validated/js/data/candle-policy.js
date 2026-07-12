/*
  Phase 2B revision: Finnhub candle data policy.
  MVP rule: daily candles only, with live Finnhub requests capped to 350 calendar days.
  Older daily candles may remain in local cache and accumulate over time.
*/

export const CANDLE_DATA_POLICY = Object.freeze({
  MVP_RESOLUTION: 'D',
  MAX_LIVE_LOOKBACK_DAYS: 350,
  MAX_LIVE_LOOKBACK_SECONDS: 350 * 24 * 60 * 60,
  CACHE_RETENTION: 'keep-successful-daily-candles-indefinitely-until-user-clears-cache',
  MONTHLY_FALLBACK_ALLOWED: false,
  INTRADAY_ALLOWED_IN_MVP: false,
  MONTE_CARLO_MIN_ALIGNED_OBSERVATIONS: 126,
  MONTE_CARLO_PREFERRED_ALIGNED_OBSERVATIONS: 252,
  CAGR_UNDER_ONE_YEAR_MODE: 'annualized-short-period-estimate-with-warning'
});

export function normalizeDailyResolution(resolution) {
  var raw = String(resolution || CANDLE_DATA_POLICY.MVP_RESOLUTION).trim().toUpperCase();
  if (raw !== CANDLE_DATA_POLICY.MVP_RESOLUTION) {
    var error = new RangeError('Intraday and non-daily Finnhub candle resolutions are unsupported in the MVP. Use resolution=D.');
    error.code = 'unsupported-candle-resolution';
    error.resolution = raw;
    throw error;
  }
  return CANDLE_DATA_POLICY.MVP_RESOLUTION;
}

export function unixSecondsFrom(value, label) {
  if (value instanceof Date) {
    return Math.floor(value.getTime() / 1000);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.floor(value > 100000000000 ? value / 1000 : value);
  }

  if (typeof value === 'string') {
    var trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      return unixSecondsFrom(Number(trimmed), label);
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return Math.floor(Date.UTC(
        Number(trimmed.slice(0, 4)),
        Number(trimmed.slice(5, 7)) - 1,
        Number(trimmed.slice(8, 10))
      ) / 1000);
    }

    if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
      var parsed = Date.parse(trimmed);
      if (!Number.isNaN(parsed)) return Math.floor(parsed / 1000);
    }
  }

  throw new TypeError('Invalid ' + (label || 'timestamp') + '. Expected Unix seconds, Date, YYYY-MM-DD, or explicit ISO datetime string.');
}

export function planDailyCandleRequest(options) {
  var opts = options || {};
  var referenceMs = typeof opts.referenceMs === 'number' ? opts.referenceMs : Date.now();
  var currentUnixSeconds = Math.floor(referenceMs / 1000);
  var resolution = normalizeDailyResolution(opts.resolution || CANDLE_DATA_POLICY.MVP_RESOLUTION);
  var requestedToRaw = opts.to === undefined || opts.to === null ? currentUnixSeconds : unixSecondsFrom(opts.to, 'to');
  var requestedTo = Math.min(requestedToRaw, currentUnixSeconds);
  var requestedFrom = opts.from === undefined || opts.from === null ? requestedTo - CANDLE_DATA_POLICY.MAX_LIVE_LOOKBACK_SECONDS : unixSecondsFrom(opts.from, 'from');

  if (!Number.isFinite(requestedFrom) || !Number.isFinite(requestedTo) || requestedFrom >= requestedTo) {
    var rangeError = new RangeError('Invalid candle request range. Expected from < to.');
    rangeError.code = 'invalid-candle-range';
    throw rangeError;
  }

  var earliestLiveFrom = currentUnixSeconds - CANDLE_DATA_POLICY.MAX_LIVE_LOOKBACK_SECONDS;
  var liveFrom = null;
  var liveTo = null;

  if (requestedTo >= earliestLiveFrom) {
    liveFrom = Math.max(requestedFrom, earliestLiveFrom);
    liveTo = requestedTo;
  }

  var wasClamped = liveFrom !== null && liveFrom > requestedFrom;
  var warnings = [];
  if (requestedToRaw > currentUnixSeconds) {
    warnings.push('Requested candle end date was in the future and was clamped to the current time.');
  }
  if (wasClamped) {
    warnings.push('Live Finnhub candle request was clamped to the latest ' + CANDLE_DATA_POLICY.MAX_LIVE_LOOKBACK_DAYS + ' calendar days.');
  }
  if (liveFrom === null) {
    warnings.push('Requested range is older than the permitted live Finnhub candle window. Accumulated cache is required.');
  }

  return {
    resolution: resolution,
    requestedFrom: requestedFrom,
    requestedTo: requestedTo,
    requestedToRaw: requestedToRaw,
    currentUnixSeconds: currentUnixSeconds,
    earliestLiveFrom: earliestLiveFrom,
    liveFrom: liveFrom,
    liveTo: liveTo,
    wasClamped: wasClamped,
    maxLiveLookbackDays: CANDLE_DATA_POLICY.MAX_LIVE_LOOKBACK_DAYS,
    requestedLookbackDays: Math.ceil((requestedTo - requestedFrom) / 86400),
    liveLookbackDays: liveFrom === null ? 0 : Math.ceil((liveTo - liveFrom) / 86400),
    warnings: warnings
  };
}

export function normalizeCandleList(candles) {
  return (candles || [])
    .filter(function(candle) {
      return candle && Number.isFinite(Number(candle.timestamp)) && Number.isFinite(Number(candle.close)) && Number(candle.close) > 0;
    })
    .map(function(candle) {
      var timestamp = Number(candle.timestamp);
      return Object.assign({}, candle, {
        timestamp: timestamp,
        date: candle.date || new Date(timestamp * 1000).toISOString().slice(0, 10),
        close: Number(candle.close),
        open: Number.isFinite(Number(candle.open)) ? Number(candle.open) : null,
        high: Number.isFinite(Number(candle.high)) ? Number(candle.high) : null,
        low: Number.isFinite(Number(candle.low)) ? Number(candle.low) : null,
        volume: Number.isFinite(Number(candle.volume)) ? Number(candle.volume) : null
      });
    })
    .sort(function(a, b) { return a.timestamp - b.timestamp; });
}

export function mergeCandleSets(existingCandles, incomingCandles) {
  var byTimestamp = new Map();
  normalizeCandleList(existingCandles).forEach(function(candle) {
    byTimestamp.set(String(candle.timestamp), candle);
  });
  normalizeCandleList(incomingCandles).forEach(function(candle) {
    byTimestamp.set(String(candle.timestamp), candle);
  });
  return Array.from(byTimestamp.values()).sort(function(a, b) { return a.timestamp - b.timestamp; });
}

export function filterCandlesByRange(candles, fromUnixSeconds, toUnixSeconds) {
  var from = unixSecondsFrom(fromUnixSeconds, 'from');
  var to = unixSecondsFrom(toUnixSeconds, 'to');
  return normalizeCandleList(candles).filter(function(candle) {
    return candle.timestamp >= from && candle.timestamp <= to;
  });
}

export function getCandleBounds(candles) {
  var normalized = normalizeCandleList(candles);
  if (!normalized.length) {
    return {
      firstTimestamp: null,
      lastTimestamp: null,
      firstDate: null,
      lastDate: null,
      observations: 0
    };
  }

  var first = normalized[0];
  var last = normalized[normalized.length - 1];
  return {
    firstTimestamp: first.timestamp,
    lastTimestamp: last.timestamp,
    firstDate: first.date,
    lastDate: last.date,
    observations: normalized.length
  };
}

export function assessCandleCoverage(candles, plan) {
  var filtered = filterCandlesByRange(candles, plan.requestedFrom, plan.requestedTo);
  var allBounds = getCandleBounds(candles);
  var displayedBounds = getCandleBounds(filtered);
  var insufficient = filtered.length < 2 ||
    (allBounds.firstTimestamp !== null && allBounds.firstTimestamp > plan.requestedFrom) ||
    (allBounds.lastTimestamp !== null && allBounds.lastTimestamp < plan.requestedTo);

  var warnings = plan.warnings.slice();
  if (filtered.length < 2) {
    warnings.push('Fewer than two daily candle observations are available for the requested range.');
  } else if (insufficient) {
    warnings.push('Requested historical range is limited by available daily candle cache and Finnhub free-tier depth.');
  }

  return {
    filteredCandles: filtered,
    allBounds: allBounds,
    displayedBounds: displayedBounds,
    insufficient: insufficient,
    warnings: warnings
  };
}

export function assessMonteCarloObservationCount(observationCount) {
  var count = Number(observationCount);
  if (!Number.isFinite(count) || count < CANDLE_DATA_POLICY.MONTE_CARLO_MIN_ALIGNED_OBSERVATIONS) {
    return {
      canRun: false,
      availability: 'insufficient-history',
      observationCount: Number.isFinite(count) ? count : 0,
      minimumRequired: CANDLE_DATA_POLICY.MONTE_CARLO_MIN_ALIGNED_OBSERVATIONS,
      preferredMinimum: CANDLE_DATA_POLICY.MONTE_CARLO_PREFERRED_ALIGNED_OBSERVATIONS,
      warning: 'Monte Carlo requires at least ' + CANDLE_DATA_POLICY.MONTE_CARLO_MIN_ALIGNED_OBSERVATIONS + ' aligned daily observations.'
    };
  }

  if (count < CANDLE_DATA_POLICY.MONTE_CARLO_PREFERRED_ALIGNED_OBSERVATIONS) {
    return {
      canRun: true,
      availability: 'available',
      observationCount: count,
      minimumRequired: CANDLE_DATA_POLICY.MONTE_CARLO_MIN_ALIGNED_OBSERVATIONS,
      preferredMinimum: CANDLE_DATA_POLICY.MONTE_CARLO_PREFERRED_ALIGNED_OBSERVATIONS,
      warning: 'Monte Carlo can run, but the lookback is shorter than the preferred 252 aligned daily observations.'
    };
  }

  return {
    canRun: true,
    availability: 'available',
    observationCount: count,
    minimumRequired: CANDLE_DATA_POLICY.MONTE_CARLO_MIN_ALIGNED_OBSERVATIONS,
    preferredMinimum: CANDLE_DATA_POLICY.MONTE_CARLO_PREFERRED_ALIGNED_OBSERVATIONS,
    warning: null
  };
}

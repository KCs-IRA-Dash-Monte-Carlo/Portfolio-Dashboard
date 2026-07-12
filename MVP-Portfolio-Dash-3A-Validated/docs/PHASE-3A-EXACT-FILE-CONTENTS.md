# Phase 3A Exact File Contents

These are the exact contents of the seven authorized Phase 3A implementation files in this package.

## `js/portfolio/portfolio-model.js`

```javascript
import { createLot, normalizeTicker, updateLot } from "./lot-model.js";
import { assertValidPortfolio } from "./portfolio-validation.js";

export const PORTFOLIO_MODEL_VERSION = "2.2-phase-3a";

export class PortfolioModelError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "PortfolioModelError";
    this.code = code;
    this.details = details && typeof details === "object" ? { ...details } : {};
  }
}

export function createHolding(input, options = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new PortfolioModelError("HOLDING_OBJECT_REQUIRED", "Holding input must be an object.");
  }
  const ticker = normalizeTicker(input.ticker);
  const lotsInput = Array.isArray(input.lots) ? input.lots : [];
  if (lotsInput.length === 0) {
    throw new PortfolioModelError("HOLDING_LOTS_REQUIRED", "A holding must contain at least one lot.");
  }
  const lots = lotsInput.map((lot) => createLot({ ...lot, ticker }, options));
  return Object.freeze({
    id: normalizeId(input.id, "holding", options.idFactory),
    recordType: "holding",
    ticker,
    active: input.active !== false,
    lots: Object.freeze(lots),
    modelVersion: PORTFOLIO_MODEL_VERSION
  });
}

export function createPortfolio(input = {}, options = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new PortfolioModelError("PORTFOLIO_OBJECT_REQUIRED", "Portfolio input must be an object.");
  }
  const holdings = Array.isArray(input.holdings)
    ? input.holdings.map((holding) => createHolding(holding, options))
    : [];
  const portfolio = {
    id: normalizeId(input.id, "portfolio", options.idFactory),
    recordType: "portfolio",
    name: normalizeName(input.name),
    holdings: Object.freeze(holdings),
    benchmarks: Object.freeze(Array.isArray(input.benchmarks)
      ? input.benchmarks.map(clonePlain)
      : []),
    modelVersion: PORTFOLIO_MODEL_VERSION
  };
  const normalized = assertValidPortfolio(portfolio, options);
  return freezePortfolio(normalized);
}

/**
 * Adds a new holding. To add shares to an existing ticker, call addLotToHolding;
 * duplicate holding records are rejected by validation.
 */
export function addHolding(portfolio, holdingInput, options = {}) {
  const current = assertValidPortfolio(portfolio, options);
  const holding = createHolding(holdingInput, options);
  if (current.holdings.some((entry) => entry.ticker === holding.ticker)) {
    throw new PortfolioModelError(
      "HOLDING_ALREADY_EXISTS",
      `${holding.ticker} already exists. Add a new lot instead.`,
      { ticker: holding.ticker }
    );
  }
  return createPortfolio({ ...current, holdings: [...current.holdings, holding] }, options);
}

export function editHolding(portfolio, holdingId, changes, options = {}) {
  const current = assertValidPortfolio(portfolio, options);
  const index = findHoldingIndex(current, holdingId);
  const existing = current.holdings[index];
  const ticker = changes && changes.ticker !== undefined
    ? normalizeTicker(changes.ticker)
    : existing.ticker;
  if (ticker !== existing.ticker && current.holdings.some(
    (holding, holdingIndex) => holdingIndex !== index && holding.ticker === ticker
  )) {
    throw new PortfolioModelError(
      "HOLDING_ALREADY_EXISTS",
      `${ticker} already exists as another holding.`,
      { ticker }
    );
  }
  const nextHolding = createHolding({
    ...existing,
    ...changes,
    id: existing.id,
    ticker,
    lots: existing.lots.map((lot) => ({ ...lot, ticker }))
  }, options);
  const holdings = current.holdings.slice();
  holdings[index] = nextHolding;
  return createPortfolio({ ...current, holdings }, options);
}

export function deleteHolding(portfolio, holdingId, options = {}) {
  const current = assertValidPortfolio(portfolio, options);
  const index = findHoldingIndex(current, holdingId);
  const holdings = current.holdings.slice();
  holdings.splice(index, 1);
  return createPortfolio({ ...current, holdings }, options);
}

/**
 * Always creates a distinct lot record. It never merges into or mutates an
 * existing lot, satisfying the add-to-position rule.
 */
export function addLotToHolding(portfolio, holdingId, lotInput, options = {}) {
  const current = assertValidPortfolio(portfolio, options);
  const index = findHoldingIndex(current, holdingId);
  const holding = current.holdings[index];
  const lot = createLot({ ...lotInput, ticker: holding.ticker }, options);
  const holdings = current.holdings.slice();
  holdings[index] = createHolding({
    ...holding,
    lots: [...holding.lots, lot]
  }, options);
  return createPortfolio({ ...current, holdings }, options);
}

/** Explicitly edits one existing lot by id. */
export function editLot(portfolio, holdingId, lotId, changes, options = {}) {
  const current = assertValidPortfolio(portfolio, options);
  const holdingIndex = findHoldingIndex(current, holdingId);
  const holding = current.holdings[holdingIndex];
  const lotIndex = findLotIndex(holding, lotId);
  const lots = holding.lots.slice();
  lots[lotIndex] = updateLot(lots[lotIndex], {
    ...changes,
    ticker: holding.ticker
  }, options);
  const holdings = current.holdings.slice();
  holdings[holdingIndex] = createHolding({ ...holding, lots }, options);
  return createPortfolio({ ...current, holdings }, options);
}

export function deleteLot(portfolio, holdingId, lotId, options = {}) {
  const current = assertValidPortfolio(portfolio, options);
  const holdingIndex = findHoldingIndex(current, holdingId);
  const holding = current.holdings[holdingIndex];
  const lotIndex = findLotIndex(holding, lotId);
  if (holding.lots.length === 1) {
    throw new PortfolioModelError(
      "HOLDING_LAST_LOT_DELETE_BLOCKED",
      "Delete the holding instead of deleting its only lot.",
      { holdingId, lotId }
    );
  }
  const lots = holding.lots.slice();
  lots.splice(lotIndex, 1);
  const holdings = current.holdings.slice();
  holdings[holdingIndex] = createHolding({ ...holding, lots }, options);
  return createPortfolio({ ...current, holdings }, options);
}

export function clonePortfolio(portfolio, options = {}) {
  return createPortfolio(clonePlain(portfolio), options);
}

function findHoldingIndex(portfolio, holdingId) {
  const index = portfolio.holdings.findIndex((holding) => holding.id === holdingId);
  if (index < 0) {
    throw new PortfolioModelError("HOLDING_NOT_FOUND", "Holding was not found.", { holdingId });
  }
  return index;
}

function findLotIndex(holding, lotId) {
  const index = holding.lots.findIndex((lot) => lot.id === lotId);
  if (index < 0) {
    throw new PortfolioModelError("LOT_NOT_FOUND", "Lot was not found.", { lotId });
  }
  return index;
}

function normalizeName(value) {
  if (value === undefined || value === null) return "Portfolio";
  if (typeof value !== "string") {
    throw new PortfolioModelError("PORTFOLIO_NAME_INVALID", "Portfolio name must be a string.");
  }
  return value.trim() || "Portfolio";
}

function normalizeId(value, prefix, idFactory) {
  if (value !== undefined && value !== null) {
    if (typeof value !== "string" || !value.trim()) {
      throw new PortfolioModelError("MODEL_ID_INVALID", "Id must be a nonempty string.");
    }
    return value.trim();
  }
  const factory = typeof idFactory === "function" ? idFactory : createDefaultId;
  const id = factory(prefix);
  if (typeof id !== "string" || !id.trim()) {
    throw new PortfolioModelError("MODEL_ID_FACTORY_INVALID", "idFactory must return a nonempty string.");
  }
  return id.trim();
}

function createDefaultId(prefix) {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function freezePortfolio(portfolio) {
  const holdings = portfolio.holdings.map((holding) => Object.freeze({
    ...holding,
    lots: Object.freeze(holding.lots.map((lot) => Object.freeze({ ...lot })))
  }));
  return Object.freeze({
    ...portfolio,
    holdings: Object.freeze(holdings),
    benchmarks: Object.freeze((portfolio.benchmarks || []).map((entry) => Object.freeze(clonePlain(entry))))
  });
}

function clonePlain(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(clonePlain);
  if (typeof value === "object") {
    const output = {};
    Object.entries(value).forEach(([key, nested]) => {
      output[key] = clonePlain(nested);
    });
    return output;
  }
  return value;
}
```

## `js/portfolio/lot-model.js`

```javascript
import { normalizeDateOnly, resolveReferenceDate } from "../utils/date-utils.js";
import { toFiniteNumber } from "../utils/number-utils.js";

export const LOT_MODEL_VERSION = "2.2-phase-3a";
export const TICKER_PATTERN = /^[A-Z][A-Z0-9.-]{0,14}$/;

export class LotModelError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "LotModelError";
    this.code = code;
    this.details = details && typeof details === "object" ? { ...details } : {};
  }
}

export function normalizeTicker(value, name = "ticker") {
  if (typeof value !== "string" || !value.trim()) {
    throw new LotModelError("LOT_TICKER_REQUIRED", `${name} is required.`);
  }
  const ticker = value.trim().toUpperCase();
  if (!TICKER_PATTERN.test(ticker)) {
    throw new LotModelError(
      "LOT_TICKER_INVALID",
      `${name} must start with a letter and contain only letters, numbers, periods, or hyphens.`,
      { value }
    );
  }
  return ticker;
}

export function createLot(input, options = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new LotModelError("LOT_OBJECT_REQUIRED", "Lot input must be an object.");
  }

  const ticker = normalizeTicker(input.ticker);
  const shares = normalizePositiveNumber(input.shares, "shares", "LOT_SHARES_INVALID");
  const purchasePricePerShare = normalizePositiveNumber(
    input.purchasePricePerShare !== undefined ? input.purchasePricePerShare : input.purchasePrice,
    "purchasePricePerShare",
    "LOT_PURCHASE_PRICE_INVALID"
  );
  const acquisitionDate = normalizeRequiredDate(input.acquisitionDate);
  const referenceDate = resolveReferenceDate(options.referenceDate, options.now);
  if (acquisitionDate > referenceDate) {
    throw new LotModelError(
      "LOT_ACQUISITION_DATE_FUTURE",
      "acquisitionDate must not be in the future.",
      { acquisitionDate, referenceDate }
    );
  }

  return Object.freeze({
    id: normalizeId(input.id, "lot", options.idFactory),
    recordType: "lot",
    ticker,
    shares,
    purchasePricePerShare,
    acquisitionDate,
    auditNote: normalizeAuditNote(input.auditNote),
    modelVersion: LOT_MODEL_VERSION
  });
}

export function cloneLot(lot) {
  if (!lot || typeof lot !== "object" || Array.isArray(lot)) {
    throw new LotModelError("LOT_OBJECT_REQUIRED", "Lot must be an object.");
  }
  return {
    id: lot.id,
    recordType: lot.recordType || "lot",
    ticker: lot.ticker,
    shares: lot.shares,
    purchasePricePerShare: lot.purchasePricePerShare,
    acquisitionDate: lot.acquisitionDate,
    auditNote: lot.auditNote || "",
    modelVersion: lot.modelVersion || LOT_MODEL_VERSION
  };
}

export function updateLot(existingLot, changes, options = {}) {
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
    throw new LotModelError("LOT_CHANGES_REQUIRED", "Lot changes must be an object.");
  }
  const merged = {
    ...cloneLot(existingLot),
    ...changes,
    id: existingLot.id,
    ticker: changes.ticker === undefined ? existingLot.ticker : changes.ticker
  };
  return createLot(merged, options);
}

function normalizeRequiredDate(value) {
  if (value === undefined || value === null || value === "") {
    throw new LotModelError("LOT_ACQUISITION_DATE_REQUIRED", "acquisitionDate is required.");
  }
  try {
    return normalizeDateOnly(value, "acquisitionDate");
  } catch (error) {
    throw new LotModelError(
      "LOT_ACQUISITION_DATE_INVALID",
      error.message,
      { acquisitionDate: value }
    );
  }
}

function normalizePositiveNumber(value, name, code) {
  if (value === undefined || value === null || value === "") {
    throw new LotModelError(`${code}_REQUIRED`, `${name} is required.`);
  }
  try {
    return toFiniteNumber(value, { name, positive: true });
  } catch (error) {
    throw new LotModelError(code, error.message, { [name]: value });
  }
}

function normalizeAuditNote(value) {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    throw new LotModelError("LOT_AUDIT_NOTE_INVALID", "auditNote must be a string.");
  }
  return value.trim();
}

function normalizeId(value, prefix, idFactory) {
  if (value !== undefined && value !== null) {
    if (typeof value !== "string" || !value.trim()) {
      throw new LotModelError("LOT_ID_INVALID", "Lot id must be a nonempty string.");
    }
    return value.trim();
  }
  const factory = typeof idFactory === "function" ? idFactory : createDefaultId;
  const id = factory(prefix);
  if (typeof id !== "string" || !id.trim()) {
    throw new LotModelError("LOT_ID_FACTORY_INVALID", "idFactory must return a nonempty string.");
  }
  return id.trim();
}

function createDefaultId(prefix) {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  const random = Math.random().toString(36).slice(2, 11);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}
```

## `js/portfolio/portfolio-validation.js`

```javascript
import { isFutureDate, normalizeDateOnly, resolveReferenceDate } from "../utils/date-utils.js";
import { toFiniteNumber } from "../utils/number-utils.js";
import { TICKER_PATTERN } from "./lot-model.js";

export const PORTFOLIO_VALIDATION_VERSION = "2.2-phase-3a";

export class PortfolioValidationError extends Error {
  constructor(errors, message = "Portfolio validation failed.") {
    super(message);
    this.name = "PortfolioValidationError";
    this.code = "PORTFOLIO_VALIDATION_FAILED";
    this.errors = Array.isArray(errors) ? errors.map((error) => ({ ...error })) : [];
  }
}

export function validateTicker(value, path = "ticker") {
  const errors = [];
  if (typeof value !== "string" || !value.trim()) {
    errors.push(issue("PORTFOLIO_TICKER_REQUIRED", path, "Ticker is required."));
    return { valid: false, value: null, errors };
  }
  const ticker = value.trim().toUpperCase();
  if (!TICKER_PATTERN.test(ticker)) {
    errors.push(issue(
      "PORTFOLIO_TICKER_INVALID",
      path,
      "Ticker must start with a letter and contain only letters, numbers, periods, or hyphens.",
      value
    ));
  }
  return { valid: errors.length === 0, value: ticker, errors };
}

export function validateLot(input, options = {}) {
  const path = options.path || "lot";
  const referenceDate = resolveReferenceDate(options.referenceDate, options.now);
  const errors = [];
  if (!isRecord(input)) {
    return invalidResult(issue("PORTFOLIO_LOT_MALFORMED", path, "Lot must be an object.", input));
  }

  const tickerResult = validateTicker(input.ticker, `${path}.ticker`);
  errors.push(...tickerResult.errors);
  const shares = validatePositiveNumber(input.shares, `${path}.shares`, "PORTFOLIO_SHARES");
  errors.push(...shares.errors);
  const purchaseSource = input.purchasePricePerShare !== undefined
    ? input.purchasePricePerShare
    : input.purchasePrice;
  const price = validatePositiveNumber(
    purchaseSource,
    `${path}.purchasePricePerShare`,
    "PORTFOLIO_PURCHASE_PRICE"
  );
  errors.push(...price.errors);

  let acquisitionDate = null;
  if (input.acquisitionDate === undefined || input.acquisitionDate === null || input.acquisitionDate === "") {
    errors.push(issue(
      "PORTFOLIO_ACQUISITION_DATE_REQUIRED",
      `${path}.acquisitionDate`,
      "Acquisition date is required."
    ));
  } else {
    try {
      acquisitionDate = normalizeDateOnly(input.acquisitionDate, "acquisitionDate");
      if (isFutureDate(acquisitionDate, referenceDate)) {
        errors.push(issue(
          "PORTFOLIO_ACQUISITION_DATE_FUTURE",
          `${path}.acquisitionDate`,
          "Acquisition date must not be in the future.",
          input.acquisitionDate
        ));
      }
    } catch (_error) {
      errors.push(issue(
        "PORTFOLIO_ACQUISITION_DATE_INVALID",
        `${path}.acquisitionDate`,
        "Acquisition date must be a valid YYYY-MM-DD calendar date.",
        input.acquisitionDate
      ));
    }
  }

  const auditNote = input.auditNote === undefined || input.auditNote === null
    ? ""
    : input.auditNote;
  if (typeof auditNote !== "string") {
    errors.push(issue(
      "PORTFOLIO_AUDIT_NOTE_INVALID",
      `${path}.auditNote`,
      "Audit note must be a string.",
      auditNote
    ));
  }
  validateOptionalId(input.id, `${path}.id`, "PORTFOLIO_LOT_ID_INVALID", errors);
  if (input.recordType !== undefined && input.recordType !== "lot") {
    errors.push(issue(
      "PORTFOLIO_LOT_RECORD_TYPE_INVALID",
      `${path}.recordType`,
      "Lot recordType must be lot when present.",
      input.recordType
    ));
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized: errors.length === 0 ? {
      ...input,
      recordType: "lot",
      ticker: tickerResult.value,
      shares: shares.value,
      purchasePricePerShare: price.value,
      acquisitionDate,
      auditNote: auditNote.trim()
    } : null
  };
}

export function validateHolding(input, options = {}) {
  const path = options.path || "holding";
  const errors = [];
  if (!isRecord(input)) {
    return invalidResult(issue("PORTFOLIO_HOLDING_MALFORMED", path, "Holding must be an object.", input));
  }

  const tickerResult = validateTicker(input.ticker, `${path}.ticker`);
  errors.push(...tickerResult.errors);
  validateOptionalId(input.id, `${path}.id`, "PORTFOLIO_HOLDING_ID_INVALID", errors);
  if (input.recordType !== undefined && input.recordType !== "holding") {
    errors.push(issue(
      "PORTFOLIO_HOLDING_RECORD_TYPE_INVALID",
      `${path}.recordType`,
      "Holding recordType must be holding when present.",
      input.recordType
    ));
  }
  if (input.active !== undefined && typeof input.active !== "boolean") {
    errors.push(issue(
      "PORTFOLIO_HOLDING_ACTIVE_INVALID",
      `${path}.active`,
      "Holding active must be a boolean.",
      input.active
    ));
  }
  if (!Array.isArray(input.lots)) {
    errors.push(issue("PORTFOLIO_LOTS_MALFORMED", `${path}.lots`, "Holding lots must be an array.", input.lots));
    return { valid: false, errors, normalized: null };
  }
  if (input.lots.length === 0) {
    errors.push(issue("PORTFOLIO_LOTS_REQUIRED", `${path}.lots`, "A holding must contain at least one lot."));
  }

  const normalizedLots = [];
  const lotIds = new Set();
  input.lots.forEach((lot, index) => {
    const result = validateLot(lot, {
      ...options,
      path: `${path}.lots[${index}]`
    });
    errors.push(...result.errors);
    if (result.normalized) {
      normalizedLots.push(result.normalized);
      if (tickerResult.value && result.normalized.ticker !== tickerResult.value) {
        errors.push(issue(
          "PORTFOLIO_LOT_TICKER_MISMATCH",
          `${path}.lots[${index}].ticker`,
          "Each lot ticker must match its holding ticker.",
          result.normalized.ticker
        ));
      }
      if (result.normalized.id) {
        if (lotIds.has(result.normalized.id)) {
          errors.push(issue(
            "PORTFOLIO_DUPLICATE_LOT_ID",
            `${path}.lots[${index}].id`,
            "Lot ids must be unique within a holding.",
            result.normalized.id
          ));
        }
        lotIds.add(result.normalized.id);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    normalized: errors.length === 0 ? {
      ...input,
      recordType: "holding",
      ticker: tickerResult.value,
      active: input.active !== false,
      lots: normalizedLots
    } : null
  };
}

export function validatePortfolio(input, options = {}) {
  const errors = [];
  if (!isRecord(input)) {
    return invalidResult(issue("PORTFOLIO_MALFORMED", "portfolio", "Portfolio must be an object.", input));
  }
  if (input.recordType !== undefined && input.recordType !== "portfolio") {
    errors.push(issue(
      "PORTFOLIO_RECORD_TYPE_INVALID",
      "portfolio.recordType",
      "Portfolio recordType must be portfolio when present.",
      input.recordType
    ));
  }
  validateOptionalId(input.id, "portfolio.id", "PORTFOLIO_ID_INVALID", errors);
  if (input.name !== undefined && typeof input.name !== "string") {
    errors.push(issue("PORTFOLIO_NAME_INVALID", "portfolio.name", "Portfolio name must be a string.", input.name));
  }
  if (!Array.isArray(input.holdings)) {
    errors.push(issue(
      "PORTFOLIO_HOLDINGS_MALFORMED",
      "portfolio.holdings",
      "Portfolio holdings must be an array.",
      input.holdings
    ));
    return { valid: false, errors, normalized: null };
  }
  if (input.benchmarks !== undefined && !Array.isArray(input.benchmarks)) {
    errors.push(issue(
      "PORTFOLIO_BENCHMARKS_MALFORMED",
      "portfolio.benchmarks",
      "Benchmarks must remain a separate array when present.",
      input.benchmarks
    ));
  }

  const normalizedHoldings = [];
  const tickers = new Set();
  const holdingIds = new Set();
  input.holdings.forEach((holding, index) => {
    const result = validateHolding(holding, {
      ...options,
      path: `portfolio.holdings[${index}]`
    });
    errors.push(...result.errors);
    if (result.normalized) {
      normalizedHoldings.push(result.normalized);
      if (tickers.has(result.normalized.ticker)) {
        errors.push(issue(
          "PORTFOLIO_DUPLICATE_HOLDING",
          `portfolio.holdings[${index}].ticker`,
          "Multiple lots for one ticker must consolidate under one holding.",
          result.normalized.ticker
        ));
      }
      tickers.add(result.normalized.ticker);
      if (result.normalized.id) {
        if (holdingIds.has(result.normalized.id)) {
          errors.push(issue(
            "PORTFOLIO_DUPLICATE_HOLDING_ID",
            `portfolio.holdings[${index}].id`,
            "Holding ids must be unique.",
            result.normalized.id
          ));
        }
        holdingIds.add(result.normalized.id);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    normalized: errors.length === 0 ? {
      ...input,
      recordType: "portfolio",
      name: typeof input.name === "string" ? input.name.trim() : "",
      holdings: normalizedHoldings,
      benchmarks: Array.isArray(input.benchmarks)
        ? input.benchmarks.map((benchmark) => clonePlain(benchmark))
        : []
    } : null,
    version: PORTFOLIO_VALIDATION_VERSION
  };
}

export function assertValidPortfolio(input, options = {}) {
  const result = validatePortfolio(input, options);
  if (!result.valid) {
    throw new PortfolioValidationError(result.errors);
  }
  return result.normalized;
}

function validatePositiveNumber(value, path, prefix) {
  if (value === undefined || value === null || value === "") {
    return {
      value: null,
      errors: [issue(`${prefix}_REQUIRED`, path, "A value is required.", value)]
    };
  }
  try {
    return {
      value: toFiniteNumber(value, { name: path, positive: true }),
      errors: []
    };
  } catch (error) {
    const nonfinite = isNonfiniteInput(value);
    const code = nonfinite ? `${prefix}_NONFINITE` : `${prefix}_INVALID`;
    return { value: null, errors: [issue(code, path, error.message, value)] };
  }
}

function validateOptionalId(value, path, code, errors) {
  if (value !== undefined && value !== null && (typeof value !== "string" || !value.trim())) {
    errors.push(issue(code, path, "Id must be a nonempty string when present.", value));
  }
}

function isNonfiniteInput(value) {
  if (typeof value === "number") {
    return !Number.isFinite(value);
  }
  if (typeof value === "string" && value.trim()) {
    const number = Number(value);
    return !Number.isFinite(number);
  }
  return false;
}

function invalidResult(error) {
  return { valid: false, errors: [error], normalized: null };
}

function issue(code, path, message, value) {
  const result = { code, path, message };
  if (value !== undefined) {
    result.value = value;
  }
  return result;
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clonePlain(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(clonePlain);
  if (typeof value === "object") {
    const output = {};
    Object.entries(value).forEach(([key, nested]) => {
      output[key] = clonePlain(nested);
    });
    return output;
  }
  return value;
}
```

## `js/portfolio/portfolio-engine.js`

```javascript
import { compareDateOnly, minDateOnly, normalizeDateOnly } from "../utils/date-utils.js";
import {
  assertFiniteNumber,
  assertPositiveFiniteNumber,
  sumFinite
} from "../utils/number-utils.js";
import { assertValidPortfolio } from "./portfolio-validation.js";

export const PORTFOLIO_ENGINE_VERSION = "2.2-phase-3a";

export const PORTFOLIO_SERIES_LABELS = Object.freeze({
  ACCOUNT_VALUE: "Modeled account value from fixed shares and split-adjusted price history",
  HISTORICAL_PRICE_RETURN: "Split-adjusted, dividend-unadjusted price-return approximation"
});

export const PORTFOLIO_STATES = Object.freeze({
  CURRENT: "current",
  STALE: "stale",
  PARTIAL: "partial",
  MISSING: "missing",
  INSUFFICIENT: "insufficient",
  QUALITY_WARNING: "quality-warning",
  ERROR: "error"
});

export class PortfolioEngineError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "PortfolioEngineError";
    this.code = code;
    this.details = details && typeof details === "object" ? { ...details } : {};
  }
}

/** Returns shares multiplied by purchase price without rounding. */
export function calculateLotCost(lot) {
  if (!lot || typeof lot !== "object") {
    throw new PortfolioEngineError("LOT_REQUIRED", "Lot is required.");
  }
  const shares = assertPositiveFiniteNumber(lot.shares, "lot.shares");
  const price = assertPositiveFiniteNumber(
    lot.purchasePricePerShare !== undefined ? lot.purchasePricePerShare : lot.purchasePrice,
    "lot.purchasePricePerShare"
  );
  const result = shares * price;
  if (!Number.isFinite(result)) {
    throw new PortfolioEngineError("LOT_COST_NONFINITE", "Lot cost is nonfinite.");
  }
  return result;
}

export function calculateHoldingShares(holding, options = {}) {
  return sumFinite(selectLots(holding, options).map((lot) => lot.shares), "holding shares");
}

export function calculateHoldingCostBasis(holding, options = {}) {
  return sumFinite(selectLots(holding, options).map(calculateLotCost), "holding cost basis");
}

export function calculatePortfolioCostBasis(portfolio, options = {}) {
  const normalized = assertValidPortfolio(portfolio, options);
  return sumFinite(
    selectHoldings(normalized, options).map((holding) => calculateHoldingCostBasis(holding, options)),
    "portfolio cost basis"
  );
}

export function calculatePositionValue(shares, currentPrice) {
  const normalizedShares = assertPositiveFiniteNumber(shares, "shares");
  const normalizedPrice = assertPositiveFiniteNumber(currentPrice, "currentPrice");
  const result = normalizedShares * normalizedPrice;
  if (!Number.isFinite(result)) {
    throw new PortfolioEngineError("POSITION_VALUE_NONFINITE", "Position value is nonfinite.");
  }
  return result;
}

export function calculateUnrealizedGainLoss(positionValue, costBasis) {
  return assertFiniteNumber(positionValue, "positionValue")
    - assertFiniteNumber(costBasis, "costBasis");
}

export function calculateMarketValueWeights(positions) {
  if (!Array.isArray(positions)) {
    throw new PortfolioEngineError("POSITIONS_REQUIRED", "positions must be an array.");
  }
  const available = positions.filter((position) => (
    position && Number.isFinite(position.positionValue) && position.positionValue >= 0
  ));
  const total = sumFinite(available.map((position) => position.positionValue), "position values");
  return positions.map((position) => ({
    ...position,
    weight: Number.isFinite(position && position.positionValue) && total > 0
      ? position.positionValue / total
      : null
  }));
}

export function calculatePortfolioInceptionDate(portfolio, options = {}) {
  if (options.inceptionDate !== undefined && options.inceptionDate !== null && options.inceptionDate !== "") {
    return normalizeDateOnly(options.inceptionDate, "inceptionDate");
  }
  const normalized = assertValidPortfolio(portfolio, options);
  const dates = selectHoldings(normalized, options)
    .flatMap((holding) => holding.lots.map((lot) => lot.acquisitionDate));
  return minDateOnly(dates);
}

/**
 * Calculates current valuation from Finnhub quote snapshots. Quote map entries
 * may be a raw number, raw Finnhub {c, t}, or the Phase 2F normalized result
 * {data, source, availability, stale, cache, provenance, warnings, error}.
 */
export function calculatePortfolioSnapshot(portfolio, quoteSnapshots = {}, options = {}) {
  const normalized = assertValidPortfolio(portfolio, options);
  if (!quoteSnapshots || typeof quoteSnapshots !== "object" || Array.isArray(quoteSnapshots)) {
    throw new PortfolioEngineError("QUOTE_MAP_INVALID", "quoteSnapshots must be an object keyed by ticker.");
  }

  const holdings = selectHoldings(normalized, options);
  const positions = holdings.map((holding) => {
    const shares = calculateHoldingShares(holding);
    const costBasis = calculateHoldingCostBasis(holding);
    const quote = normalizeQuoteSnapshot(quoteSnapshots[holding.ticker], holding.ticker);
    const positionValue = quote.available ? calculatePositionValue(shares, quote.price) : null;
    return {
      recordType: "position-valuation",
      holdingId: holding.id,
      ticker: holding.ticker,
      shares,
      lotCount: holding.lots.length,
      costBasis,
      currentPrice: quote.price,
      positionValue,
      unrealizedGainLoss: positionValue === null
        ? null
        : calculateUnrealizedGainLoss(positionValue, costBasis),
      weight: null,
      quoteState: quote.state,
      quoteAvailable: quote.available,
      quoteStale: quote.stale,
      quoteSource: quote.source,
      quoteTimestamp: quote.timestamp,
      quoteAvailability: quote.availability,
      quoteWarnings: quote.warnings,
      quoteError: quote.error,
      provenance: quote.provenance
    };
  });

  const weighted = calculateMarketValueWeights(positions);
  const availablePositions = weighted.filter((position) => position.positionValue !== null);
  const missingPriceSymbols = weighted.filter((position) => !position.quoteAvailable).map((position) => position.ticker);
  const stalePriceSymbols = weighted.filter((position) => position.quoteAvailable && position.quoteStale)
    .map((position) => position.ticker);
  const portfolioValue = sumFinite(
    availablePositions.map((position) => position.positionValue),
    "available portfolio value"
  );
  const complete = missingPriceSymbols.length === 0;
  const totalCostBasis = sumFinite(weighted.map((position) => position.costBasis), "portfolio cost basis");
  const availableCostBasis = sumFinite(
    availablePositions.map((position) => position.costBasis),
    "available cost basis"
  );
  const partialUnrealizedGainLoss = portfolioValue - availableCostBasis;

  return {
    recordType: "portfolio-snapshot",
    engineVersion: PORTFOLIO_ENGINE_VERSION,
    portfolioId: normalized.id,
    asOf: options.asOf || null,
    positions: weighted,
    totalCostBasis,
    portfolioValue,
    portfolioValueComplete: complete,
    valueIsPartial: !complete,
    unrealizedGainLoss: complete ? portfolioValue - totalCostBasis : null,
    partialUnrealizedGainLoss,
    missingPriceSymbols,
    stalePriceSymbols,
    hasStaleQuotes: stalePriceSymbols.length > 0,
    complete,
    state: !complete
      ? PORTFOLIO_STATES.PARTIAL
      : stalePriceSymbols.length > 0
        ? PORTFOLIO_STATES.STALE
        : PORTFOLIO_STATES.CURRENT,
    weightBasis: complete ? "complete-portfolio-market-value" : "available-market-value-only",
    quoteSemantics: "Finnhub current quote snapshots; not historical candles",
    corporateActionsApplied: false
  };
}

/**
 * Creates a fixed-share modeled account-value series and a contribution-neutral
 * chained price-return index using HistoricalDataService.getAlignedSeries().
 */
export async function buildHistoricalPerformanceSeries(
  portfolio,
  historicalDataService,
  options = {}
) {
  const normalized = assertValidPortfolio(portfolio, options);
  if (!historicalDataService || typeof historicalDataService.getAlignedSeries !== "function") {
    throw new PortfolioEngineError(
      "HISTORICAL_SERVICE_REQUIRED",
      "HistoricalDataService.getAlignedSeries() is required."
    );
  }

  const holdings = selectHoldings(normalized, options);
  const symbols = holdings.map((holding) => holding.ticker);
  const inceptionDate = calculatePortfolioInceptionDate(normalized, options);
  if (symbols.length === 0 || !inceptionDate) {
    return emptyHistoricalResult({
      normalized,
      symbols,
      inceptionDate,
      state: PORTFOLIO_STATES.MISSING,
      states: [PORTFOLIO_STATES.MISSING],
      warnings: [{
        code: "PORTFOLIO_HISTORY_NO_ACTIVE_HOLDINGS",
        severity: "warning",
        message: "No active holdings are available for historical modeling."
      }]
    });
  }

  const serviceOptions = buildHistoricalServiceOptions(options, inceptionDate);
  let aligned;
  try {
    aligned = await historicalDataService.getAlignedSeries(symbols, serviceOptions);
  } catch (error) {
    throw new PortfolioEngineError(
      "HISTORICAL_SERVICE_FAILED",
      "Historical Data Service failed while building the portfolio series.",
      { cause: serializeSafeError(error) }
    );
  }

  const propagated = normalizeHistoricalServiceResult(aligned, symbols);
  if (!propagated.available || propagated.rows.length === 0) {
    return emptyHistoricalResult({
      normalized,
      symbols,
      inceptionDate,
      state: propagated.state,
      states: propagated.states,
      warnings: propagated.warnings,
      serviceResult: propagated
    });
  }

  const lots = holdings.flatMap((holding) => holding.lots.map((lot, lotIndex) => ({
    ...lot,
    holdingId: holding.id,
    activationKey: `${holding.id || holding.ticker}::${lot.id || lotIndex}`
  })));
  let previousAccountValue = null;
  let normalizedIndex = 100;
  const previouslyActivatedLotKeys = new Set();

  const rows = propagated.rows.map((serviceRow, rowIndex) => {
    const date = normalizeDateOnly(serviceRow.date, `historical row ${rowIndex} date`);
    const closes = normalizeCloseMap(serviceRow.closes, symbols, date);
    const activeLots = lots.filter((lot) => compareDateOnly(lot.acquisitionDate, date) <= 0);
    const newlyActiveLots = activeLots.filter(
      (lot) => !previouslyActivatedLotKeys.has(lot.activationKey)
    );
    const holdingValues = holdings.map((holding) => {
      const activeHoldingLots = activeLots.filter((lot) => lot.holdingId === holding.id);
      const shares = sumFinite(activeHoldingLots.map((lot) => lot.shares), `${holding.ticker} active shares`);
      const costBasis = sumFinite(activeHoldingLots.map(calculateLotCost), `${holding.ticker} active cost basis`);
      const marketValue = shares > 0 ? shares * closes[holding.ticker] : 0;
      return {
        ticker: holding.ticker,
        holdingId: holding.id,
        shares,
        close: closes[holding.ticker],
        costBasis,
        marketValue,
        unrealizedGainLoss: marketValue - costBasis,
        weight: null
      };
    });
    const accountValue = sumFinite(holdingValues.map((entry) => entry.marketValue), `account value ${date}`);
    const totalCostBasis = sumFinite(holdingValues.map((entry) => entry.costBasis), `cost basis ${date}`);
    const contributionMarketValue = sumFinite(newlyActiveLots.map(
      (lot) => lot.shares * closes[lot.ticker]
    ), `contribution market value ${date}`);

    let periodReturn = null;
    if (previousAccountValue !== null && previousAccountValue > 0) {
      const valueBeforeExternalFlow = accountValue - contributionMarketValue;
      periodReturn = valueBeforeExternalFlow / previousAccountValue - 1;
      if (!Number.isFinite(periodReturn)) {
        throw new PortfolioEngineError(
          "HISTORICAL_RETURN_NONFINITE",
          `Historical return is nonfinite on ${date}.`
        );
      }
      normalizedIndex *= 1 + periodReturn;
    }

    activeLots.forEach((lot) => previouslyActivatedLotKeys.add(lot.activationKey));
    previousAccountValue = accountValue;
    const weightedHoldings = calculateMarketValueWeights(
      holdingValues.map((entry) => ({ ...entry, positionValue: entry.marketValue }))
    ).map(({ positionValue: _positionValue, ...entry }) => entry);

    return {
      date,
      accountValue,
      totalCostBasis,
      unrealizedGainLoss: accountValue - totalCostBasis,
      normalizedPriceReturnIndex: normalizedIndex,
      periodPriceReturn: periodReturn,
      externalFlowMarketValue: contributionMarketValue,
      activatedLotIds: newlyActiveLots.map((lot) => lot.id || lot.activationKey),
      activatedLots: newlyActiveLots.map((lot) => ({
        holdingId: lot.holdingId,
        lotId: lot.id || null,
        activationKey: lot.activationKey
      })),
      activeLotCount: activeLots.length,
      holdings: weightedHoldings,
      weights: Object.fromEntries(weightedHoldings.map((entry) => [entry.ticker, entry.weight]))
    };
  });

  return {
    recordType: "portfolio-historical-series",
    engineVersion: PORTFOLIO_ENGINE_VERSION,
    portfolioId: normalized.id,
    symbols,
    available: rows.length > 0,
    state: propagated.state,
    states: propagated.states,
    rows,
    dates: rows.map((row) => row.date),
    accountValues: rows.map((row) => row.accountValue),
    normalizedPriceReturnIndex: rows.map((row) => row.normalizedPriceReturnIndex),
    dateRange: rows.length > 0
      ? { firstDate: rows[0].date, lastDate: rows[rows.length - 1].date }
      : { firstDate: null, lastDate: null },
    inceptionDate,
    counts: {
      ...propagated.counts,
      modeledObservationCount: rows.length,
      modeledReturnCount: Math.max(0, rows.length - 1),
      lotCount: lots.length
    },
    warnings: propagated.warnings,
    provenance: propagated.provenance,
    historicalServiceVersion: propagated.serviceVersion,
    accountValueLabel: PORTFOLIO_SERIES_LABELS.ACCOUNT_VALUE,
    label: PORTFOLIO_SERIES_LABELS.HISTORICAL_PRICE_RETURN,
    priceAdjustment: "split-adjusted",
    dividendAdjustment: "none",
    exactTotalReturn: false,
    dividendReinvested: false,
    brokerageReconciled: false,
    taxAdjusted: false,
    fixedShares: true,
    rebalanced: false,
    contributionsTreatedAsExternalFlows: true,
    contributionValuationMethod: "new lot shares valued at the first aligned close on or after acquisition",
    corporateActionsApplied: false,
    methodology: "Fixed-share buy-and-hold modeled account value using exact-date aligned Historical Data Service closes."
  };
}

export const buildHistoricalAccountValueSeries = buildHistoricalPerformanceSeries;

export class PortfolioEngine {
  constructor(options = {}) {
    this.historicalDataService = options.historicalDataService || null;
  }

  calculateSnapshot(portfolio, quoteSnapshots, options = {}) {
    return calculatePortfolioSnapshot(portfolio, quoteSnapshots, options);
  }

  async getHistoricalPerformanceSeries(portfolio, options = {}) {
    return buildHistoricalPerformanceSeries(portfolio, this.historicalDataService, options);
  }

  async getHistoricalAccountValueSeries(portfolio, options = {}) {
    return this.getHistoricalPerformanceSeries(portfolio, options);
  }
}

export function createPortfolioEngine(options = {}) {
  return new PortfolioEngine(options);
}

export function normalizeQuoteSnapshot(input, ticker = null) {
  const base = {
    ticker,
    available: false,
    price: null,
    stale: false,
    state: PORTFOLIO_STATES.MISSING,
    source: "none",
    availability: "missing",
    timestamp: null,
    warnings: [],
    error: null,
    provenance: null
  };
  if (input === undefined || input === null) return base;
  if (typeof input === "number") {
    if (!Number.isFinite(input) || input <= 0) return base;
    return { ...base, available: true, price: input, state: PORTFOLIO_STATES.CURRENT, source: "direct", availability: "available" };
  }
  if (typeof input !== "object" || Array.isArray(input)) return base;

  const wrapper = input;
  const data = wrapper.data && typeof wrapper.data === "object" ? wrapper.data : wrapper;
  const priceCandidates = [data.c, data.currentPrice, data.price, data.lastPrice, data.close];
  const price = priceCandidates.find((value) => Number.isFinite(value) && value > 0) || null;
  const source = typeof wrapper.source === "string"
    ? wrapper.source
    : typeof data.source === "string"
      ? data.source
      : "unknown";
  const availability = typeof wrapper.availability === "string"
    ? wrapper.availability
    : price ? "available" : "missing";
  const stale = wrapper.stale === true
    || data.stale === true
    || availability === "stale"
    || Boolean(wrapper.cache && wrapper.cache.stale === true);
  const timestampValue = firstDefined(
    wrapper.retrievedAt,
    wrapper.timestamp,
    data.retrievedAt,
    data.timestamp,
    data.t
  );
  return {
    ...base,
    available: price !== null,
    price,
    stale: price !== null && stale,
    state: price === null
      ? PORTFOLIO_STATES.MISSING
      : stale
        ? PORTFOLIO_STATES.STALE
        : PORTFOLIO_STATES.CURRENT,
    source,
    availability,
    timestamp: normalizeQuoteTimestamp(timestampValue),
    warnings: Array.isArray(wrapper.warnings) ? wrapper.warnings.map(clonePlain) : [],
    error: wrapper.error ? clonePlain(wrapper.error) : null,
    provenance: wrapper.provenance ? clonePlain(wrapper.provenance) : null
  };
}

function selectHoldings(portfolio, options) {
  const activeOnly = options.activeOnly !== false;
  return activeOnly ? portfolio.holdings.filter((holding) => holding.active !== false) : portfolio.holdings.slice();
}

function selectLots(holding, options) {
  if (!holding || !Array.isArray(holding.lots)) {
    throw new PortfolioEngineError("HOLDING_INVALID", "Holding must contain a lots array.");
  }
  if (!options.asOfDate) return holding.lots.slice();
  const asOfDate = normalizeDateOnly(options.asOfDate, "asOfDate");
  return holding.lots.filter((lot) => compareDateOnly(lot.acquisitionDate, asOfDate) <= 0);
}

function buildHistoricalServiceOptions(options, inceptionDate) {
  const result = {
    startDate: options.startDate
      ? normalizeDateOnly(options.startDate, "startDate")
      : inceptionDate,
    minimumCloseCount: options.minimumCloseCount === undefined ? 1 : options.minimumCloseCount,
    windowSide: options.windowSide || "earliest"
  };
  if (options.endDate) result.endDate = normalizeDateOnly(options.endDate, "endDate");
  if (options.closeCount !== undefined) result.closeCount = options.closeCount;
  if (options.returnCount !== undefined) result.returnCount = options.returnCount;
  if (options.referenceDate !== undefined) result.referenceDate = options.referenceDate;
  if (options.staleAfterCalendarDays !== undefined) {
    result.staleAfterCalendarDays = options.staleAfterCalendarDays;
  }
  return result;
}

function normalizeHistoricalServiceResult(result, symbols) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new PortfolioEngineError(
      "HISTORICAL_RESULT_MALFORMED",
      "Historical Data Service returned a malformed result."
    );
  }
  if (!Array.isArray(result.rows)) {
    throw new PortfolioEngineError(
      "HISTORICAL_ROWS_MALFORMED",
      "Historical Data Service result must include rows."
    );
  }
  const missingSymbols = Array.isArray(result.missingSymbols) ? result.missingSymbols : [];
  const available = result.available === true && missingSymbols.length === 0 && result.rows.length > 0;
  return {
    available,
    state: typeof result.state === "string"
      ? result.state
      : available ? PORTFOLIO_STATES.CURRENT : PORTFOLIO_STATES.MISSING,
    states: Array.isArray(result.states)
      ? result.states.slice()
      : [available ? PORTFOLIO_STATES.CURRENT : PORTFOLIO_STATES.MISSING],
    rows: result.rows.map((row) => clonePlain(row)),
    dateRange: result.dateRange ? clonePlain(result.dateRange) : null,
    counts: result.counts ? clonePlain(result.counts) : {},
    provenance: result.provenance ? clonePlain(result.provenance) : {},
    warnings: Array.isArray(result.warnings) ? result.warnings.map(clonePlain) : [],
    serviceVersion: result.serviceVersion || null,
    missingSymbols,
    symbols: Array.isArray(result.symbols) ? result.symbols.slice() : symbols.slice()
  };
}

function normalizeCloseMap(value, symbols, date) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PortfolioEngineError(
      "HISTORICAL_CLOSES_MALFORMED",
      `Historical closes are malformed on ${date}.`
    );
  }
  return Object.fromEntries(symbols.map((symbol) => {
    const close = value[symbol];
    if (!Number.isFinite(close) || close <= 0) {
      throw new PortfolioEngineError(
        "HISTORICAL_CLOSE_INVALID",
        `Historical close for ${symbol} on ${date} must be a positive finite number.`,
        { symbol, date, close }
      );
    }
    return [symbol, close];
  }));
}

function emptyHistoricalResult(context) {
  const serviceResult = context.serviceResult || {};
  return {
    recordType: "portfolio-historical-series",
    engineVersion: PORTFOLIO_ENGINE_VERSION,
    portfolioId: context.normalized.id,
    symbols: context.symbols,
    available: false,
    state: context.state,
    states: context.states,
    rows: [],
    dates: [],
    accountValues: [],
    normalizedPriceReturnIndex: [],
    dateRange: { firstDate: null, lastDate: null },
    inceptionDate: context.inceptionDate,
    counts: serviceResult.counts || { modeledObservationCount: 0, modeledReturnCount: 0 },
    warnings: context.warnings || [],
    provenance: serviceResult.provenance || {},
    historicalServiceVersion: serviceResult.serviceVersion || null,
    accountValueLabel: PORTFOLIO_SERIES_LABELS.ACCOUNT_VALUE,
    label: PORTFOLIO_SERIES_LABELS.HISTORICAL_PRICE_RETURN,
    priceAdjustment: "split-adjusted",
    dividendAdjustment: "none",
    exactTotalReturn: false,
    dividendReinvested: false,
    brokerageReconciled: false,
    taxAdjusted: false,
    fixedShares: true,
    rebalanced: false,
    contributionsTreatedAsExternalFlows: true,
    corporateActionsApplied: false
  };
}

function normalizeQuoteTimestamp(value) {
  if (value === undefined || value === null) return null;
  if (Number.isFinite(value)) {
    const milliseconds = value < 1e12 ? value * 1000 : value;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value.trim() : date.toISOString();
  }
  return null;
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function serializeSafeError(error) {
  return {
    name: error && error.name ? error.name : "Error",
    code: error && error.code ? error.code : null,
    message: error && error.message ? error.message : String(error)
  };
}

function clonePlain(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(clonePlain);
  if (typeof value === "object") {
    const output = {};
    Object.entries(value).forEach(([key, nested]) => {
      output[key] = clonePlain(nested);
    });
    return output;
  }
  return value;
}
```

## `js/utils/number-utils.js`

```javascript
/**
 * Numeric helpers for deterministic portfolio calculations.
 * Financial calculations retain JavaScript Number precision. Rounding belongs
 * in formatting or display code, not in this module's calculation paths.
 */

export function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function toFiniteNumber(value, options = {}) {
  const {
    name = "value",
    allowNumericString = true,
    positive = false,
    nonnegative = false
  } = options;

  let normalized = value;
  if (allowNumericString && typeof normalized === "string") {
    const trimmed = normalized.trim();
    if (!trimmed) {
      throw new TypeError(`${name} must be a finite number.`);
    }
    normalized = Number(trimmed);
  }

  if (!isFiniteNumber(normalized)) {
    throw new TypeError(`${name} must be a finite number.`);
  }
  if (positive && normalized <= 0) {
    throw new RangeError(`${name} must be greater than zero.`);
  }
  if (nonnegative && normalized < 0) {
    throw new RangeError(`${name} must be zero or greater.`);
  }
  return normalized;
}

export function assertFiniteNumber(value, name = "value") {
  return toFiniteNumber(value, { name, allowNumericString: false });
}

export function assertPositiveFiniteNumber(value, name = "value") {
  return toFiniteNumber(value, {
    name,
    allowNumericString: false,
    positive: true
  });
}

export function sumFinite(values, name = "values") {
  if (!Array.isArray(values)) {
    throw new TypeError(`${name} must be an array.`);
  }
  let total = 0;
  values.forEach((value, index) => {
    total += assertFiniteNumber(value, `${name}[${index}]`);
  });
  if (!Number.isFinite(total)) {
    throw new RangeError(`${name} produced a nonfinite total.`);
  }
  return total;
}

export function safeDivide(numerator, denominator, fallback = null) {
  const top = assertFiniteNumber(numerator, "numerator");
  const bottom = assertFiniteNumber(denominator, "denominator");
  if (bottom === 0) {
    return fallback;
  }
  const result = top / bottom;
  return Number.isFinite(result) ? result : fallback;
}

export function nearlyEqual(left, right, tolerance = 1e-10) {
  if (!isFiniteNumber(left) || !isFiniteNumber(right)) {
    return false;
  }
  if (!isFiniteNumber(tolerance) || tolerance < 0) {
    throw new RangeError("tolerance must be a nonnegative finite number.");
  }
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= tolerance * scale;
}

/**
 * Display-only decimal rounding. Do not use this function inside financial
 * calculations or persisted model normalization.
 */
export function roundForDisplay(value, decimalPlaces = 2) {
  const number = assertFiniteNumber(value, "value");
  if (!Number.isInteger(decimalPlaces) || decimalPlaces < 0 || decimalPlaces > 15) {
    throw new RangeError("decimalPlaces must be an integer from 0 through 15.");
  }
  const factor = 10 ** decimalPlaces;
  return Math.round((number + Number.EPSILON) * factor) / factor;
}
```

## `js/utils/date-utils.js`

```javascript
/**
 * Strict date-only helpers. Date strings remain YYYY-MM-DD values and are not
 * converted through local or UTC midnight, preventing timezone date shifting.
 */

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year, month) {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new RangeError("year must be an integer from 1 through 9999.");
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError("month must be an integer from 1 through 12.");
  }
  const lengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return lengths[month - 1];
}

export function parseDateOnly(value, name = "date") {
  if (typeof value !== "string") {
    throw new TypeError(`${name} must use YYYY-MM-DD.`);
  }
  const match = DATE_ONLY_PATTERN.exec(value.trim());
  if (!match) {
    throw new TypeError(`${name} must use YYYY-MM-DD.`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || year > 9999 || month < 1 || month > 12) {
    throw new RangeError(`${name} must be a valid calendar date.`);
  }
  if (day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError(`${name} must be a valid calendar date.`);
  }
  return {
    value: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    year,
    month,
    day
  };
}

export function normalizeDateOnly(value, name = "date") {
  return parseDateOnly(value, name).value;
}

export function isValidDateOnly(value) {
  try {
    parseDateOnly(value);
    return true;
  } catch (_error) {
    return false;
  }
}

export function compareDateOnly(left, right) {
  const a = normalizeDateOnly(left, "left date");
  const b = normalizeDateOnly(right, "right date");
  return a < b ? -1 : a > b ? 1 : 0;
}

export function minDateOnly(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }
  return values.map((value) => normalizeDateOnly(value)).reduce(
    (minimum, value) => (value < minimum ? value : minimum)
  );
}

export function maxDateOnly(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }
  return values.map((value) => normalizeDateOnly(value)).reduce(
    (maximum, value) => (value > maximum ? value : maximum)
  );
}

export function todayDateOnly(now = new Date()) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new TypeError("now must be a valid Date.");
  }
  return [
    String(now.getFullYear()).padStart(4, "0"),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
}

export function resolveReferenceDate(value, now = () => new Date()) {
  if (value === undefined || value === null || value === "") {
    return todayDateOnly(now());
  }
  if (value instanceof Date) {
    return todayDateOnly(value);
  }
  return normalizeDateOnly(value, "referenceDate");
}

export function isFutureDate(value, referenceDate) {
  return compareDateOnly(value, referenceDate) > 0;
}

export function isOnOrAfterDate(value, boundary) {
  return compareDateOnly(value, boundary) >= 0;
}
```

## `tests/calculation-tests.html`

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Phase 3A Portfolio Calculation Tests</title>
  <style>
    :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
    body { max-width: 980px; margin: 0 auto; padding: 1.25rem; line-height: 1.45; }
    button { min-height: 44px; font: inherit; padding: .6rem .9rem; }
    .summary { margin: 1rem 0; padding: .85rem; border: 1px solid currentColor; border-radius: .35rem; }
    .pass { color: #16723a; }
    .fail { color: #b42318; }
    li { margin: .55rem 0; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; }
    code { overflow-wrap: anywhere; }
  </style>
</head>
<body>
  <main>
    <h1>Phase 3A Portfolio Calculation Tests</h1>
    <p>
      Deterministic tests for Version 2.2 holdings, multiple lots, validation,
      quote snapshots, stale fallback, partial valuation, and Historical Data
      Service-backed modeled account value.
    </p>
    <button id="run-tests" type="button">Run tests</button>
    <div id="summary" class="summary" aria-live="polite">Tests have not run.</div>
    <ol id="results"></ol>
  </main>

  <script type="module">
    import { createLot } from "../js/portfolio/lot-model.js";
    import {
      addLotToHolding,
      createPortfolio,
      editLot
    } from "../js/portfolio/portfolio-model.js";
    import {
      assertValidPortfolio,
      validatePortfolio
    } from "../js/portfolio/portfolio-validation.js";
    import {
      buildHistoricalPerformanceSeries,
      calculateHoldingCostBasis,
      calculateHoldingShares,
      calculateLotCost,
      calculatePortfolioCostBasis,
      calculatePortfolioInceptionDate,
      calculatePortfolioSnapshot,
      calculatePositionValue,
      createPortfolioEngine,
      normalizeQuoteSnapshot,
      PORTFOLIO_SERIES_LABELS
    } from "../js/portfolio/portfolio-engine.js";
    import { nearlyEqual } from "../js/utils/number-utils.js";

    const referenceDate = "2030-01-01";
    const tests = [];
    const test = (name, fn) => tests.push({ name, fn });
    const assert = (condition, message = "Assertion failed") => {
      if (!condition) throw new Error(message);
    };
    const assertEqual = (actual, expected, message = "Values differ") => {
      if (actual !== expected) throw new Error(`${message}: expected ${expected}, received ${actual}`);
    };
    const assertNear = (actual, expected, tolerance = 1e-10, message = "Values differ") => {
      if (!nearlyEqual(actual, expected, tolerance)) {
        throw new Error(`${message}: expected ${expected}, received ${actual}`);
      }
    };
    const assertThrows = (fn, expectedCode = null) => {
      let thrown = null;
      try { fn(); } catch (error) { thrown = error; }
      if (!thrown) throw new Error("Expected function to throw");
      if (expectedCode && thrown.code !== expectedCode) {
        throw new Error(`Expected code ${expectedCode}, received ${thrown.code}`);
      }
    };

    const idFactory = (() => {
      let count = 0;
      return (prefix) => `${prefix}-test-${++count}`;
    })();

    function basePortfolioInput() {
      return {
        id: "portfolio-test",
        name: "Test Portfolio",
        benchmarks: [{ id: "benchmark-dco", recordType: "benchmark", ticker: "DCO" }],
        holdings: [
          {
            id: "holding-dco",
            ticker: "DCO",
            active: true,
            lots: [
              { id: "lot-dco-1", ticker: "DCO", shares: 1.5, purchasePricePerShare: 10, acquisitionDate: "2020-01-02", auditNote: "Initial lot" },
              { id: "lot-dco-2", ticker: "DCO", shares: 0.5, purchasePricePerShare: 10, acquisitionDate: "2020-01-03", auditNote: "Second lot" }
            ]
          },
          {
            id: "holding-vtv",
            ticker: "VTV",
            active: true,
            lots: [
              { id: "lot-vtv-1", ticker: "VTV", shares: 1, purchasePricePerShare: 20, acquisitionDate: "2020-01-02", auditNote: "Value holding" }
            ]
          }
        ]
      };
    }

    function historicalPortfolioInput() {
      return {
        id: "portfolio-history",
        name: "Historical Test",
        holdings: [
          {
            id: "holding-aaa",
            ticker: "AAA",
            active: true,
            lots: [
              { id: "lot-aaa-1", ticker: "AAA", shares: 1, purchasePricePerShare: 10, acquisitionDate: "2020-01-02", auditNote: "" },
              { id: "lot-aaa-2", ticker: "AAA", shares: 1, purchasePricePerShare: 12, acquisitionDate: "2020-01-04", auditNote: "Later contribution" }
            ]
          },
          {
            id: "holding-bbb",
            ticker: "BBB",
            active: true,
            lots: [
              { id: "lot-bbb-1", ticker: "BBB", shares: 2, purchasePricePerShare: 20, acquisitionDate: "2020-01-02", auditNote: "" }
            ]
          }
        ]
      };
    }

    test("Lot cost preserves fractional-share precision", () => {
      assertNear(calculateLotCost({ shares: 1.25, purchasePricePerShare: 8.4 }), 10.5);
    });

    test("Multiple lots consolidate shares and cost basis under one holding", () => {
      const holding = basePortfolioInput().holdings[0];
      assertNear(calculateHoldingShares(holding), 2);
      assertNear(calculateHoldingCostBasis(holding), 20);
    });

    test("Portfolio cost basis is deterministic", () => {
      assertNear(calculatePortfolioCostBasis(basePortfolioInput(), { referenceDate }), 40);
    });

    test("Default portfolio lots preserve exact total cost basis", () => {
      const defaults = {
        holdings: [
          { ticker: "DCO", lots: [{ ticker: "DCO", shares: 39, purchasePricePerShare: 145.17948, acquisitionDate: "2026-05-15" }] },
          { ticker: "VTV", lots: [{ ticker: "VTV", shares: 547, purchasePricePerShare: 207.0364, acquisitionDate: "2026-05-15" }] },
          { ticker: "ONEQ", lots: [{ ticker: "ONEQ", shares: 918, purchasePricePerShare: 104.06513, acquisitionDate: "2026-05-15" }] }
        ]
      };
      assertNear(calculatePortfolioCostBasis(defaults, { referenceDate }), 214442.69986);
    });

    test("Position value uses full Number precision", () => {
      assertNear(calculatePositionValue(1.25, 12.8), 16);
    });

    test("Current snapshot calculates value, gain/loss, and weights", () => {
      const snapshot = calculatePortfolioSnapshot(
        basePortfolioInput(),
        { DCO: { c: 12, t: 1700000000 }, VTV: 30 },
        { referenceDate }
      );
      assert(snapshot.complete);
      assertNear(snapshot.portfolioValue, 54);
      assertNear(snapshot.unrealizedGainLoss, 14);
      assertNear(snapshot.positions[0].weight, 24 / 54);
      assertNear(snapshot.positions[1].weight, 30 / 54);
      assertEqual(snapshot.state, "current");
    });

    test("Missing quote produces partial value and no misleading total gain/loss", () => {
      const snapshot = calculatePortfolioSnapshot(basePortfolioInput(), { DCO: 12 }, { referenceDate });
      assertEqual(snapshot.complete, false);
      assertEqual(snapshot.valueIsPartial, true);
      assertNear(snapshot.portfolioValue, 24);
      assertEqual(snapshot.unrealizedGainLoss, null);
      assertNear(snapshot.partialUnrealizedGainLoss, 4);
      assertEqual(snapshot.missingPriceSymbols[0], "VTV");
      assertEqual(snapshot.weightBasis, "available-market-value-only");
    });

    test("Phase 2F cached quote fallback is usable and labeled stale", () => {
      const quotes = {
        DCO: { data: { c: 12 }, source: "cache", availability: "stale", stale: true },
        VTV: { data: { c: 30 }, source: "live", availability: "available", stale: false }
      };
      const snapshot = calculatePortfolioSnapshot(basePortfolioInput(), quotes, { referenceDate });
      assert(snapshot.complete);
      assert(snapshot.hasStaleQuotes);
      assertEqual(snapshot.state, "stale");
      assertEqual(snapshot.positions[0].quoteSource, "cache");
      assertEqual(snapshot.positions[0].quoteStale, true);
    });

    test("Quote normalization rejects zero, NaN, and Infinity", () => {
      assertEqual(normalizeQuoteSnapshot({ c: 0 }).available, false);
      assertEqual(normalizeQuoteSnapshot({ c: NaN }).available, false);
      assertEqual(normalizeQuoteSnapshot({ c: Infinity }).available, false);
    });

    test("Same ticker holding and benchmark remain distinct", () => {
      const result = validatePortfolio(basePortfolioInput(), { referenceDate });
      assert(result.valid, JSON.stringify(result.errors));
      assertEqual(result.normalized.holdings[0].ticker, "DCO");
      assertEqual(result.normalized.benchmarks[0].recordType, "benchmark");
    });

    test("Duplicate holdings are rejected while duplicate ticker lots are valid", () => {
      const valid = validatePortfolio(basePortfolioInput(), { referenceDate });
      assert(valid.valid);
      const input = basePortfolioInput();
      input.holdings.push({ ...input.holdings[0], id: "duplicate-dco" });
      const invalid = validatePortfolio(input, { referenceDate });
      assert(!invalid.valid);
      assert(invalid.errors.some((error) => error.code === "PORTFOLIO_DUPLICATE_HOLDING"));
    });

    test("Validation rejects invalid ticker, dates, values, NaN, and Infinity", () => {
      const cases = [
        { field: "ticker", value: "1BAD" },
        { field: "shares", value: 0 },
        { field: "shares", value: -1 },
        { field: "shares", value: NaN },
        { field: "shares", value: Infinity },
        { field: "purchasePricePerShare", value: 0 },
        { field: "purchasePricePerShare", value: -2 },
        { field: "acquisitionDate", value: "2020-02-31" },
        { field: "acquisitionDate", value: "2031-01-01" }
      ];
      cases.forEach(({ field, value }) => {
        const input = basePortfolioInput();
        input.holdings[0].lots[0][field] = value;
        if (field === "ticker") input.holdings[0].ticker = value;
        const result = validatePortfolio(input, { referenceDate });
        assert(!result.valid, `Expected invalid ${field}: ${String(value)}`);
      });
    });

    test("Malformed persisted arrays are rejected", () => {
      assert(!validatePortfolio({ holdings: {} }, { referenceDate }).valid);
      const input = basePortfolioInput();
      input.holdings[0].lots = "not-an-array";
      assert(!validatePortfolio(input, { referenceDate }).valid);
    });

    test("Adding to an existing holding creates a distinct lot", () => {
      const portfolio = createPortfolio(basePortfolioInput(), { referenceDate, idFactory });
      const updated = addLotToHolding(portfolio, "holding-dco", {
        shares: 0.25,
        purchasePricePerShare: 11,
        acquisitionDate: "2020-01-04",
        auditNote: "Added shares"
      }, { referenceDate, idFactory });
      assertEqual(updated.holdings[0].lots.length, 3);
      assert(updated.holdings[0].lots[2].id !== updated.holdings[0].lots[0].id);
      assertNear(calculateHoldingShares(updated.holdings[0]), 2.25);
    });

    test("Explicit lot edit preserves lot identity", () => {
      const portfolio = createPortfolio(basePortfolioInput(), { referenceDate, idFactory });
      const updated = editLot(portfolio, "holding-dco", "lot-dco-1", {
        shares: 1.75,
        auditNote: "Manual audited correction"
      }, { referenceDate, idFactory });
      assertEqual(updated.holdings[0].lots[0].id, "lot-dco-1");
      assertNear(updated.holdings[0].lots[0].shares, 1.75);
      assertEqual(updated.holdings[0].lots[0].auditNote, "Manual audited correction");
    });

    test("Portfolio inception uses earliest active acquisition date", () => {
      assertEqual(calculatePortfolioInceptionDate(basePortfolioInput(), { referenceDate }), "2020-01-02");
    });

    test("Historical lot activates on first aligned date on or after acquisition", async () => {
      const service = {
        async getAlignedSeries() {
          return {
            symbols: ["AAA", "BBB"],
            available: true,
            state: "current",
            states: ["current"],
            rows: [
              { date: "2020-01-02", closes: { AAA: 10, BBB: 20 } },
              { date: "2020-01-03", closes: { AAA: 11, BBB: 21 } },
              { date: "2020-01-06", closes: { AAA: 12, BBB: 22 } },
              { date: "2020-01-07", closes: { AAA: 13, BBB: 22 } }
            ],
            counts: { returnedObservationCount: 4, returnObservationCount: 3 },
            provenance: {}, warnings: [], serviceVersion: "2.2-phase-2e-test"
          };
        }
      };
      const result = await buildHistoricalPerformanceSeries(historicalPortfolioInput(), service, { referenceDate });
      assertNear(result.rows[0].accountValue, 50);
      assertNear(result.rows[1].accountValue, 53);
      assertNear(result.rows[2].accountValue, 68);
      assertEqual(result.rows[1].activeLotCount, 2);
      assertEqual(result.rows[2].activeLotCount, 3);
      assertEqual(result.rows[2].activatedLotIds[0], "lot-aaa-2");
      assertNear(result.rows[2].externalFlowMarketValue, 12);
    });

    test("New contribution does not appear as investment return", async () => {
      const service = {
        async getAlignedSeries() {
          return {
            available: true, state: "current", states: ["current"],
            rows: [
              { date: "2020-01-02", closes: { AAA: 10, BBB: 20 } },
              { date: "2020-01-03", closes: { AAA: 10, BBB: 20 } },
              { date: "2020-01-06", closes: { AAA: 10, BBB: 20 } }
            ],
            counts: {}, provenance: {}, warnings: [], serviceVersion: "test"
          };
        }
      };
      const result = await buildHistoricalPerformanceSeries(historicalPortfolioInput(), service, { referenceDate });
      assertNear(result.rows[0].normalizedPriceReturnIndex, 100);
      assertNear(result.rows[1].normalizedPriceReturnIndex, 100);
      assertNear(result.rows[2].normalizedPriceReturnIndex, 100);
      assertNear(result.rows[2].accountValue, 60);
    });

    test("Partial historical range preserves available rows without backfilling", async () => {
      const service = {
        async getAlignedSeries() {
          return {
            available: true,
            state: "insufficient",
            states: ["insufficient"],
            rows: [
              { date: "2020-01-03", closes: { AAA: 11, BBB: 21 } },
              { date: "2020-01-06", closes: { AAA: 12, BBB: 22 } }
            ],
            counts: { returnedObservationCount: 2, requiredCloseCount: 4 },
            provenance: {},
            warnings: [{ code: "HISTORICAL_ALIGNMENT_INSUFFICIENT" }],
            serviceVersion: "test"
          };
        }
      };
      const result = await buildHistoricalPerformanceSeries(
        historicalPortfolioInput(),
        service,
        { referenceDate }
      );
      assertEqual(result.available, true);
      assertEqual(result.state, "insufficient");
      assertEqual(result.rows.length, 2);
      assertEqual(result.rows[0].date, "2020-01-03");
      assertEqual(result.rows[1].date, "2020-01-06");
      assertNear(result.rows[0].accountValue, 53);
      assertNear(result.rows[1].accountValue, 68);
    });

    test("Partial historical availability is surfaced without fabricated rows", async () => {
      const service = {
        async getAlignedSeries() {
          return {
            available: false,
            state: "missing",
            states: ["missing", "insufficient"],
            missingSymbols: ["BBB"],
            rows: [], counts: { returnedObservationCount: 0 }, provenance: {},
            warnings: [{ code: "HISTORICAL_ALIGNMENT_SYMBOLS_MISSING" }],
            serviceVersion: "test"
          };
        }
      };
      const result = await buildHistoricalPerformanceSeries(historicalPortfolioInput(), service, { referenceDate });
      assertEqual(result.available, false);
      assertEqual(result.rows.length, 0);
      assertEqual(result.state, "missing");
      assert(result.states.includes("insufficient"));
    });

    test("Historical output carries required Version 2.2 labels", async () => {
      const service = {
        async getAlignedSeries() {
          return {
            available: true, state: "quality-warning", states: ["quality-warning"],
            rows: [
              { date: "2020-01-02", closes: { AAA: 10, BBB: 20 } },
              { date: "2020-01-03", closes: { AAA: 11, BBB: 18 } }
            ],
            counts: {}, provenance: { AAA: { source: "Stooq" } },
            warnings: [{ code: "TEST_WARNING" }], serviceVersion: "2.2-phase-2e-test"
          };
        }
      };
      const result = await buildHistoricalPerformanceSeries(historicalPortfolioInput(), service, { referenceDate });
      assertEqual(result.accountValueLabel, PORTFOLIO_SERIES_LABELS.ACCOUNT_VALUE);
      assertEqual(result.label, PORTFOLIO_SERIES_LABELS.HISTORICAL_PRICE_RETURN);
      assertEqual(result.priceAdjustment, "split-adjusted");
      assertEqual(result.dividendAdjustment, "none");
      assertEqual(result.exactTotalReturn, false);
      assertEqual(result.brokerageReconciled, false);
      assertEqual(result.taxAdjusted, false);
      assertEqual(result.corporateActionsApplied, false);
      assertEqual(result.state, "quality-warning");
    });

    test("PortfolioEngine wrapper consumes only injected Historical Data Service", async () => {
      let calls = 0;
      const engine = createPortfolioEngine({
        historicalDataService: {
          async getAlignedSeries(symbols) {
            calls += 1;
            assertEqual(symbols.join(","), "AAA,BBB");
            return {
              available: true, state: "current", states: ["current"],
              rows: [{ date: "2020-01-02", closes: { AAA: 10, BBB: 20 } }],
              counts: {}, provenance: {}, warnings: [], serviceVersion: "test"
            };
          }
        }
      });
      const result = await engine.getHistoricalAccountValueSeries(historicalPortfolioInput(), { referenceDate });
      assertEqual(calls, 1);
      assertEqual(result.rows.length, 1);
    });

    test("Historical calculation rejects missing service and invalid close data", async () => {
      let missingServiceThrown = false;
      try {
        await buildHistoricalPerformanceSeries(historicalPortfolioInput(), null, { referenceDate });
      } catch (error) {
        missingServiceThrown = error.code === "HISTORICAL_SERVICE_REQUIRED";
      }
      assert(missingServiceThrown);

      let invalidCloseThrown = false;
      try {
        await buildHistoricalPerformanceSeries(historicalPortfolioInput(), {
          async getAlignedSeries() {
            return {
              available: true, state: "current", states: ["current"],
              rows: [{ date: "2020-01-02", closes: { AAA: 10, BBB: NaN } }],
              counts: {}, provenance: {}, warnings: []
            };
          }
        }, { referenceDate });
      } catch (error) {
        invalidCloseThrown = error.code === "HISTORICAL_CLOSE_INVALID";
      }
      assert(invalidCloseThrown);
    });

    test("Lot model rejects future dates and nonpositive values", () => {
      assertThrows(() => createLot({
        ticker: "DCO", shares: 0, purchasePricePerShare: 10, acquisitionDate: "2020-01-02"
      }, { referenceDate }), "LOT_SHARES_INVALID");
      assertThrows(() => createLot({
        ticker: "DCO", shares: 1, purchasePricePerShare: 10, acquisitionDate: "2031-01-01"
      }, { referenceDate }), "LOT_ACQUISITION_DATE_FUTURE");
    });

    async function runTests() {
      const resultsElement = document.querySelector("#results");
      const summaryElement = document.querySelector("#summary");
      resultsElement.replaceChildren();
      let passed = 0;
      for (const entry of tests) {
        const item = document.createElement("li");
        try {
          await entry.fn();
          passed += 1;
          item.className = "pass";
          item.textContent = `PASS: ${entry.name}`;
        } catch (error) {
          item.className = "fail";
          const title = document.createElement("strong");
          title.textContent = `FAIL: ${entry.name}`;
          const details = document.createElement("pre");
          details.textContent = error && error.stack ? error.stack : String(error);
          item.append(title, details);
        }
        resultsElement.append(item);
      }
      const failed = tests.length - passed;
      summaryElement.className = `summary ${failed === 0 ? "pass" : "fail"}`;
      summaryElement.textContent = `${passed} passed, ${failed} failed, ${tests.length} total.`;
      document.title = failed === 0
        ? `PASS (${passed}) - Phase 3A Tests`
        : `FAIL (${failed}) - Phase 3A Tests`;
    }

    document.querySelector("#run-tests").addEventListener("click", runTests);
    runTests();
  </script>
</body>
</html>
```


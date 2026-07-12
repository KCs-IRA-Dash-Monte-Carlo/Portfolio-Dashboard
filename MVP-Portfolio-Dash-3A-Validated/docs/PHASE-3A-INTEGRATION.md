# Phase 3A Integration

Copy these files into the existing project, preserving paths:

- `js/portfolio/portfolio-model.js`
- `js/portfolio/lot-model.js`
- `js/portfolio/portfolio-validation.js`
- `js/portfolio/portfolio-engine.js`
- `js/utils/number-utils.js`
- `js/utils/date-utils.js`
- `tests/calculation-tests.html`

## Scope

This increment implements only the Version 2.2 Portfolio Data Model and Engine:

- Holdings with multiple acquisition lots
- Fractional shares and full JavaScript Number precision
- Immutable add, edit, and delete model operations
- Validation of malformed persisted data
- Cost basis, current values, unrealized dollar gain/loss, and market-value weights
- Raw and normalized Finnhub quote snapshot compatibility
- Explicit stale quote fallback and partial-value behavior
- Fixed-share modeled historical account value through Historical Data Service
- Acquisition-date lot activation
- Contribution-neutral chained price-return index
- Version 2.2 historical labels and corporate-action exclusions

Benchmark analytics, chart rendering, Monte Carlo, persistence wiring, and portfolio UI are not included.

## Quote input contract

`calculatePortfolioSnapshot()` accepts a map keyed by ticker. Each value may be:

```js
170.25
```

```js
{ c: 170.25, t: 1783700000 }
```

```js
{
  data: { c: 170.25 },
  source: "cache",
  availability: "stale",
  stale: true,
  provenance: {}
}
```

A missing quote yields a partial portfolio value. The total unrealized gain/loss is `null` because it would otherwise imply a complete portfolio. A stale cached quote remains usable and is labeled stale.

## Historical Data Service contract

Inject the accepted Phase 2E service:

```js
import { createPortfolioEngine } from "./js/portfolio/portfolio-engine.js";

const portfolioEngine = createPortfolioEngine({ historicalDataService });
```

The engine calls only:

```js
historicalDataService.getAlignedSeries(symbols, options)
```

Expected result fields:

- `available`
- `state` and `states`
- `rows[]` with `date` and `closes[symbol]`
- `dateRange`
- `counts`
- `provenance`
- `warnings`
- `serviceVersion`

The engine does not read raw Stooq files, IndexedDB, or Finnhub historical candles.

## Manual tests

1. Copy the seven authorized files into the project.
2. Start the static server from the project root:

   ```text
   python3 -m http.server 8000
   ```

3. Open:

   ```text
   http://localhost:8000/tests/calculation-tests.html
   ```

4. Confirm every deterministic test reports `PASS`.
5. Open Firefox Developer Tools and confirm no module-load or runtime errors.
6. Load the default DCO, VTV, and ONEQ lots and verify the total cost basis is `39 × 145.17948 + 547 × 207.0364 + 918 × 104.06513 = 214,442.69986`.
7. Add a second lot to one holding and confirm a distinct lot id is created.
8. Test fractional shares.
9. Confirm zero, negative, NaN, Infinity, malformed dates, and future dates are rejected.
10. Supply live and stale cached quotes and inspect `state`, `quoteStale`, and `stalePriceSymbols`.
11. Remove one quote and confirm the snapshot is partial and total unrealized gain/loss is `null`.
12. Build a historical series and confirm each lot is absent before its acquisition date.
13. Confirm a new lot increases raw account value but does not create a jump in `normalizedPriceReturnIndex` when prices are unchanged.
14. Confirm the output labels split-adjusted, dividend-unadjusted price history and sets `corporateActionsApplied` to `false`.
15. Search the Phase 3A files for raw Stooq parsing, IndexedDB access, or `/stock/candle`; none should exist.
16. Run the Phase 3A audit prompt from the roadmap before Phase 3B.
17. Create a phase-labeled backup of the full working project folder.

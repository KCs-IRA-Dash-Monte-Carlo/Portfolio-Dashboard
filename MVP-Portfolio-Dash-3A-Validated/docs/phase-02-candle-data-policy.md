# Phase 2 Candle Data Policy

**Status:** Phase 2B implementation note pending later incorporation into `requirements.md`.

## Decision

For the MVP, Finnhub `/stock/candle` is used as a rolling daily-candle service only.

The app must not use intraday candle resolutions for MVP analytics, charts, benchmark comparison, or Monte Carlo. Live candle requests must use:

```text
resolution=D
```

Monthly fallback is excluded from MVP.

## Live Finnhub request window

Maximum live Finnhub candle lookback:

```text
350 calendar days
```

When a user requests a range longer than 350 calendar days, the service must clamp the live Finnhub request to the latest 350 calendar days and disclose that the request was clamped.

The originally requested range must remain visible in the returned metadata so the UI can label the displayed range correctly.

## Cache accumulation

Older successfully cached daily candles may be kept indefinitely unless the user clears the cache.

The app may build a longer local daily history over time by merging successful daily candle pulls. It must not request unavailable old history from Finnhub to manufacture a longer history.

## Max and Since Purchase behavior

When the requested chart range starts before available cached daily candles:

1. Return all available cached daily candles inside the requested range.
2. Mark the result as `insufficient-history`.
3. Show a warning that the displayed range is limited by available Finnhub/cache data.
4. Do not fabricate missing candles.

## Monte Carlo sufficiency rule

Monte Carlo may run with at least:

```text
126 aligned daily observations
```

Preferred minimum:

```text
252 aligned daily observations
```

If fewer than 252 aligned observations are used, show a short-lookback warning.

If fewer than 126 aligned observations exist, show `insufficient-history`.

## CAGR under one year

CAGR or annualized return may be shown for periods under one year only if clearly labeled as an annualized short-period estimate.

Headline cards must warn when the annualized value is based on less than one year of daily price-return observations.

## Benchmark alignment

Benchmark comparison requires aligned daily observations. If a holding or benchmark lacks enough overlapping daily candles, exclude that series from aligned analytics and show `insufficient-history` for that series.

## Testing requirements added

The Phase 2B data-service test page must verify:

1. A two-year daily candle request clamps the live request to the latest 350 calendar days.
2. Intraday resolutions are rejected and do not call Finnhub.
3. Max-range requests beyond cache return available candles with `insufficient-history`.
4. Accumulated daily candle cache merges newer pulls without pruning older successful candles.
5. Monte Carlo thresholds classify 60, 126, and 252 aligned observations correctly.
6. Offline or failed live candle requests can fall back to accumulated cached candles.


## Claude review follow-up incorporated after candle-policy revision

Minimal Phase 2B changes incorporated after external review:

- FinnhubClient now has a local fallback request queue when no external Phase 2A queue is injected. This prevents raw `Promise.allSettled` fan-out from becoming uncontrolled live API fan-out.
- Cache reads and writes are treated as unreliable I/O. IndexedDB/cache failures are normalized and recorded in Diagnostics instead of crashing data-service calls.
- The Treasury risk-free-rate service now uses the documented Treasury XML feed URL shape: `/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_bill_rates&field_tdr_date_value=[yyyy]`.
- The risk-free-rate parser accepts coupon-equivalent 13-week bill fields only. It does not silently substitute bank-discount yields.
- The aggregate data-availability helper now preserves plan/entitlement and temporary-unavailable states, and no longer turns one missing benchmark history series into whole-dashboard quote-only mode.

Still required before Phase 3 and later analytics work:

- Run live `/stock/candle` tests with the runtime Finnhub free-tier key against DCO, VTV, ONEQ, SPY, IWM, AVUV, AVDV, and PSCH.
- If Finnhub returns repeated 403 plan/entitlement failures for `/stock/candle`, treat analytics, benchmark comparison, and Monte Carlo as unavailable or quote-only until a permitted data source is approved.

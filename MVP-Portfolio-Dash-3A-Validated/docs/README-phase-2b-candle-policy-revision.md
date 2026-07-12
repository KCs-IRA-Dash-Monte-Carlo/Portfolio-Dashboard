# Phase 2B Candle Policy Revision

Copy these files into the root of the MVP Portfolio Dashboard project, preserving paths:

```text
js/data/cache-policy.js
js/data/candle-policy.js
js/data/finnhub-client.js
js/data/market-data-service.js
tests/data-service-tests.html
docs/phase-02-candle-data-policy.md
```

The unchanged Phase 2B files from the prior bundle are also included for convenience:

```text
js/data/risk-free-rate-service.js
js/data/symbol-service.js
README-phase-2b.md
```

## Revised candle policy

- MVP candle analytics use `resolution=D` only.
- Intraday resolutions are rejected before Finnhub is called.
- Live Finnhub candle requests are capped to the latest 350 calendar days.
- Older successfully cached daily candles are retained and merged until the user clears the cache.
- `Max` and `Since Purchase` ranges that exceed available cache return available candles with an `insufficient-history` warning.
- Monthly fallback is excluded from MVP.
- Monte Carlo sufficiency helpers classify 126 aligned observations as runnable with warning and 252 as preferred.

## Manual test sequence

1. Copy the files into the project root.
2. Start the local server:

```text
python3 -m http.server 8000
```

3. Open Firefox:

```text
http://localhost:8000/tests/data-service-tests.html
```

4. Click `Run stubbed tests`.
5. Confirm all stubbed tests pass.
6. Confirm the output includes these passing tests:
   - `twoYearDailyCandleRequestIsClampedTo350Days`
   - `intradayCandleResolutionRejectedWithoutFetch`
   - `accumulatedDailyCandleCacheMergesNewerData`
   - `maxRangeUsesAvailableCacheWithInsufficientHistoryWarning`
   - `monteCarloObservationThresholdsMatchPolicy`
7. Enter the Finnhub development key in the runtime password field only.
8. Click `Save runtime key for this tab`.
9. Click `Live historical candles`.
10. Confirm the output shows daily candles, the 350-day policy metadata, and no printed API key.
11. Open Firefox Developer Tools and verify there are no fatal console errors.
12. Stop the server with `Control + C`.
13. Create a manual backup folder before continuing.

## API key rule

Do not put a Finnhub key into any source file, test fixture, export, diagnostics output, screenshots, or commit.


## Claude review minimal follow-up

This bundle also incorporates the minimal changes accepted from Claude's review of the prior Phase 2B bundle:

1. Adds a local fallback Finnhub request queue inside `finnhub-client.js` when no external Phase 2A queue is injected.
2. Wraps cache reads and writes in normalized error handling so IndexedDB/cache failures do not break result-shape contracts.
3. Changes the risk-free-rate source to Treasury's documented daily bill-rate XML endpoint with a year parameter.
4. Removes bank-discount fallback for the 3-month Treasury bill rate; only coupon-equivalent 13-week fields are accepted.
5. Improves aggregate market-data availability so plan/entitlement and temporary-unavailable states remain visible.
6. Adds tests for fallback queue behavior, cache failure handling, Treasury URL shape, no bank-discount substitution, and availability rollup.

No backend, news endpoint, dividend-income calculation, premium Finnhub endpoint, monthly candle fallback, or intraday candle support was added.

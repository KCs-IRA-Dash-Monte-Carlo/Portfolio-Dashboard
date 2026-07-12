# Phase 2B Finnhub Data Services

Copy these files into the root of the MVP Portfolio Dashboard project, preserving paths:

```text
js/data/finnhub-client.js
js/data/market-data-service.js
js/data/cache-policy.js
js/data/risk-free-rate-service.js
js/data/symbol-service.js
tests/data-service-tests.html
```

## Scope

This increment implements Finnhub data services over the Phase 2A Request Queue interface. The services accept a queue instance but do not import a queue directly, so the app can pass the real `RequestQueue` from `js/data/request-queue.js`.

The implementation permits only these Finnhub endpoints:

```text
/quote
/stock/candle
/search
/stock/symbol
/stock/profile2
/stock/peers
/stock/market-status
/stock/market-holiday
/stock/metric
```

The risk-free-rate service uses the official no-key U.S. Treasury Daily Treasury Bill Rates XML feed and does not consume Finnhub request budget.

## Key handling

No Finnhub API key is embedded in these files. The test page accepts a runtime key in a password input and stores it in `sessionStorage` for the current browser tab only.

The application integration should provide the key with a settings provider function, for example:

```js
const client = new FinnhubClient({
  apiKeyProvider: () => settingsState.getFinnhubApiKey(),
  requestQueue
});
```

Do not log the key, include it in diagnostics, or include it in exports.

## Manual test sequence

1. Copy files into the project root.
2. Start the local server from the project folder:

```text
python3 -m http.server 8000
```

3. Open Firefox:

```text
http://localhost:8000/tests/data-service-tests.html
```

4. Open Firefox Developer Tools and keep the Console visible.
5. Click `Run stubbed tests`.
6. Confirm all stubbed tests pass.
7. Paste the temporary development Finnhub key into the runtime-key field. Do not save it in source code.
8. Click `Save runtime key for this tab`.
9. Run live tests in this order:
   - `Live quote snapshots`
   - `Live historical candles`
   - `Live symbol lookup`
   - `Live profile / metrics / peers`
   - `Live market status / holidays`
   - `Live Treasury risk-free rate`
10. Confirm the output redacts URL key parameters and does not display the raw key.
11. Temporarily disconnect network and rerun a live request after a successful cache-producing request. Confirm stale cache fallback where cached data exists.
12. Clear the runtime key and rerun a live Finnhub test. Confirm it fails visibly as `invalid-api-key` without showing a key.
13. Stop the server with `Control + C`.
14. Create a manual phase backup folder before continuing.

## Integration notes

- Quote refresh methods expect active symbols only. The caller should pass only symbols selected by active-symbol management.
- Historical candles are cached by symbol, resolution, from, and to.
- Company profile, company peers, and basic metrics cache TTL is seven calendar days.
- Peer data is exposed through `getCompanyPeersOnDemand()` to avoid automatic peer fan-out.
- The service distinguishes offline, rate-limited, temporary unavailable, quote-only, insufficient history, and plan/entitlement unavailable states through normalized availability values.
- No premium Finnhub endpoints, news endpoints, dividend-history endpoints, or dividend-income calculations are included.

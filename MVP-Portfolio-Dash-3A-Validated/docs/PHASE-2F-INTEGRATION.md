# Phase 2F Integration

Copy these files into the existing project, preserving paths:

- `js/data/live-data-errors.js`
- `js/data/cache-policy.js`
- `js/data/live-data-cache.js`
- `js/data/finnhub-client.js`
- `js/data/market-data-service.js`
- `js/data/symbol-service.js`
- `js/data/risk-free-rate-service.js`
- `js/diagnostics/live-data-diagnostics.js`
- `tests/data-service-tests.html`

The package does not include or replace `js/data/request-queue.js`. Phase 2F requires the existing Phase 2A queue.

## Request Queue contract

The default client adapter accepts an existing queue exposing one of:

- `enqueue(task, options)`
- `schedule(task, options)`

`task` is an async function. `options` includes:

```js
{
  priority,
  label,
  metadata: {
    provider: "finnhub",
    endpoint,
    requestType,
    symbol,
    priority
  },
  retry,
  signal
}
```

The metadata never includes the API key or an authenticated URL.

If the existing queue uses a different signature, pass an explicit adapter:

```js
const finnhubClient = new FinnhubClient({
  requestQueue,
  queueAdapter(queue, task, options) {
    return queue.enqueue({
      execute: task,
      priority: options.priority,
      label: options.label,
      metadata: options.metadata,
      signal: options.signal
    });
  },
  getApiKey: () => settingsState.getFinnhubApiKey()
});
```

There is no direct-fetch fallback. Missing or invalid queue wiring fails during client construction.

## IndexedDB cache contract

Bind the existing IndexedDB persistence manager through `createPersistenceLiveDataCache()`.

Preferred methods:

- `getLiveDataCache(key)`
- `putLiveDataCache(entry)`
- `deleteLiveDataCache(key)`, optional

Supported aliases are documented in `live-data-cache.js`. Generic IndexedDB methods are called as `get(storeName, key)` and `put(storeName, entry)`. Pass `{ storeName: "yourExistingStore" }` when the schema uses a different store name.

Recommended IndexedDB record shape:

```js
{
  key,
  category,
  symbol,
  source,
  data,
  storedAt,
  expiresAt,
  staleAfter,
  ttlMs,
  staleAfterMs,
  schemaVersion,
  provenance
}
```

Store these records in the existing quote/company-metadata cache stores or a versioned live-data cache store. Do not silently use the exported memory cache in production; it exists only for deterministic tests.

All initial cache reads and writes are guarded. An IndexedDB failure becomes a normalized warning or error and does not cause an unhandled rejection.

## Required TTLs

The following default TTLs are fixed at seven calendar days:

- Company profile
- Company peers
- Basic metrics

Peers are requested only when `getPeers()` or `getCompanyContext(..., { includePeers: true })` is called.

Quote, lookup, market-status, holiday, and Treasury cache windows are conservative operational defaults. They may be adjusted through `policyOverrides` without changing the required seven-day metadata TTLs.

## Basic wiring

```js
import { FinnhubClient } from "./js/data/finnhub-client.js";
import { createPersistenceLiveDataCache } from "./js/data/live-data-cache.js";
import { MarketDataService } from "./js/data/market-data-service.js";
import { SymbolService } from "./js/data/symbol-service.js";
import { RiskFreeRateService } from "./js/data/risk-free-rate-service.js";
import {
  LiveDataDiagnostics,
  createLiveDataDiagnosticRecorder
} from "./js/diagnostics/live-data-diagnostics.js";

const liveDataCache = createPersistenceLiveDataCache(indexedDbManager, {
  storeName: "liveDataCache"
});
const diagnostics = new LiveDataDiagnostics({
  requestQueue,
  storage: indexedDbManager
});
const recordDiagnostic = createLiveDataDiagnosticRecorder(diagnostics);

const finnhubClient = new FinnhubClient({
  requestQueue,
  getApiKey: () => settingsState.getFinnhubApiKey()
});

const marketData = new MarketDataService({
  client: finnhubClient,
  cache: liveDataCache,
  recordDiagnostic
});

const symbolService = new SymbolService({
  client: finnhubClient,
  cache: liveDataCache,
  recordDiagnostic,
  getHistoricalStatus: (symbol) => historicalDataService.getDatasetStatus(symbol)
});

const riskFreeRateService = new RiskFreeRateService({
  cache: liveDataCache,
  recordDiagnostic,
  getManualRate: () => settingsState.getManualRiskFreeRate()
});
```

## Quote refresh

Pass active symbols with roles so holdings are queued before benchmarks:

```js
const refresh = await marketData.refreshQuotes([
  { symbol: "DCO", role: "holding", hasLocalHistory: true },
  { symbol: "VTV", role: "holding", hasLocalHistory: true },
  { symbol: "ONEQ", role: "holding", hasLocalHistory: true },
  { symbol: "SPY", role: "benchmark", hasLocalHistory: true }
], {
  forceRefresh: true
});
```

The service enforces the 25-active-symbol limit. Every Finnhub call is admitted through the queue. Creating all quote promises does not create direct network fan-out because no task can execute outside the queue.

## Treasury rate

`RiskFreeRateService` queries the official U.S. Treasury Fiscal Data Treasury Securities Auctions dataset for the latest `13-Week` bill `high_investment_rate`.

- Treasury calls do not use the Finnhub queue or Finnhub request budget.
- The last successful value is cached.
- Failed retrieval returns stale cached data with a warning when available.
- A user-provided rate may be used only through `getManualRate` and is labeled as user-provided.
- No fixed fallback rate is embedded.

## Normalized result contract

Service calls return a non-throwing data result after provider/cache failures:

```js
{
  data,
  source: "live" | "cache" | "manual" | "none",
  availability,
  stale,
  cache,
  provenance,
  warnings,
  error
}
```

Invalid arguments, invalid construction, and active-symbol limit violations throw normalized `LiveDataError` objects because the operation cannot start safely.

## Manual tests

1. Copy the files into the project.
2. Confirm the existing `request-queue.js` remains in place.
3. Start the static server from the project root:

   ```text
   python3 -m http.server 8000
   ```

4. Open `http://localhost:8000/tests/data-service-tests.html` in Firefox.
5. Run all stubbed tests and confirm every test passes.
6. Enter the Finnhub key through the application Settings UI, not the test file or source code.
7. Refresh DCO, VTV, ONEQ, SPY, IWM, AVUV, AVDV, and PSCH.
8. Confirm Diagnostics shows queue budget, endpoint, symbol, timestamps, cache state, and normalized failures without the API key.
9. Disconnect internet access and confirm cached quotes/metadata are labeled stale rather than live.
10. Force an IndexedDB failure or test in a restricted storage context and confirm live fetches still return a normalized result with a cache warning.
11. Trigger a stubbed or real 429 and confirm the state is `rate-limited` when no cache exists and `stale` with `cachedDataUsed: true` when cache exists.
12. Search for a symbol without local history and confirm it is marked `quote-only`.
13. Confirm profile, peers, and metrics are not re-fetched during their seven-day TTL unless manually refreshed.
14. Confirm peers are not fetched during normal quote refresh.
15. Confirm the Treasury rate displays source, auction date, retrieval timestamp, and stale warning when applicable.
16. Search the Phase 2F source for the excluded historical endpoint and confirm no implementation references it.
17. Create a manual folder backup after the tests pass.

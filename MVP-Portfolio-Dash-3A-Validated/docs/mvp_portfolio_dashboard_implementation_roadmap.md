# MVP Portfolio Dashboard Implementation Roadmap

**Source authority:** `requirements.md`, Private Local Multi-Source MVP Requirements Specification, Version 2.2  
**Build policy:** Build one reviewed module at a time. Run, test, audit, and manually back up before moving forward.  
**Text editor:** SebEthaEdit  
**Primary desktop browser:** Mozilla Firefox on macOS Big Sur 11.7.11  
**Primary mobile target:** Safari Home Screen web app on iPhone 13 mini, iOS 26.5  
**Hosting scope:** Private static HTTPS from the owner’s Mac, accessible only on the trusted home Wi-Fi  
**Live data:** Finnhub free-tier endpoints, runtime API key only  
**Historical data:** Private Stooq split-adjusted, dividend-unadjusted daily text files  
**Synchronization:** Manual full portable backup and restore; no automatic sync

## Non-Negotiable Build Rules

1. The app remains client-side only. No application backend, user accounts, brokerage connection, or cloud sync.
2. The app is private and local. No public hosting, remote access, router port forwarding, or public distribution of the historical files.
3. The Finnhub API key is entered at runtime. It must not be hardcoded, committed, logged, shown in diagnostics, or included in exports by default.
4. Use HTML, CSS, plain JavaScript, ES2020-compatible modules, and Apache ECharts.
5. Use no build system for MVP unless explicitly approved later.
6. Start with CDN ECharts during desktop development. Vendor ECharts before offline and iPhone hardening.
7. Store small configuration in Local Storage and structured market/history data in IndexedDB.
8. Use private Stooq text files for historical daily OHLCV. Do not depend on Finnhub `/stock/candle`.
9. Treat Stooq history as split-adjusted and dividend-unadjusted.
10. Use full-series historical replacement as the default manual update method.
11. Enforce the 25 active-symbol cap across holdings and benchmarks.
12. Treat Finnhub as a rate-limited live-data provider.
13. Label OHLCV-based returns as price-return approximations, not exact total return.
14. MVP Monte Carlo includes only GBM and Historical Bootstrap.
15. Mac and iPhone storage are independent. Cross-device transfer uses full backup and restore.
16. The final iPhone origin uses stable trusted local HTTPS.
17. Use manual folder backups after every working phase.

# 1. Initial Project Setup

## 1.1 Folder Setup

Create a private working folder, for example:

```text
MVP-Portfolio-Dash/
```

Recommended structure:

```text
MVP-Portfolio-Dash/
  index.html
  manifest.json
  service-worker.js
  css/
    base.css
    layout.css
    themes.css
    print.css
  data/
    historical/
      seed/
        avdv.us.txt
        avuv.us.txt
        dco.us.txt
        iwm.us.txt
        oneq.us.txt
        psch.us.txt
        spy.us.txt
        vtv.us.txt
      manifest.json
  js/
    app.js
    core/
    data/
    portfolio/
    benchmarks/
    analytics/
    monte-carlo/
    charts/
    persistence/
    settings/
    ui/
    export/
    diagnostics/
    utils/
    workers/
  tests/
    index.html
    calculation-tests.html
    data-service-tests.html
    historical-data-tests.html
    storage-tests.html
    monte-carlo-tests.html
    ui-tests.html
    fixtures/
  assets/
    icons/
  vendor/
    echarts/
  docs/
  backups/
```

## 1.2 Desktop development server

For ordinary desktop development:

```text
cd ~/Desktop/MVP-Portfolio-Dash
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000/
```

Stop with `Control + C`.

## 1.3 Temporary LAN layout testing

For early iPhone layout testing only:

```text
python3 -m http.server 8000 --bind 0.0.0.0
```

Open the Mac’s LAN address from Safari on the iPhone. This temporary HTTP mode is not the final PWA origin.

## 1.4 Final private HTTPS origin

Before Home Screen and offline testing:

1. Reserve a stable local IP or stable `.local` hostname for the Mac.
2. Configure a static HTTPS server on a stable port.
3. Use a certificate trusted by the iPhone.
4. Allow the server through the Mac firewall on the home network only.
5. Do not configure router port forwarding.
6. Keep protocol, hostname, and port stable to preserve browser storage origin.

## 1.5 Manual backup rule

After each phase reaches a working state:

1. Stop editing.
2. Test in Firefox.
3. Run the relevant test page.
4. Confirm no fatal console errors.
5. Duplicate the full project folder.
6. Rename the copy with the completed phase.

Do not proceed without a working backup.

# 2. Target File and Module Map

## Required Root Files

| File | Purpose |
|---|---|
| `index.html` | Main app shell |
| `manifest.json` | PWA metadata |
| `service-worker.js` | Offline shell/static cache |
| `css/base.css` | Tokens, reset, accessibility basics |
| `css/layout.css` | Responsive desktop and iPhone layouts |
| `css/themes.css` | Dark/light themes and accents |
| `css/print.css` | Print-to-PDF report layout |
| `js/app.js` | App bootstrap and orchestration |
| `data/historical/manifest.json` | Private Stooq dataset manifest |

## Core Modules

| Module | Folder | Responsibility |
|---|---|---|
| App Core | `js/core/` | Lifecycle, constants, event bus, state coordination |
| Finnhub Data Services | `js/data/` | Quotes, lookup, metadata, market status, metrics |
| Historical Dataset Manager | `js/data/` | Stooq parsing, validation, normalization, import, replacement, alignment |
| Request Queue | `js/data/` | Finnhub limits, priority, retries, backoff |
| Persistence Manager | `js/persistence/` | Local Storage, IndexedDB, migrations, transactions |
| Portfolio Engine | `js/portfolio/` | Holdings, lots, cost basis, account value |
| Benchmark Engine | `js/benchmarks/` | Benchmark and active-symbol management |
| Analytics Engine | `js/analytics/` | Returns, CAGR, alpha, beta, drawdown, alignment |
| Monte Carlo Engine | `js/monte-carlo/`, `js/workers/` | GBM, bootstrap, workers, progress, cancellation |
| Chart Manager | `js/charts/` | ECharts lifecycle, mobile resizing, PNG export |
| UI Manager | `js/ui/` | Setup, import, forms, tabs, mobile behavior |
| Settings Manager | `js/settings/` | API key, display, horizon, data settings |
| Export Manager | `js/export/` | CSV, print, backups, restore |
| Diagnostics Manager | `js/diagnostics/` | API, storage, history, import, and simulation diagnostics |
| Utility Functions | `js/utils/` | Dates, formatting, sanitization, math, validation |
| Test Pages | `tests/` | Deterministic manual test harnesses |

# 3. Build Order Overview

## Phase 0: Approved Endpoint Verification

**Goal:** Verify the Finnhub live-data endpoints that remain in Version 2.2.

**Milestones:**

1. Verify `/quote` for all eight symbols.
2. Verify `/search` and/or `/stock/symbol`.
3. Verify `/stock/profile2`.
4. Verify `/stock/market-status` and `/stock/market-holiday`.
5. Verify `/stock/metric`.
6. Record rate-limit and error behavior.
7. Remove `/stock/candle` from required endpoint tests.

**Exit criteria:**

- Live endpoint behavior is documented.
- Quote-only operation is defined.

## Phase 1A–1C: Existing Foundation

Preserve the completed application shell, persistence foundation, setup wizard shell, and capability checks. Audit them against Version 2.2.

## Phase 1D: Private Home-Wi-Fi and iPhone Access

**Goal:** Establish a stable private origin for Safari and Home Screen testing.

**Milestones:**

1. Reserve a stable Mac LAN address or hostname.
2. Configure trusted local HTTPS.
3. Configure the Mac firewall for home-network access.
4. Confirm no router port forwarding.
5. Open the app in iPhone Safari.
6. Install to the Home Screen.
7. Test offline relaunch after caching.

**Exit criteria:**

- iPhone accesses the app on the same Wi-Fi without certificate warnings.
- Installed app relaunches from cache when the Mac server is stopped.

## Phase 2A: Existing Request Queue

Preserve and audit the completed request queue.

Required change:

- Historical imports and IndexedDB history reads are not Finnhub requests and do not consume request budget.

## Phase 2B: Stooq Parser and Validator

**Goal:** Parse and validate the approved historical format.

**Create:**

- `js/data/historical-file-parser.js`
- `js/data/historical-validator.js`
- `js/data/historical-normalizer.js`
- `js/data/historical-import-errors.js`
- `tests/historical-data-tests.html`

**Exit criteria:**

- All eight private files pass.
- Malformed synthetic fixtures fail predictably.

## Phase 2C: Private Seed Installation

**Goal:** Install the private eight-symbol dataset into IndexedDB.

**Create or update:**

- `data/historical/manifest.json`
- `js/data/historical-dataset-manager.js`
- IndexedDB schema and migration files

**Exit criteria:**

- All 34,122 validated observations install.
- Unchanged files are not reimported.
- Relaunch reads history from IndexedDB.

## Phase 2D: Manual Full-Series Updates

**Goal:** Support occasional Stooq updates in the same format.

**Milestones:**

1. Multi-file selection.
2. Validation preview.
3. Compare added, changed, removed, and unchanged rows.
4. Default to full-series replacement.
5. Commit transactionally per symbol.
6. Roll back on failure.
7. Invalidate derived analytics and simulations.

## Phase 2E: Historical Data Service and Diagnostics

**Goal:** Provide stable history interfaces to later modules.

**Required interfaces:**

- `getSeries`
- `getLatestCandle`
- `getDateRange`
- `getAlignedSeries`
- `getDatasetStatus`

**Exit criteria:**

- Eight-symbol alignment returns 1,703 common dates.
- Last 757 closes produce 756 return vectors.
- Diagnostics show provenance, freshness, counts, hashes, and flags.

## Phase 2F: Finnhub Live Data Services

**Goal:** Implement live-data services without historical candles.

**Milestones:**

- Quotes
- Symbol validation
- Company profile
- Peers on demand
- Market status and holidays
- Basic metrics
- Treasury rate
- Cache fallback
- Error normalization

## Phase 3: Portfolio Engine

Preserve the Version 2.1 scope, but consume history through the Historical Data Service.

## Phase 4: Benchmark Engine and Symbol Management

Preserve the Version 2.1 scope, including the 25-symbol limit and holding/benchmark separation.

## Phase 5: Charting

Add ECharts charts, iPhone 13 mini layouts, orientation handling, touch-safe gestures, and PNG export.

## Phase 6: Analytics

Implement split-adjusted, dividend-unadjusted price-return analytics from aligned local history.

## Phase 7: Monte Carlo

Implement worker-based GBM and Historical Bootstrap. Test Mac and iPhone path-count performance.

## Phase 8: Projection Horizon

Apply the global 1–10 year horizon across all projection outputs.

## Phase 9A: Full Portable Backup and Restore

Implement this before final reporting so the Mac-to-iPhone transfer workflow is available early.

## Phase 9B: Export and Reporting

Add CSV, print-to-PDF, PNG, and configuration backup.

## Phase 10: Hardening, Offline, and iPhone Validation

Vendor ECharts, finalize service-worker caching, test local HTTPS, iPhone offline launch, storage persistence, restore, orientation, gestures, and Monte Carlo cancellation.

# 4. Private Home-Wi-Fi Deployment Path

Public deployment is not part of Version 2.2.

## 4.1 Stable local origin

Choose one final origin, for example:

```text
https://portfolio-mac.local:8443/
```

or a reserved private LAN IP with HTTPS.

Do not change the origin after production use begins unless the user is prepared to reinstall and restore local state.

## 4.2 Security boundaries

Required:

- Trusted local HTTPS
- Mac firewall rule limited to local-network access
- No router port forwarding
- No public DNS
- No remote access
- No backend proxy

## 4.3 iPhone installation

1. Connect the Mac and iPhone to the same trusted Wi-Fi.
2. Start the static HTTPS server.
3. Open the stable URL in Safari.
4. Confirm the certificate is trusted.
5. Add the app to the Home Screen.
6. Install or restore historical data.
7. Stop the Mac server and test cached relaunch.

## 4.4 Updating the app

1. Update files on the Mac.
2. Increment the service-worker cache version.
3. Start the local server.
4. Open the app on the iPhone while on the home Wi-Fi.
5. Allow the service worker to update.
6. Verify the new application version in Diagnostics.

# 5. Module-by-Module ChatGPT Plus Build Prompts

Use one prompt at a time.

## Prompt 1D: Private Home-Wi-Fi HTTPS and iPhone Test Plan

```text
Authoritative spec: requirements.md.
Do not add a backend or public hosting.

Create a private local HTTPS setup and test plan for:
- MacBook on macOS Big Sur 11.7.11
- Safari on iPhone 13 mini, iOS 26.5
- same trusted home Wi-Fi only

Requirements:
1. Stable hostname or reserved LAN IP.
2. Trusted certificate on iPhone.
3. Static file server only.
4. Mac firewall instructions.
5. No router port forwarding.
6. Home Screen installation test.
7. Offline relaunch test after stopping the Mac server.
8. Do not include or expose a Finnhub key.
```

## Prompt 2B: Stooq Parser and Validator

```text
Build Phase 2B.
Authoritative spec: requirements.md.

Create:
- js/data/historical-file-parser.js
- js/data/historical-validator.js
- js/data/historical-normalizer.js
- js/data/historical-import-errors.js
- tests/historical-data-tests.html
- synthetic test fixtures only

Source format:
<TICKER>,<PER>,<DATE>,<TIME>,<OPEN>,<HIGH>,<LOW>,<CLOSE>,<VOL>,<OPENINT>

Requirements:
1. PER must equal D.
2. Normalize SYMBOL.US to SYMBOL.
3. Parse YYYYMMDD without UTC date shifting.
4. Validate ascending unique dates.
5. Validate finite positive OHLC and nonnegative finite volume.
6. Validate OHLC bounds.
7. Preserve source precision.
8. Mark priceAdjustment=split-adjusted and dividendAdjustment=none.
9. Ignore OPENINT and daily TIME placeholder.
10. Return normalized records plus warnings and provenance.
11. Provide exact files and manual tests.
```

## Prompt 2C: Private Seed Installation

```text
Build Phase 2C.
Authoritative spec: requirements.md.

Create or update:
- data/historical/manifest.json
- js/data/historical-dataset-manager.js
- js/persistence/schema.js
- js/persistence/indexed-db.js
- tests/historical-data-tests.html

Requirements:
1. Install the eight private Stooq files into IndexedDB.
2. Use [symbol,date] as the candle key.
3. Store dataset version, hash, source, adjustment metadata, counts, and dates.
4. Skip unchanged files.
5. Use transactional writes per symbol.
6. Do not leave partial series after failure.
7. Show progress.
8. Do not parse every file on every launch.
9. Provide exact files and manual tests.
```

## Prompt 2D: Manual Stooq Replacement Import

```text
Build Phase 2D.
Authoritative spec: requirements.md.

Create:
- js/data/historical-import-service.js
- js/ui/historical-import-dialog.js
- js/ui/historical-import-preview.js
- tests/historical-data-tests.html updates

Requirements:
1. Multi-file selection from desktop and iOS Files.
2. Validate complete files before storage.
3. Show added, changed, removed, and unchanged records.
4. Default to full-series replacement.
5. Permit append only when overlapping records match exactly.
6. Confirm before replacement.
7. Commit transactionally per symbol.
8. Roll back on failure.
9. Invalidate affected analytics and simulations.
10. Record import history and diagnostics.
```

## Prompt 2E: Historical Data Service

```text
Build Phase 2E.
Authoritative spec: requirements.md.

Create:
- js/data/historical-data-service.js
- js/data/historical-quality.js
- js/diagnostics/historical-data-diagnostics.js

Expose:
- getSeries(symbol, options)
- getLatestCandle(symbol)
- getDateRange(symbol)
- getAlignedSeries(symbols, options)
- getDatasetStatus(symbol)

Requirements:
1. Read normalized data from IndexedDB only.
2. Align by exact trading date.
3. Return 757 closes for a 756-return Monte Carlo window.
4. Surface missing, stale, insufficient, and quality-warning states.
5. Provide provenance and counts to Diagnostics.
```

## Prompt 2F: Finnhub Live Data Services

```text
Build Phase 2F.
Authoritative spec: requirements.md.
Use the existing Request Queue.

Permitted Finnhub endpoints:
- /quote
- /search
- /stock/symbol
- /stock/profile2
- /stock/peers
- /stock/market-status
- /stock/market-holiday
- /stock/metric

Do not call /stock/candle.
Do not hardcode or log an API key.
Implement quotes, lookup, metadata TTLs, market context, Treasury rate, cache fallback, and normalized errors.
```

## Prompt 3A: Portfolio Engine

Use the original Phase 3 prompt, but replace Finnhub candle references with the Historical Data Service and Version 2.2 labels.

## Prompt 5A: Chart Manager

Use the original chart prompt and add iPhone 13 mini portrait/landscape, safe-area, orientation-change, and touch-gesture tests.

## Prompt 6A: Analytics Engine

Use normalized Stooq close history. Label results split-adjusted, dividend-unadjusted price-return approximations.

## Prompt 7A–7C: Monte Carlo

Use aligned local history. Keep worker execution, cancellation, fixed seeds, GBM, and whole-vector Historical Bootstrap. Test 1,000, 2,500, and 5,000 paths on iPhone.

## Prompt 9A: Full Portable Backup and Restore

```text
Build Phase 9A.
Authoritative spec: requirements.md.

Create a versioned full backup containing configuration, normalized historical candles, manifests, hashes, quality flags, and import history.
Validate the entire backup before transactional restore.
Exclude the Finnhub key by default.
Provide a Mac-to-iPhone AirDrop/Files restore test.
```

## Prompt 10A: Local Offline Hardening

Vendor ECharts, finalize service-worker caches, test the trusted local HTTPS origin, iPhone Home Screen mode, offline launch, Mac-host-unavailable launch, storage persistence, and cache-version updates.

## Prompt 10B: Final Version 2.2 Audit

Audit against `requirements.md`, including private hosting, no backend, no remote access, Stooq import/replacement, full backup transfer, iPhone 13 mini compatibility, and secret non-exposure.

# 6. Phase Acceptance Checklist

```text
Phase:
Date:
Desktop browser:
Mobile browser/device:
Backup folder created:

Checks:
[ ] App loads from the intended origin.
[ ] No fatal console errors.
[ ] No real API key in source, logs, diagnostics, or exports.
[ ] No backend, public hosting, remote access, or router forwarding introduced.
[ ] Finnhub /stock/candle is not required.
[ ] Relevant Stooq parser/import tests pass.
[ ] IndexedDB transactions roll back on failure.
[ ] Feature availability states are explicit.
[ ] Offline behavior is tested where relevant.
[ ] iPhone behavior is tested where relevant.
[ ] Manual backup created.

Notes:
```

# 7. Recommended Build Rhythm

For each module:

1. Use one module prompt.
2. Request exact file contents.
3. Copy files into SebEthaEdit.
4. Save and run from the correct origin.
5. Open Developer Tools.
6. Fix runtime errors before adding more modules.
7. Run the relevant test page.
8. Test on iPhone when the phase affects mobile, storage, import, PWA, or workers.
9. Audit against the phase checklist.
10. Duplicate the project folder as a manual backup.

Do not accept generated work that silently adds:

- Backend code
- Public hosting
- Remote access
- Router port forwarding
- Cloud sync
- Automatic device synchronization
- Premium Finnhub dependencies
- Finnhub historical candles
- News
- Dividend-income calculations
- Total-return claims
- WebSocket streaming
- Regime Switching Monte Carlo
- Stochastic Volatility Monte Carlo
- Custom PDF libraries


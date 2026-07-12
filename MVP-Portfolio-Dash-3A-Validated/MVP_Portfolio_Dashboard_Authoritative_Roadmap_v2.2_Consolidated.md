# MVP Portfolio Dashboard
## Authoritative Implementation Roadmap - Version 2.2 Consolidated

**Status:** Authoritative merged roadmap  
**Requirements authority:** `requirements.md`, Private Local Multi-Source MVP Requirements Specification, Version 2.2  
**Supersedes:** the separate Version 2.1 and Version 2.2 roadmap documents  
**Prepared for:** private personal use on the owner's MacBook and iPhone 13 mini  
**Primary desktop target:** Mozilla Firefox on macOS Big Sur 11.7.11  
**Primary mobile target:** Safari Home Screen web app on iPhone 13 mini, iOS 26.5  
**Hosting scope:** private static HTTPS from the owner's Mac, same trusted home Wi-Fi only  
**Live data:** Finnhub free-tier endpoints, runtime API key only  
**Historical data:** private Stooq split-adjusted, dividend-unadjusted daily text files  
**Synchronization:** manual full portable backup and restore; no automatic sync  

---

# Document Control

| Item | Decision |
|---|---|
| Roadmap version | 2.2 Consolidated |
| Requirements version | 2.2 |
| Purpose | Merge and replace the applicable Version 2.1 and Version 2.2 roadmap material |
| Completed scope | Phase 1A through 1C and Phase 2A through 2F |
| Deferred scope | Phase 1D private home-Wi-Fi HTTPS and iPhone installation |
| Next active build | Phase 3A Portfolio Data Model and Engine |
| Public deployment | Excluded |
| Remote access | Excluded |
| Backend and cloud sync | Excluded |
| Historical provider | Private Stooq files; manual complete-series refreshes |
| Finnhub historical candles | Not used and not permitted as an MVP dependency |

## Status interpretation

The user-approved roadmap status marks Phase 1A through Phase 1C and Phase 2A through Phase 2F as complete. Phase 1D is explicitly deferred and therefore is not included in the completed range despite its numeric placement. Any code or draft work beyond Phase 2F must be audited and accepted before its status changes in this roadmap.

## Authority rule

`requirements.md` Version 2.2 is authoritative. This roadmap controls build order, prompts, test gates, and deliverables, but it cannot weaken or contradict the requirements document. Any proposed change to project behavior requires explicit approval and a requirements update before implementation.

# Table of Contents

1. Consolidated project decisions
2. Current implementation status
3. Non-negotiable build rules
4. Development and deployment environment
5. Canonical project file tree
6. Module boundaries and stable interfaces
7. Consolidated build order and dependency gates
8. Phase execution packets
   - Phase 0: Approved endpoint verification
   - Phase 1A: Application shell and file structure
   - Phase 1B: Persistence foundation
   - Phase 1C: Setup wizard shell
   - Phase 1D: Private home-Wi-Fi HTTPS and iPhone access
   - Phase 2A: Finnhub request queue
   - Phase 2B: Stooq parser, validator, and normalizer
   - Phase 2C: Private seed installation
   - Phase 2D: Manual historical-data imports
   - Phase 2E: Historical Data Service and diagnostics
   - Phase 2F: Finnhub live-data services
   - Phase 3A: Portfolio data model and engine
   - Phase 3B: Portfolio UI and corporate-action workflow
   - Phase 4A: Benchmark and active-symbol management
   - Phase 5A: Chart Manager
   - Phase 6A: Analytics Engine
   - Phase 7A: Monte Carlo worker infrastructure
   - Phase 7B: GBM Monte Carlo
   - Phase 7C: Historical Bootstrap Monte Carlo
   - Phase 8A: Projection horizon and projection visuals
   - Phase 9A: Full portable backup and restore
   - Phase 9B: Export and reporting
   - Phase 10A: Hardening, vendoring, offline, and iPhone validation
   - Phase 10B: Final requirements audit
9. Cross-phase testing matrix
10. Backup, versioning, and release discipline
11. Mac-to-iPhone operating workflow
12. Final MVP acceptance checklist
13. Prompt execution rules

The DOCX uses heading styles so Google Docs can display and navigate the document outline after import.

# 1. Consolidated Project Decisions

## 1.1 Product definition

Build a private, local, client-side retirement portfolio dashboard that provides holdings and lot tracking, current quote snapshots, historical charts, price-return analytics, benchmark comparisons, GBM and Historical Bootstrap Monte Carlo projections, local persistence, offline-capable PWA behavior, exports, reporting, and full portable backup and restore.

## 1.2 Approved data architecture

| Data need | Approved source | Storage and behavior |
|---|---|---|
| Current quote snapshots | Finnhub `/quote` | Browser request queue; cached in IndexedDB |
| Symbol lookup and validation | Finnhub `/search` and/or `/stock/symbol` | Runtime request; cache where useful |
| Company profile | Finnhub `/stock/profile2` | IndexedDB, default 7-day TTL |
| Company peers | Finnhub `/stock/peers` | On demand only, default 7-day TTL |
| Market status and holidays | Finnhub `/stock/market-status`, `/stock/market-holiday` | Cached market context |
| Basic metrics | Finnhub `/stock/metric` | IndexedDB, default 7-day TTL |
| Historical daily OHLCV | Private Stooq text files | Validated, normalized, and stored in IndexedDB |
| Historical updates | Occasional manual imports in the same Stooq format | Complete-series replacement by default |
| Risk-free rate | U.S. Treasury Fiscal Data API or another approved public no-key source | Cached value, source, timestamp, and stale warning |

Finnhub `/stock/candle` is excluded from the MVP architecture. Premium or alternate historical-data providers are not part of this roadmap.

## 1.3 Historical-data methodology

The private Stooq series are treated as:

- Daily frequency
- Split-adjusted prices
- Dividend-unadjusted returns
- Price-return approximations rather than exact total return
- Complete historical series per symbol

The validated private seed universe is:

- Holdings: DCO, VTV, ONEQ
- Benchmarks: SPY, IWM, AVUV, AVDV, PSCH
- Total observations: 34,122
- Common aligned observations: 1,703 closing prices
- Common range: September 27, 2019 through July 9, 2026
- Monte Carlo capacity: 757 aligned closes producing 756 daily return vectors

## 1.4 Hosting and device scope

The application is hosted privately from the owner's Mac and accessed only by devices on the same trusted home Wi-Fi. The final iPhone origin uses a stable hostname or reserved LAN IP, a stable port, and HTTPS trusted by the iPhone.

Excluded:

- Public hosting
- Public distribution of the private Stooq files
- Router port forwarding
- Dynamic DNS
- Remote internet access
- VPN access for this MVP
- Application backend
- Cloud synchronization
- Brokerage integration

## 1.5 Device separation

The Mac and iPhone maintain independent Local Storage, IndexedDB, service-worker caches, quote caches, and API-key settings. Cross-device transfer uses a full portable backup and transactional restore. The Finnhub key is excluded from backups by default and is entered separately on each device.

# 2. Current Implementation Status

| Phase | Status | Roadmap treatment |
|---|---|---|
| Phase 0 | Complete | Retain as an archived verification and rebuild prompt; `/stock/candle` removed |
| Phase 1A | Complete | Preserve; audit against Version 2.2 |
| Phase 1B | Complete | Preserve; audit IndexedDB schema compatibility |
| Phase 1C | Complete | Preserve; audit Stooq and backup wording |
| Phase 1D | Deferred | Execute only on the target home Wi-Fi; mandatory before final acceptance |
| Phase 2A | Complete | Preserve; historical file work does not consume API budget |
| Phase 2B | Complete | Preserve parser, validator, normalizer, and synthetic tests |
| Phase 2C | Complete | Preserve private seed installation and manifest behavior |
| Phase 2D | Complete | Preserve complete-series import and rollback behavior |
| Phase 2E | Complete | Preserve Historical Data Service and diagnostics |
| Phase 2F | Complete | Preserve Finnhub live services; no candle calls |
| Phase 3A | Next active phase | Build and accept next |
| Phase 3B | Not accepted | Follows Phase 3A |
| Phase 4A | Not accepted | Follows portfolio engine acceptance |
| Phase 5A | Not accepted | Requires stable portfolio and benchmark interfaces |
| Phase 6A | Not accepted | Requires Historical Data Service, portfolio, benchmarks, and chart contracts |
| Phase 7A-7C | Not accepted | Requires Analytics Engine and stable aligned-return interfaces |
| Phase 8A | Not accepted | Requires Monte Carlo state and chart interfaces |
| Phase 9A | Not accepted | Implement before final iPhone transfer testing |
| Phase 9B | Not accepted | Follows stable calculations and charts |
| Phase 10A-10B | Not accepted | Final hardening and acceptance audit |

## 2.1 Immediate next action

Proceed with Phase 3A. Do not begin Phase 4 or later work until Phase 3A passes its deterministic tests, manual tests, audit prompt, and backup gate.

## 2.2 Deferred Phase 1D rule

Phase 1D does not block desktop development. It becomes blocking before:

- Final Home Screen PWA acceptance
- Final iPhone offline acceptance
- Final Mac-to-iPhone restore acceptance
- Phase 10B final acceptance

When the owner is on the target home Wi-Fi, execute Phase 1D using the canonical prompt in this document. Do not improvise a public or remotely accessible alternative.

# 3. Non-Negotiable Build Rules

1. `requirements.md` Version 2.2 is authoritative.
2. Build and review one module or subphase at a time.
3. Use HTML, CSS, plain JavaScript, and ES2020-compatible modules.
4. Use no required build system unless explicitly approved later.
5. Keep business logic independent from rendering logic.
6. Keep the application client-side only; do not add an application backend.
7. Do not add public hosting, cloud sync, user accounts, brokerage connections, or remote access.
8. Use Finnhub only for the approved free-tier live-data endpoints.
9. Do not call or depend on Finnhub `/stock/candle`.
10. Use private Stooq files for split-adjusted, dividend-unadjusted daily historical OHLCV.
11. Store normalized historical data in IndexedDB and read history through the Historical Data Service.
12. Default manual historical updates to complete-series replacement.
13. Permit append only when every overlapping stored record matches exactly.
14. Never leave a partial historical series after a failed import or schema migration.
15. Treat Finnhub as a rate-limited cache-and-refresh provider.
16. Enforce no more than 60 calls per minute and 30 calls per second.
17. Prevent uncontrolled request fan-out.
18. Enforce the 25 active-symbol cap across holdings and benchmarks.
19. Enter the Finnhub key at runtime only.
20. Never hardcode, commit, log, export, or expose the Finnhub key in diagnostics.
21. Label Stooq-derived analytics as split-adjusted, dividend-unadjusted price-return approximations.
22. Do not claim exact total return, dividend reinvestment, brokerage reconciliation, or tax-adjusted performance.
23. Do not implement dividend-income calculations, news, SEC filings, ownership, executives, or premium datasets.
24. Do not auto-apply stock splits or other corporate actions to user lots.
25. MVP Monte Carlo methods are GBM and Historical Bootstrap only.
26. Do not add Regime Switching, Stochastic Volatility, deterministic shock scenarios, or block bootstrap without explicit approval.
27. Run computationally expensive simulations in Web Workers.
28. Show progress, allow cancellation, and prevent stale simulation results from appearing current.
29. Do not silently reduce a user-selected path count or projection universe.
30. Start with CDN ECharts only where already approved for development; vendor ECharts before final offline acceptance.
31. Use browser Print to PDF; do not add a custom PDF library.
32. Maintain separate Mac and iPhone browser storage.
33. Use full portable backup and restore for device transfer.
34. Exclude the Finnhub key from backup by default.
35. Preserve all source precision and round only for display.
36. Use date-only parsing that avoids UTC date shifting.
37. Feature unavailability must be explicit; do not fabricate values.
38. Run relevant deterministic and manual tests before moving to the next phase.
39. Audit every phase against this roadmap and `requirements.md`.
40. Create a manual working-folder backup after every accepted phase.

# 4. Development and Deployment Environment

## 4.1 Desktop development

Primary environment:

- MacBook Retina
- 1.2 GHz Dual-Core Intel processor
- 8 GB memory
- macOS Big Sur 11.7.11
- Mozilla Firefox desktop
- SebEthaEdit

Ordinary desktop development server:

```text
cd ~/Desktop/MVP-Portfolio-Dash
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000/
```

Stop with `Control + C`.

## 4.2 Temporary iPhone layout testing

For temporary same-network HTTP layout testing only:

```text
python3 -m http.server 8000 --bind 0.0.0.0
```

Open the Mac's LAN address from Safari. This mode is not the final secure origin and must not be used for final service-worker, Home Screen, or offline acceptance.

## 4.3 Final private local HTTPS

Before final iPhone acceptance:

1. Use a stable reserved LAN IP or stable `.local` hostname.
2. Use one stable HTTPS port.
3. Install a certificate chain trusted by the iPhone.
4. Permit the static server through the Mac firewall for the private network only.
5. Do not configure router port forwarding.
6. Keep protocol, hostname, and port stable because browser storage is origin-specific.
7. Verify Safari access without certificate warnings.
8. Install from Safari to the Home Screen.
9. Verify offline relaunch after stopping the Mac server.

## 4.4 Private historical-data placement

```text
MVP-Portfolio-Dash/
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
```

The real files remain private. Synthetic fixtures are used for deterministic parser tests.

# 5. Canonical Project File Tree

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
      app-state.js
      constants.js
      event-bus.js
      symbol-registry.js
    data/
      api-errors.js
      request-queue.js
      finnhub-client.js
      market-data-service.js
      cache-policy.js
      symbol-service.js
      risk-free-rate-service.js
      historical-file-parser.js
      historical-validator.js
      historical-normalizer.js
      historical-import-errors.js
      historical-dataset-manager.js
      historical-import-service.js
      historical-data-service.js
      historical-quality.js
    persistence/
      local-storage.js
      indexed-db.js
      schema.js
    portfolio/
      portfolio-model.js
      lot-model.js
      portfolio-validation.js
      portfolio-engine.js
    benchmarks/
      benchmark-model.js
      benchmark-engine.js
    analytics/
      return-series.js
      date-alignment.js
      cagr.js
      alpha-beta.js
      drawdown.js
      analytics-engine.js
    monte-carlo/
      mc-controller.js
      mc-state.js
      mc-inputs.js
      gbm.js
      bootstrap.js
      random.js
      covariance.js
      statistics.js
    charts/
      chart-manager.js
      chart-options.js
      chart-export.js
      chart-state.js
      mc-confidence-fan.js
      mc-percentile-bands.js
    settings/
      settings-state.js
      projection-settings.js
    ui/
      setup-wizard.js
      historical-import-dialog.js
      historical-import-preview.js
      portfolio-editor.js
      lot-editor.js
      benchmark-manager.js
      availability-state.js
    export/
      csv-export.js
      backup-export.js
      backup-restore.js
      full-backup-export.js
      full-backup-restore.js
      print-report.js
      export-manager.js
    diagnostics/
      capabilities.js
      diagnostics-store.js
      historical-data-diagnostics.js
      simulation-diagnostics.js
    utils/
      date-utils.js
      number-utils.js
      projection-date-utils.js
      validation-utils.js
      formatting.js
      sanitization.js
    workers/
      monte-carlo-worker.js
      worker-protocol.js
  tests/
    index.html
    storage-tests.html
    data-service-tests.html
    historical-data-tests.html
    calculation-tests.html
    monte-carlo-tests.html
    ui-tests.html
    fixtures/
      synthetic-valid-history.txt
      synthetic-invalid-header.txt
      synthetic-invalid-ohlc.txt
      synthetic-duplicate-date.txt
      synthetic-unsorted-dates.txt
      synthetic-insufficient-history.txt
  assets/
    icons/
  vendor/
    echarts/
  docs/
    phase-00-endpoint-verification.md
    private-https-iphone-setup.md
    data-methodology.md
    test-results/
  backups/
```

This is a target map, not permission to create every file in one generation. Create or change only the files authorized by the active phase prompt.

# 6. Module Boundaries and Stable Interfaces

## 6.1 Data Services

Responsible for Finnhub live access, Treasury-rate retrieval, caching, TTL decisions, error normalization, and current-data availability states.

Must not parse Stooq files or perform portfolio calculations.

## 6.2 Historical Dataset Manager

Responsible for parsing, validation, normalization, manifests, hashes, seed installation, import preview, complete-series replacement, quality flags, transactional persistence coordination, and derived-result invalidation.

## 6.3 Historical Data Service

Stable public interface:

```text
getSeries(symbol, options)
getLatestCandle(symbol)
getDateRange(symbol)
getAlignedSeries(symbols, options)
getDatasetStatus(symbol)
```

Later modules must not read raw Stooq files directly or depend on source column names.

## 6.4 Request Queue

Responsible only for Finnhub request scheduling, priorities, limits, throttling, backoff, retry behavior, cancellation where appropriate, and approximate request-budget reporting.

Historical file parsing and IndexedDB reads do not consume Finnhub request budget.

## 6.5 Portfolio Engine

Stable public calculations must include:

```text
calculateLotCost(lot)
calculateHoldingCost(holding)
calculatePositionValue(shares, price)
calculatePortfolioValue(holdings, quotes)
calculateMarketValueWeights(positions)
buildHistoricalAccountValueSeries(portfolio, historicalService, options)
```

## 6.6 Benchmark Engine and Symbol Registry

Must preserve separate holding and benchmark records even when they share a ticker. It owns active-state enforcement and the 25-symbol cap, but not quote retrieval or analytics calculations.

## 6.7 Analytics Engine

Stable public calculations must include:

```text
buildPriceReturnSeries(input)
normalizeSeries(input)
calculateCAGR(input)
calculateAlphaBeta(input)
calculateMaximumDrawdown(input)
```

It consumes aligned normalized history, not source files.

## 6.8 Monte Carlo Engine

Stable interfaces must include worker-controlled GBM and Historical Bootstrap runs, fixed-seed reproducibility, cancellation, progress, stale-input detection, and summary statistics.

## 6.9 Chart Manager

Owns ECharts lifecycle, theme updates, responsive resize, orientation handling, touch conflict management, PNG export, and cleanup. It must not implement financial calculations.

## 6.10 Persistence Manager

Owns Local Storage and IndexedDB schema, migrations, transactional writes, versioning, and rollback support. It must not expose secrets through diagnostics or backups.

## 6.11 Export Manager

Owns CSV, PNG integration, print reports, configuration backup, full portable backup, validation, and transactional restore.

## 6.12 Diagnostics Manager

Owns capability, API, cache, historical dataset, import, storage, and simulation diagnostics. It must redact sensitive request parameters and never expose the Finnhub key.

# 7. Consolidated Build Order and Dependency Gates

```text
Phase 0 endpoint verification [complete]
        |
Phase 1A application shell [complete]
        |
Phase 1B persistence [complete]
        |
Phase 1C setup wizard [complete]
        |
Phase 2A request queue [complete]
        |
Phase 2B Stooq parser/validator [complete]
        |
Phase 2C seed installation [complete]
        |
Phase 2D manual import [complete]
        |
Phase 2E Historical Data Service [complete]
        |
Phase 2F Finnhub live services [complete]
        |
Phase 3A portfolio model/engine [next]
        |
Phase 3B portfolio UI/corporate actions
        |
Phase 4A benchmarks and symbol registry
        |
Phase 5A chart manager
        |
Phase 6A analytics
        |
Phase 7A worker infrastructure
        +--> Phase 7B GBM
        +--> Phase 7C Historical Bootstrap
        |
Phase 8A projection horizon and visuals
        |
Phase 9A full portable backup/restore
        |
Phase 9B exports and reporting
        |
Phase 10A hardening/offline/iPhone validation
        |
Phase 10B final audit
```

Phase 1D is a parallel deferred infrastructure phase. Complete it on the target home Wi-Fi before the final iPhone, backup-transfer, offline, and Phase 10 acceptance gates.

## 7.1 Gate rule

A phase is accepted only after:

1. Exact authorized deliverables are present.
2. Deterministic tests pass.
3. Manual tests pass in the required browser or device.
4. The phase audit prompt reports no blocking defect.
5. No architectural drift or secret exposure is found.
6. A working-folder backup is created.
7. The status table is updated.

# 8. Phase Execution Packets

Use the implementation prompt only for the named phase. After implementation, use the audit prompt in a separate turn. Do not combine implementation and audit into one generation. For phases marked complete, the prompt is retained as the canonical rebuild or repair prompt and should not be rerun unless an audit identifies a defect.


# Phase 0 - Approved Endpoint Verification
**Status:** Complete

## Purpose

Verify the Finnhub free-tier live-data endpoints retained by Version 2.2 and document quote-only and failure-state behavior without implementing application features.

## Dependencies

- Authoritative `requirements.md` Version 2.2
- Temporary runtime Finnhub key entered manually
- No production application code

## Required deliverables

- `docs/phase-00-endpoint-verification.md`
- Recorded response shapes and failure classifications
- No source file containing an API key

## Canonical implementation prompt

```text
You are validating Phase 0 for my private client-side PWA retirement portfolio dashboard.

Authoritative spec: requirements.md, Version 2.2.
Do not write application code.
Do not include a literal API key in the response or any file.

Create or update docs/phase-00-endpoint-verification.md for these permitted Finnhub endpoints:
- /quote
- /search
- /stock/symbol
- /stock/profile2
- /stock/peers
- /stock/market-status
- /stock/market-holiday
- /stock/metric

Do not test or require /stock/candle.

Required symbols:
DCO, VTV, ONEQ, SPY, IWM, AVUV, AVDV, PSCH

Include:
1. Manual browser or test-page procedures using a runtime key.
2. Expected response fields to inspect.
3. Failure modes and normalized classifications.
4. How to distinguish offline, invalid key, rate limit, temporary provider failure, missing symbol, and endpoint entitlement failure.
5. Quote-only behavior when local history is absent.
6. A result-recording template with date, endpoint, symbol, status, HTTP code, and redacted notes.
7. No backend, proxy, or premium endpoint.
```

## Canonical audit prompt

```text
Audit Phase 0 against requirements.md Version 2.2.

Check:
- Only approved Finnhub live endpoints are included.
- /stock/candle is absent.
- No real API key appears in documentation, examples, URLs, logs, or screenshots.
- All eight required symbols are covered.
- Failure classifications distinguish offline, invalid key, rate limit, temporary failure, missing data, and entitlement failure.
- Quote-only behavior is documented.
- No application code, backend, proxy, or premium dependency was introduced.

Return:
1. Pass/fail by requirement.
2. Blocking defects.
3. Exact documentation fixes.
Do not write production code.
```

## Manual test checklist

- [ ] Open the verification document and confirm every approved endpoint has a procedure.
- [ ] Enter a temporary key only at runtime and verify it is not preserved in copied results.
- [ ] Test at least one valid symbol and one deliberately invalid symbol.
- [ ] Record one simulated or observed offline failure.
- [ ] Confirm `/stock/candle` is not present in the final document.

## Exit criteria

- Endpoint behavior is documented.
- Failure states are defined.
- No secret is retained.
- No obsolete historical endpoint remains.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Retained for traceability. Historical feasibility is now provided by private Stooq files rather than Finnhub candles.


# Phase 1A - Application Shell and File Structure
**Status:** Complete

## Purpose

Create the static PWA shell, responsive semantic layout, core CSS, manifest, service-worker skeleton, module folders, and test index without market data or calculations.

## Dependencies

- Phase 0 decisions
- HTML/CSS/plain JavaScript
- Firefox desktop on macOS Big Sur

## Required deliverables

- `index.html`
- `manifest.json`
- `service-worker.js`
- `css/base.css`
- `css/layout.css`
- `css/themes.css`
- `css/print.css`
- `js/app.js`
- Module folder structure
- `tests/index.html`

## Canonical implementation prompt

```text
Build or repair Phase 1A of my private local PWA retirement portfolio dashboard.

Authoritative spec: requirements.md, Version 2.2.
Do not implement market data, historical parsing, analytics, charts, Monte Carlo, exports, or a backend.

Create or update only:
- index.html
- manifest.json
- service-worker.js
- css/base.css
- css/layout.css
- css/themes.css
- css/print.css
- js/app.js
- empty or placeholder module folders under js/
- tests/index.html

Constraints:
- HTML, CSS, plain ES2020 JavaScript
- no build system
- primary desktop browser: Firefox on macOS Big Sur 11.7.11
- private local project

Requirements:
1. Load from http://localhost:8000/ during desktop development.
2. Include semantic landmarks and accessible navigation.
3. Include responsive placeholders for dashboard, holdings, benchmarks, analytics, projections, settings, diagnostics, and report.
4. Include light and dark theme variables.
5. Include iPhone 13 mini responsive breakpoints and safe-area-ready CSS variables without claiming final device acceptance.
6. Include a versioned service-worker shell cache skeleton.
7. Include no API key, provider call, backend, public-hosting assumption, or remote-access code.
8. Show where later modules attach without implementing them.
9. Provide exact file contents and manual tests.
```

## Canonical audit prompt

```text
Audit Phase 1A against requirements.md Version 2.2.
Do not rewrite files unless a defect is identified.

Check:
- Static PWA root files exist.
- No build system or backend was introduced.
- HTML landmarks and navigation are accessible.
- Light and dark tokens exist.
- Layout includes all required application sections.
- CSS is compatible with Firefox/macOS Big Sur and prepared for iPhone safe areas.
- Service worker uses an explicit cache version and has no private-data leakage.
- No market-data call or API key exists.
- No public-hosting or remote-access requirement exists.

Return pass, partial, fail, architectural drift, compatibility risks, and exact fixes.
```

## Manual test checklist

- [ ] Run `python3 -m http.server 8000` from the project root.
- [ ] Open `http://localhost:8000/` in Firefox.
- [ ] Confirm all navigation targets and placeholder panels render.
- [ ] Resize from desktop to narrow mobile width and check for horizontal page overflow.
- [ ] Toggle light and dark themes if the shell supports it.
- [ ] Open Developer Tools and confirm no fatal error.
- [ ] Confirm the service worker registers or fails visibly without blocking the shell.

## Exit criteria

- Static shell loads.
- Required regions are present.
- No prohibited functionality exists.
- No fatal console error remains.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Completed. Retain this prompt for repair or clean reconstruction only.


# Phase 1B - Persistence Foundation
**Status:** Complete

## Purpose

Provide versioned Local Storage and IndexedDB foundations, settings state, migration stubs, write batching, quota handling, and browser capability diagnostics.

## Dependencies

- Accepted Phase 1A shell
- Browser storage support
- No live market calls

## Required deliverables

- `js/persistence/local-storage.js`
- `js/persistence/indexed-db.js`
- `js/persistence/schema.js`
- `js/settings/settings-state.js`
- `js/diagnostics/capabilities.js`
- `tests/storage-tests.html`

## Canonical implementation prompt

```text
Build or repair Phase 1B persistence foundation.

Authoritative spec: requirements.md, Version 2.2.
Do not implement live market-data calls, Stooq parsing, analytics, charts, Monte Carlo, or export content.

Create or update:
- js/persistence/local-storage.js
- js/persistence/indexed-db.js
- js/persistence/schema.js
- js/settings/settings-state.js
- js/diagnostics/capabilities.js
- tests/storage-tests.html

Requirements:
1. Local Storage is limited to lightweight configuration: holdings, lots, active-symbol preferences, benchmarks, API settings metadata, theme, accent, font scale, UI preferences, projection horizon, Monte Carlo settings, export preferences, and backup-reminder state.
2. IndexedDB provides versioned stores for quote snapshots, historical candles, historical datasets, import history, quality flags, company metadata, diagnostics history, and export staging.
3. Include schema versioning and migration hooks.
4. Use debounced or batched writes where practical.
5. Handle quota, unavailable storage, blocked upgrade, aborted transaction, and corrupted value errors visibly.
6. Never put a real API key in fixtures or diagnostics.
7. Capability checks include Local Storage, IndexedDB, service workers, Web Workers, fetch, Promise, ECharts availability, Blob/download support, File API, and optional StorageManager APIs.
8. Provide exact file contents and deterministic manual tests.
```

## Canonical audit prompt

```text
Audit Phase 1B persistence foundation against requirements.md Version 2.2.

Check:
- Local Storage contains only lightweight configuration.
- IndexedDB schema includes required historical dataset and import stores.
- Schema upgrades have migration hooks and do not delete user data silently.
- Transaction failures are surfaced and rollback behavior is documented.
- Writes are debounced or batched where appropriate.
- Quota and unavailable-storage errors are normalized.
- Capability diagnostics do not expose secrets.
- No real API key appears in code or fixtures.
- Firefox/macOS Big Sur and Safari/iOS compatibility risks are identified.

Return pass/fail, data-integrity risks, migration risks, and exact fixes. Do not add application features.
```

## Manual test checklist

- [ ] Open `tests/storage-tests.html` in Firefox through localhost.
- [ ] Create, read, update, and delete a Local Storage setting.
- [ ] Create and read an IndexedDB test record.
- [ ] Run an IndexedDB version upgrade test.
- [ ] Simulate or stub a rejected transaction and verify an explicit error.
- [ ] Confirm stored values survive a page reload.
- [ ] Confirm capability results render without exposing any key.

## Exit criteria

- Versioned storage opens successfully.
- Migration stubs exist.
- Failure states are explicit.
- No secret or large dataset is stored in Local Storage.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Completed. Later schema changes must preserve the accepted migration path.


# Phase 1C - Setup Wizard Shell
**Status:** Complete

## Purpose

Create first-launch setup, editable seed holdings and benchmarks, local-data warnings, runtime API-key entry, theme and projection settings, and historical/backup initialization choices without requiring successful history installation.

## Dependencies

- Accepted Phase 1B persistence
- No market calls required

## Required deliverables

- Setup wizard UI and state integration
- Editable default holdings and benchmarks
- Runtime API-key handling shell
- Data-loss and backup warnings
- Manual tests

## Canonical implementation prompt

```text
Build or repair Phase 1C setup wizard shell.

Authoritative spec: requirements.md, Version 2.2.
Do not make Finnhub calls or parse Stooq files in this phase.

Requirements:
1. First launch shows the setup wizard.
2. Finnhub key entry exists and accepts a runtime value only.
3. Warn that the key is stored locally and must not be exported by default.
4. Warn that Local Storage and IndexedDB can be lost or evicted, especially on iOS.
5. Prepopulate editable default lots:
   - DCO, 39 shares, acquisition date 2026-05-15, purchase price 145.17948
   - VTV, 547 shares, acquisition date 2026-05-15, purchase price 207.0364
   - ONEQ, 918 shares, acquisition date 2026-05-15, purchase price 104.06513
6. Prepopulate editable default benchmarks: SPY, IWM, AVUV, AVDV, PSCH.
7. Include theme selection.
8. Include global projection horizon selection from 1 through 10 years.
9. Include private historical seed-dataset status placeholder and progress region.
10. Include full portable backup restore as an alternate iPhone initialization path.
11. Setup completion must not require historical installation or live quote success.
12. Save setup state locally.
13. Provide exact files and manual tests.
```

## Canonical audit prompt

```text
Audit Phase 1C against requirements.md Version 2.2.

Check:
- First-launch detection works.
- Defaults are editable ordinary data, not immutable business logic.
- API key is runtime-only and masked after entry.
- Key, storage-loss, iOS eviction, and backup warnings are visible.
- All default lots and benchmarks are correct.
- Projection horizon accepts only integers 1 through 10.
- Historical installation and backup restore choices are represented.
- Setup can finish in quote-only mode.
- State persists without storing secrets in diagnostics or fixtures.

Return pass/fail, usability defects, security risks, and exact fixes.
```

## Manual test checklist

- [ ] Clear local setup state and reload; verify the wizard appears.
- [ ] Edit each default lot and cancel, then reopen to verify predictable state.
- [ ] Complete setup without historical data or a successful quote.
- [ ] Reload and verify setup does not repeat unless reset.
- [ ] Confirm the API key is masked and absent from console output.
- [ ] Set projection horizon to 1 and 10; reject 0, 11, and decimals.
- [ ] Inspect the iOS storage-loss warning copy.

## Exit criteria

- First launch works.
- Defaults and settings persist.
- Setup does not block on history or live data.
- No key exposure occurs.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Completed. Audit copy against the final Version 2.2 labels whenever setup text changes.


# Phase 1D - Private Home-Wi-Fi HTTPS and iPhone Access
**Status:** Deferred - mandatory before final acceptance

## Purpose

Establish a stable trusted local HTTPS origin for Safari and Home Screen operation on the iPhone 13 mini while keeping the app private to the home Wi-Fi.

## Dependencies

- Access to the target home Wi-Fi
- Mac and iPhone on the same trusted network
- Working static project shell
- No router changes that expose the server publicly

## Required deliverables

- `docs/private-https-iphone-setup.md`
- Stable local hostname or reserved IP decision
- Trusted local certificate procedure
- Static HTTPS server procedure
- Mac firewall procedure
- Home Screen and offline test record

## Canonical implementation prompt

```text
Build the Phase 1D private local HTTPS setup and test plan.

Authoritative spec: requirements.md, Version 2.2.
Do not add a backend, public hosting, remote access, VPN requirement, dynamic DNS, or router port forwarding.

Target environment:
- MacBook on macOS Big Sur 11.7.11
- Safari on iPhone 13 mini, iOS 26.5
- Same trusted home Wi-Fi only

Create docs/private-https-iphone-setup.md covering:
1. Choosing a stable reserved LAN IP or stable .local hostname.
2. Choosing one stable HTTPS port.
3. Creating or installing a local certificate authority and a certificate matching the chosen origin.
4. Installing the root certificate on the iPhone and enabling trust.
5. Starting a static HTTPS file server only.
6. Binding only as broadly as required for the home LAN.
7. Allowing the server through the Mac firewall.
8. Confirming no router port forwarding.
9. Opening the app in Safari without a certificate warning.
10. Adding the app to the Home Screen.
11. Confirming manifest, icons, standalone display, service worker, and IndexedDB.
12. Stopping the Mac server and testing offline relaunch from the Home Screen.
13. Explaining that changing protocol, host, IP, or port creates a different browser origin.
14. A rollback and troubleshooting section.
15. No API key or private historical row in the documentation.
```

## Canonical audit prompt

```text
Audit Phase 1D against requirements.md Version 2.2.

Check:
- Access is limited to the trusted home Wi-Fi design.
- The server is static only.
- HTTPS origin is stable and certificate names match it.
- iPhone trust steps are explicit.
- Mac firewall steps do not require public exposure.
- Router port forwarding, public hosting, remote access, and VPN are absent.
- Safari and Home Screen tests are included.
- Offline relaunch after stopping the Mac server is included.
- Origin-specific storage warning is included.
- No key or private market-data content appears.

Return blocking setup risks, exact fixes, and a final acceptance checklist. Do not add a backend.
```

## Manual test checklist

- [ ] Confirm Mac and iPhone are on the same home Wi-Fi.
- [ ] Open the final HTTPS URL in Safari without a warning.
- [ ] Verify the URL uses the final stable protocol, host, and port.
- [ ] Install to Home Screen and launch in standalone mode.
- [ ] Confirm the service worker controls the page.
- [ ] Confirm Local Storage and IndexedDB open.
- [ ] Stop the Mac server and relaunch the installed app.
- [ ] Confirm cached shell and local historical data remain available.
- [ ] Confirm live Finnhub data reports internet/provider state separately.
- [ ] Verify the router has no port-forward rule for the chosen port.

## Exit criteria

- Trusted HTTPS access works.
- Home Screen installation works.
- Offline relaunch works after a successful visit.
- No public exposure is required.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Deferred because the owner is not currently on the target home Wi-Fi. Execute later without blocking Phase 3 through desktop work.


# Phase 2A - Finnhub Request Queue
**Status:** Complete

## Purpose

Enforce free-tier request limits, priorities, bounded concurrency, retry and backoff, normalized errors, and diagnostics budget reporting for Finnhub live requests.

## Dependencies

- Accepted persistence foundation
- No Historical Data Service dependency

## Required deliverables

- `js/data/request-queue.js`
- `js/data/api-errors.js`
- Updated `tests/data-service-tests.html`
- Diagnostics hooks

## Canonical implementation prompt

```text
Build or repair Phase 2A Request Queue.

Authoritative spec: requirements.md, Version 2.2.
Focus only on Finnhub request scheduling and diagnostics hooks.

Create or update:
- js/data/request-queue.js
- js/data/api-errors.js
- tests/data-service-tests.html

Requirements:
1. Enforce no more than 60 calls per rolling minute.
2. Enforce no more than 30 calls per second.
3. Prevent uncontrolled parallel fan-out with a documented concurrency limit.
4. Support priorities:
   - portfolio holding quote snapshots before benchmark quotes
   - quote snapshots before metadata
   - user-initiated refresh before background metadata
5. Historical file parsing and IndexedDB history reads must not enter the Finnhub queue or consume request budget.
6. Support queueing, throttling, cancellation where practical, retry, and exponential backoff with jitter.
7. Treat HTTP 429 visibly through normalized errors and Retry-After when provided.
8. Expose approximate request budget, queue depth, active count, retry count, and last rate-limit event to Diagnostics.
9. Never log URLs containing a token or any API key value.
10. Provide stubbed deterministic tests before live tests.
```

## Canonical audit prompt

```text
Audit Phase 2A Request Queue against requirements.md Version 2.2.

Check:
- Rolling 60/minute and 30/second limits are enforced.
- Concurrency is bounded.
- Priority order is correct.
- Local historical work bypasses the API queue.
- 429, Retry-After, backoff, jitter, and retry limits are handled.
- No uncontrolled recursive retry exists.
- Queue cancellation and stale request behavior are safe.
- Diagnostics expose budget without exposing keys.
- Stubbed tests are deterministic.

Return pass/fail, burst risks, starvation risks, secret-exposure risks, and exact fixes.
```

## Manual test checklist

- [ ] Run stubbed requests exceeding 30 in one second and verify throttling.
- [ ] Run more than 60 requests in a rolling minute using an accelerated test clock.
- [ ] Queue holdings, benchmarks, quotes, and metadata; verify priority order.
- [ ] Simulate HTTP 429 with Retry-After.
- [ ] Simulate transient 500 errors and verify bounded backoff.
- [ ] Inspect logs and diagnostics for token leakage.
- [ ] Confirm a local historical read does not change the Finnhub budget.

## Exit criteria

- Limits and priorities pass deterministic tests.
- No secret is logged.
- 429 and retry behavior are visible and bounded.
- Historical work is outside the queue.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Completed. Preserve this queue for all later Finnhub calls.


# Phase 2B - Stooq Parser, Validator, and Normalizer
**Status:** Complete

## Purpose

Parse the approved Stooq daily text format, validate complete files, normalize records without UTC date shifting, and attach source and adjustment metadata.

## Dependencies

- Accepted IndexedDB foundation
- Private Stooq format decision
- Synthetic fixtures for deterministic tests

## Required deliverables

- `js/data/historical-file-parser.js`
- `js/data/historical-validator.js`
- `js/data/historical-normalizer.js`
- `js/data/historical-import-errors.js`
- `tests/historical-data-tests.html`
- Synthetic fixtures only in tests

## Canonical implementation prompt

```text
Build or repair Phase 2B.

Authoritative spec: requirements.md, Version 2.2.

Create or update:
- js/data/historical-file-parser.js
- js/data/historical-validator.js
- js/data/historical-normalizer.js
- js/data/historical-import-errors.js
- tests/historical-data-tests.html
- synthetic test fixtures only

Source format:
<TICKER>,<PER>,<DATE>,<TIME>,<OPEN>,<HIGH>,<LOW>,<CLOSE>,<VOL>,<OPENINT>

Requirements:
1. Require the exact required header or a precisely documented accepted equivalent.
2. PER must equal D for every record.
3. Normalize SYMBOL.US to canonical SYMBOL.
4. Parse YYYYMMDD as a local date-only value without UTC date shifting.
5. Validate strictly ascending unique dates.
6. Validate one ticker per file.
7. Validate finite positive OPEN, HIGH, LOW, and CLOSE.
8. Validate finite nonnegative VOL and preserve fractional source volume.
9. Validate HIGH is not below OPEN, LOW, or CLOSE.
10. Validate LOW is not above OPEN, HIGH, or CLOSE.
11. Preserve source precision and round only for display.
12. Mark source=stooq, priceAdjustment=split-adjusted, dividendAdjustment=none, frequency=1D.
13. Ignore OPENINT and the daily TIME placeholder after validation.
14. Return normalized records, warnings, provenance, counts, first and last dates, and source ticker.
15. Reject malformed complete files before storage.
16. Provide exact files and deterministic manual tests.
```

## Canonical audit prompt

```text
Audit Phase 2B against requirements.md Version 2.2.

Check:
- Header, frequency, ticker, date, numeric, duplicate, order, and OHLC rules are enforced.
- Date parsing has no UTC off-by-one path.
- Source precision is preserved.
- Fractional volume is accepted and clearly source-provided.
- Adjustment metadata is exactly split-adjusted and dividend-unadjusted.
- OPENINT and TIME are not treated as analytical fields.
- Errors are normalized with file, row, field, code, and safe message.
- No partial normalized output is returned as valid after a fatal error.
- Synthetic fixtures cover valid and invalid cases.

Return pass/fail, data-integrity risks, and exact fixes.
```

## Manual test checklist

- [ ] Load each of the eight private files through the local test page.
- [ ] Confirm the expected symbol, count, first date, and last date.
- [ ] Test an invalid header fixture.
- [ ] Test a non-D frequency fixture.
- [ ] Test duplicate and unsorted dates.
- [ ] Test an impossible OHLC row.
- [ ] Test NaN, Infinity, zero price, negative price, and negative volume.
- [ ] Verify `20190927` remains September 27 in the local display.
- [ ] Confirm `.US` is removed only from the canonical symbol.

## Exit criteria

- All eight private files pass.
- Malformed synthetic fixtures fail predictably.
- Normalized records contain required provenance.
- No UTC date shift occurs.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Completed. Real Stooq files remain private acceptance inputs; synthetic fixtures remain the committed test inputs.


# Phase 2C - Private Seed Installation
**Status:** Complete

## Purpose

Install the validated eight-symbol Stooq dataset into IndexedDB with manifests, hashes, per-symbol transactions, progress, and skip-unchanged behavior.

## Dependencies

- Accepted Phase 2B parser and validator
- IndexedDB schema and migration support
- Eight private seed files

## Required deliverables

- `data/historical/manifest.json`
- `js/data/historical-dataset-manager.js`
- Updated `js/persistence/schema.js`
- Updated `js/persistence/indexed-db.js`
- Updated `tests/historical-data-tests.html`

## Canonical implementation prompt

```text
Build or repair Phase 2C.

Authoritative spec: requirements.md, Version 2.2.

Create or update:
- data/historical/manifest.json
- js/data/historical-dataset-manager.js
- js/persistence/schema.js
- js/persistence/indexed-db.js
- tests/historical-data-tests.html

Requirements:
1. Install the eight private Stooq files into IndexedDB.
2. Use a compound [symbol,date] key for candles.
3. Store dataset version, file hash, source, source ticker, price adjustment, dividend adjustment, record count, first date, last date, import timestamp, and install mode.
4. Validate and hash before replacing stored data.
5. Skip unchanged files.
6. Use an atomic transaction per symbol.
7. Do not leave a partial or empty replacement after a failure.
8. Show aggregate and per-symbol progress.
9. Do not parse every file on every launch.
10. Support application relaunch using IndexedDB only after successful installation.
11. Invalidate affected analytics and simulations when a changed seed version is installed.
12. Provide exact files and manual tests.
```

## Canonical audit prompt

```text
Audit Phase 2C against requirements.md Version 2.2.

Check:
- Manifest entries match all eight private files.
- [symbol,date] uniqueness is enforced.
- Hash and dataset version checks skip unchanged files.
- Validation occurs before destructive replacement.
- Per-symbol transactions rollback fully.
- A failed install does not remove the previous valid series.
- Progress is visible and bounded.
- Relaunch reads IndexedDB without reparsing unchanged files.
- Dataset metadata and adjustment methodology are preserved.
- Derived data is invalidated after changed history.

Return pass/fail, migration and rollback risks, and exact fixes.
```

## Manual test checklist

- [ ] Start with an empty IndexedDB and install all eight symbols.
- [ ] Verify 34,122 total records and expected per-symbol counts.
- [ ] Reload and verify unchanged files are skipped.
- [ ] Change one test hash and verify only the affected symbol is reinstalled.
- [ ] Inject a transaction failure and verify the previous complete series remains.
- [ ] Query the first and last candle for every symbol.
- [ ] Verify progress reaches completion and errors identify the symbol safely.

## Exit criteria

- All eight datasets install.
- No unchanged file is needlessly reparsed.
- Rollback preserves prior valid data.
- Metadata and counts match the manifest.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Completed. This phase establishes the private seed on each browser origin.


# Phase 2D - Manual Historical-Data Imports
**Status:** Complete

## Purpose

Support occasional desktop and iOS Files imports in the same Stooq format, preview differences, default to complete-series replacement, and commit transactionally.

## Dependencies

- Accepted parser/validator/normalizer
- Accepted dataset manager and IndexedDB transactions

## Required deliverables

- `js/data/historical-import-service.js`
- `js/ui/historical-import-dialog.js`
- `js/ui/historical-import-preview.js`
- Updated historical tests
- Import history and diagnostics records

## Canonical implementation prompt

```text
Build or repair Phase 2D.

Authoritative spec: requirements.md, Version 2.2.

Create or update:
- js/data/historical-import-service.js
- js/ui/historical-import-dialog.js
- js/ui/historical-import-preview.js
- tests/historical-data-tests.html

Requirements:
1. Support multi-file selection on desktop and the iOS Files picker.
2. Parse and validate every complete file before any stored series is changed.
3. Show symbol, source, adjustment metadata, first date, last date, count, and hash.
4. Compare against stored history and show added, changed, removed, and unchanged records.
5. Default to complete-series replacement.
6. Permit append only when every overlapping record matches exactly and no earlier record is removed.
7. Require explicit confirmation before replacement.
8. Commit transactionally per symbol.
9. Roll back on failure and preserve the prior valid series.
10. Invalidate affected analytics and simulations after commit.
11. Record import mode, source file name, hash, timestamp, counts, result, and safe error in import history and Diagnostics.
12. Never upload file contents or derived data.
13. Provide exact files and manual tests.
```

## Canonical audit prompt

```text
Audit Phase 2D against requirements.md Version 2.2.

Check:
- Multi-file desktop and iOS-compatible selection is used.
- All files are validated before storage changes.
- Difference preview counts are accurate.
- Complete replacement is the default.
- Append is refused when overlap differs.
- Confirmation is required.
- Transactions rollback fully.
- Prior valid history remains after failure.
- Derived analytics and simulations are invalidated after success.
- Import history excludes file content and secrets.
- No network upload exists.

Return pass/fail, data-loss risks, UI ambiguity, and exact fixes.
```

## Manual test checklist

- [ ] Import one unchanged complete file and verify all rows report unchanged.
- [ ] Import a file with one added date and preview the addition.
- [ ] Import a file with one changed overlapping close and verify append is refused.
- [ ] Import a file missing an earlier date and verify replacement preview shows removal.
- [ ] Cancel at confirmation and verify no stored change.
- [ ] Inject a commit failure and verify rollback.
- [ ] Select multiple files and verify per-symbol results.
- [ ] Test the Files picker on iPhone when Phase 1D is available.

## Exit criteria

- Preview is accurate.
- Replacement is safe and transactional.
- Append is tightly constrained.
- No import uploads data.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Completed. Occasional manual complete-series replacement is the approved update process.


# Phase 2E - Historical Data Service and Diagnostics
**Status:** Complete

## Purpose

Expose stable IndexedDB-backed history interfaces, exact-date alignment, lookback extraction, availability states, provenance, and quality diagnostics for all later modules.

## Dependencies

- Accepted seed installation
- Accepted manual import service
- Normalized historical records in IndexedDB

## Required deliverables

- `js/data/historical-data-service.js`
- `js/data/historical-quality.js`
- `js/diagnostics/historical-data-diagnostics.js`
- Updated tests

## Canonical implementation prompt

```text
Build or repair Phase 2E.

Authoritative spec: requirements.md, Version 2.2.

Create or update:
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
1. Read normalized historical data from IndexedDB only.
2. Never make a network request or read a raw Stooq file from analytical callers.
3. Align multiple symbols by exact trading date intersection.
4. Preserve caller-requested symbol order.
5. Return 757 aligned closes for a 756-return Monte Carlo window.
6. Support date-range and maximum-observation options.
7. Surface missing, installing, invalid, stale, insufficient, and quality-warning states.
8. Return source, adjustment metadata, first date, last date, count, hash, dataset version, and import timestamp.
9. Distinguish fatal quality errors from nonfatal flags.
10. Avoid loading unnecessary full histories into the DOM.
11. Provide deterministic tests for alignment and insufficient-history behavior.
```

## Canonical audit prompt

```text
Audit Phase 2E against requirements.md Version 2.2.

Check:
- All public interfaces are documented and stable.
- Reads use IndexedDB only.
- Exact-date intersection is correct and deterministic.
- Symbol order is preserved.
- 757 closes produce exactly 756 returns.
- Missing or insufficient history never yields fabricated observations.
- Availability states and provenance are complete.
- Quality flags are visible without silently mutating source values.
- Queries are bounded and suitable for the target Mac and iPhone.

Return pass/fail, alignment risks, performance risks, and exact fixes.
```

## Manual test checklist

- [ ] Query full and bounded ranges for each symbol.
- [ ] Verify first and last dates.
- [ ] Align all eight seed symbols and verify 1,703 common closes.
- [ ] Request the latest 757 common closes and verify 756 return intervals.
- [ ] Remove one symbol in a test database and verify a missing state.
- [ ] Use a short fixture and verify insufficient-history state.
- [ ] Verify Diagnostics reports source, adjustment, count, dates, hash, and flags.

## Exit criteria

- Stable interfaces work.
- Alignment is exact.
- Lookback extraction is correct.
- Availability and diagnostics are explicit.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Completed. All later historical consumers must use this service.


# Phase 2F - Finnhub Live-Data Services
**Status:** Complete

## Purpose

Implement current quotes, lookup, company context, market context, Treasury rate, TTL caching, fallback, and normalized errors through the existing request queue, without historical candles.

## Dependencies

- Accepted Request Queue
- Accepted persistence
- Runtime API-key settings
- Historical Data Service for history

## Required deliverables

- `js/data/finnhub-client.js`
- `js/data/market-data-service.js`
- `js/data/cache-policy.js`
- `js/data/risk-free-rate-service.js`
- `js/data/symbol-service.js`
- Updated data-service tests and diagnostics

## Canonical implementation prompt

```text
Build or repair Phase 2F.

Authoritative spec: requirements.md, Version 2.2.
Use the existing Request Queue.
Do not hardcode or log an API key.
Do not call /stock/candle.

Permitted Finnhub endpoints:
- /quote
- /search
- /stock/symbol
- /stock/profile2
- /stock/peers
- /stock/market-status
- /stock/market-holiday
- /stock/metric

Create or update:
- js/data/finnhub-client.js
- js/data/market-data-service.js
- js/data/cache-policy.js
- js/data/risk-free-rate-service.js
- js/data/symbol-service.js
- tests/data-service-tests.html

Requirements:
1. Retrieve the Finnhub key from runtime settings only.
2. Fetch quote snapshots for active symbols on app load and manual refresh only.
3. Use the Request Queue for all Finnhub calls.
4. Implement symbol search and validation.
5. Cache company profiles for 7 calendar days by default.
6. Fetch peers on demand only and cache for 7 calendar days.
7. Cache basic metrics for 7 calendar days.
8. Implement market status and holiday context.
9. Retrieve an approved Treasury risk-free rate, cache the last success, and show source, timestamp, and stale warning.
10. Use cached fallback when live calls fail.
11. Normalize offline, invalid key, rate limit, temporary unavailable, missing data, entitlement unavailable, and malformed response errors.
12. Keep current quote snapshots separate from completed historical candles.
13. Do not manufacture daily OHLCV from a quote.
14. Do not add premium data, news, dividends, streaming, or a backend.
15. Provide exact files and stubbed plus manual live tests.
```

## Canonical audit prompt

```text
Audit Phase 2F against requirements.md Version 2.2.

Check:
- Only permitted endpoints are called.
- /stock/candle is absent.
- Every Finnhub call uses the Request Queue.
- Quotes are limited to active symbols and snapshot semantics.
- Metadata TTLs are explicit.
- Peers are on demand.
- Treasury rate has source, timestamp, cache fallback, and stale warning.
- Quote data is never inserted as a historical candle.
- Error normalization distinguishes all required states.
- Cache fallback labels stale data visibly.
- API key is absent from source, logs, diagnostics, exports, and test fixtures.

Return pass/fail, endpoint drift, cache risks, secret risks, and exact fixes.
```

## Manual test checklist

- [ ] Use stubbed quote success, malformed response, 401/403, 429, 500, and offline cases.
- [ ] Run a manual quote refresh for all eight symbols.
- [ ] Verify only active symbols are requested.
- [ ] Verify a second profile request inside the TTL uses cache.
- [ ] Verify peers are not fetched until requested.
- [ ] Verify Treasury live success and cached stale fallback.
- [ ] Inspect console, diagnostics, and copied results for key leakage.
- [ ] Confirm no `/stock/candle` request appears in the network panel.

## Exit criteria

- Live services and fallback work.
- No historical candle dependency exists.
- TTL and error states are explicit.
- No secret exposure occurs.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Completed. Phase 3 and later modules must combine Finnhub current quotes with Historical Data Service history without conflating them.


# Phase 3A - Portfolio Data Model and Engine
**Status:** Next active phase - not yet accepted

## Purpose

Implement parameter-driven holdings and acquisition lots, deterministic validation, cost basis, current values, market-value weights, and modeled historical account-value series using the Historical Data Service.

## Dependencies

- Completed Phase 2E Historical Data Service
- Completed Phase 2F live quote service
- Accepted persistence and settings

## Required deliverables

- `js/portfolio/portfolio-model.js`
- `js/portfolio/lot-model.js`
- `js/portfolio/portfolio-validation.js`
- `js/portfolio/portfolio-engine.js`
- `js/utils/number-utils.js`
- `js/utils/date-utils.js`
- Updated `tests/calculation-tests.html`

## Canonical implementation prompt

```text
Build Phase 3A Portfolio Data Model and Engine.

Authoritative spec: requirements.md, Version 2.2.
Do not build benchmark analytics, chart rendering, or Monte Carlo.
Consume historical data only through the Historical Data Service.

Create or update:
- js/portfolio/portfolio-model.js
- js/portfolio/lot-model.js
- js/portfolio/portfolio-validation.js
- js/portfolio/portfolio-engine.js
- js/utils/number-utils.js
- js/utils/date-utils.js
- tests/calculation-tests.html

Requirements:
1. Support holdings with multiple acquisition lots.
2. Each lot stores ticker, shares, purchase price per share, acquisition date, and audit note.
3. Adding to an existing holding creates a new lot unless the user explicitly edits an existing lot.
4. Support fractional shares.
5. Use JavaScript Number precision internally and round only for display.
6. Validate ticker syntax, required fields, invalid dates, future dates, zero or negative shares, zero or negative price, NaN, Infinity, and malformed persisted data.
7. Multiple lots for one ticker are valid and consolidate under one holding.
8. A ticker may exist as both a holding and a benchmark only when records remain distinct.
9. Calculate lot cost, holding cost, total cost basis, position value, portfolio value, unrealized dollar gain/loss, and market-value weights.
10. Use current Finnhub quote snapshots for current position value and label stale quote fallback.
11. Build a fixed-share buy-and-hold modeled historical account-value series through Historical Data Service close prices.
12. Respect each lot's acquisition date; a lot contributes only on or after its acquisition date.
13. Do not treat new contributions as investment returns.
14. Label historical account value as modeled split-adjusted price history.
15. Do not automatically alter shares or prices for corporate actions.
16. Expose documented public calculation functions independent from the UI.
17. Provide deterministic tests for single and multiple lots, partial histories, missing quotes, stale quotes, and date boundaries.
18. Provide exact file contents and manual tests.
```

## Canonical audit prompt

```text
Audit Phase 3A against requirements.md Version 2.2.
Do not write UI or later-phase code.

Check:
- Holding and lot models are parameter-driven.
- Multiple lots consolidate correctly without losing lot identity.
- Cost basis and current position values are mathematically correct.
- Fractional shares and full Number precision are preserved.
- Invalid inputs, future dates, NaN, and Infinity are rejected.
- Historical data is accessed only through Historical Data Service.
- Each lot starts on its acquisition date.
- Contributions are not misclassified as performance.
- Current quote and historical close semantics remain separate.
- Historical account value is labeled modeled split-adjusted price history.
- Corporate actions are never auto-applied.
- Public functions are deterministic and rendering-independent.
- Tests cover missing, stale, and insufficient data.

Return:
1. Requirements satisfied.
2. Partial requirements.
3. Missed requirements.
4. Calculation defects.
5. Data-integrity risks.
6. Exact fixes before Phase 3B.
Do not implement fixes until the audit is complete.
```

## Manual test checklist

- [ ] Load the three default holdings and verify total cost basis.
- [ ] Add a second lot to one ticker and verify consolidation plus lot detail.
- [ ] Test fractional shares.
- [ ] Reject zero, negative, NaN, and infinite values.
- [ ] Reject a future acquisition date.
- [ ] Provide current quotes and verify position and portfolio values.
- [ ] Remove one quote and verify explicit unavailable or stale fallback behavior.
- [ ] Build historical account value and verify a lot is absent before its acquisition date.
- [ ] Verify historical labels identify modeled split-adjusted, dividend-unadjusted price history.
- [ ] Verify calculations do not access raw Stooq files.

## Exit criteria

- Deterministic cost and value tests pass.
- Lot date boundaries are correct.
- Missing data is explicit.
- No corporate action is auto-applied.
- Audit reports no blocking defect.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

This is the next active build. Stop after Phase 3A passes audit and create a backup before Phase 3B.


# Phase 3B - Portfolio UI and Corporate-Action Workflow
**Status:** Not yet accepted

## Purpose

Create accessible add, edit, and delete workflows for holdings and lots, plus explicit manual corporate-action notices and audited adjustments.

## Dependencies

- Accepted Phase 3A public portfolio interfaces
- Accepted persistence and setup state

## Required deliverables

- Portfolio and lot editor UI modules
- Settings and Help corporate-action notices
- Lot audit-note workflow
- Updated UI tests

## Canonical implementation prompt

```text
Build Phase 3B Portfolio UI and Corporate-Action Workflow.

Authoritative spec: requirements.md, Version 2.2.
Use the accepted Phase 3A Portfolio Engine. Do not duplicate financial calculations in UI code.

Create or update the portfolio and lot UI modules and tests.

Requirements:
1. Add, edit, and delete holdings.
2. Add, edit, and delete acquisition lots.
3. Keep setup defaults as ordinary editable user data.
4. Validate through the Portfolio Engine before persistence.
5. Confirm destructive deletes.
6. Preserve focus and announce validation errors accessibly.
7. Show the corporate-action responsibility notice in Settings and Help.
8. Provide an explicit manual workflow to adjust shares, purchase price, acquisition data where appropriate, and audit note after a split or similar event.
9. Display before-and-after values before saving a manual adjustment.
10. Do not automatically detect or apply a split, reverse split, ticker change, spin-off, merger, or other corporate action.
11. Any future split-like warning must be non-authoritative and must not alter data.
12. Persist changes with debounced or explicit-save behavior rather than every keystroke.
13. Update dependent values and mark analytics or simulations stale after relevant edits.
14. Support iPhone 13 mini form layout, touch targets, and keyboard behavior.
15. Provide exact file contents and manual tests.
```

## Canonical audit prompt

```text
Audit Phase 3B against requirements.md Version 2.2.

Check:
- UI uses Phase 3A calculations rather than duplicating them.
- Add/edit/delete workflows work for holdings and lots.
- Destructive actions require confirmation.
- Validation errors are accessible and preserve user input.
- Corporate-action notices and manual adjustment workflow are present.
- No automatic corporate action is applied.
- Audit notes persist.
- Changes invalidate dependent analytics and simulations.
- Writes are not performed on every keystroke.
- Desktop and iPhone layouts remain usable.

Return blocking, important, and minor defects with exact files to change.
```

## Manual test checklist

- [ ] Add a new holding with one lot.
- [ ] Add a second lot to an existing holding.
- [ ] Edit shares, price, date, and audit note.
- [ ] Cancel an edit and verify no mutation.
- [ ] Delete a lot and a holding with confirmation.
- [ ] Trigger each validation error and verify focus/announcement.
- [ ] Complete a manual split adjustment and inspect before/after values.
- [ ] Verify analytics and simulation states become stale after material edits.
- [ ] Test the form at iPhone 13 mini portrait width.

## Exit criteria

- All CRUD workflows work.
- Corporate actions remain manual.
- Accessibility and persistence behavior pass.
- No calculation logic is duplicated in the UI.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Do not proceed to Phase 4A until the holding and lot workflows are accepted.


# Phase 4A - Benchmark and Active-Symbol Management
**Status:** Not yet accepted

## Purpose

Manage holdings and benchmarks through a shared symbol registry while preserving record separation, activation state, chart and projection inclusion, and the 25-symbol cap.

## Dependencies

- Accepted Phase 3A and 3B
- Completed symbol lookup service
- Accepted persistence

## Required deliverables

- `js/benchmarks/benchmark-model.js`
- `js/benchmarks/benchmark-engine.js`
- `js/core/symbol-registry.js`
- Benchmark-management UI
- Updated calculation and UI tests

## Canonical implementation prompt

```text
Build Phase 4A Benchmark Engine and shared active-symbol management.

Authoritative spec: requirements.md, Version 2.2.
Use the existing Finnhub Symbol Service for validation and Historical Data Service for history status.

Create or update:
- js/benchmarks/benchmark-model.js
- js/benchmarks/benchmark-engine.js
- js/core/symbol-registry.js
- benchmark-management UI modules
- tests/calculation-tests.html and/or tests/ui-tests.html

Requirements:
1. Seed default benchmarks: SPY, IWM, AVUV, AVDV, PSCH.
2. Built-in benchmarks are ordinary editable records, not locked constants.
3. Allow add, delete, re-add, activate, and deactivate benchmarks.
4. Allow benchmark display-label edits.
5. Allow include/exclude from charts.
6. Allow include/exclude from benchmark projection tables.
7. Benchmarks require no shares, purchase price, cost basis, or lots.
8. Enforce a maximum of 25 active symbols across holdings and benchmarks.
9. Permit additional stored inactive symbols.
10. Prevent activation of a 26th symbol with a clear warning.
11. Preserve separate holding and benchmark records for the same ticker.
12. Deleting a benchmark must never delete or modify a same-ticker holding.
13. Add symbol search/filter for active and inactive records.
14. Validate new symbols through the Symbol Service.
15. Report local-history availability through Historical Data Service without blocking quote-only activation.
16. Invalidate dependent charts, analytics, and simulations after relevant registry changes.
17. Provide deterministic and manual tests.
```

## Canonical audit prompt

```text
Audit Phase 4A against requirements.md Version 2.2.

Check:
- Default benchmarks are seeded but not locked.
- Delete and re-add work.
- Holding and benchmark same-ticker records remain distinct.
- Deleting a benchmark cannot delete a holding.
- 25 active-symbol cap is enforced across both categories.
- Inactive symbols can remain stored and searchable.
- Symbol validation uses the Symbol Service.
- History absence produces quote-only state rather than fabricated data.
- Include/exclude controls persist.
- Changes invalidate dependent outputs.

Return pass/fail, data-separation risks, cap-enforcement risks, and exact fixes.
```

## Manual test checklist

- [ ] Delete each built-in benchmark and re-add it.
- [ ] Create a SPY holding and a SPY benchmark; delete only the benchmark.
- [ ] Activate 25 symbols and attempt a 26th.
- [ ] Deactivate one symbol and activate another.
- [ ] Search active and inactive records.
- [ ] Add a valid and invalid ticker through symbol lookup.
- [ ] Activate a symbol without local history and verify quote-only state.
- [ ] Verify chart and projection inclusion toggles persist.

## Exit criteria

- Benchmark CRUD works.
- Holding/benchmark separation is safe.
- Active cap is enforced.
- History absence is explicit.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Phase 5A may begin only after stable symbol-registry events and getters are documented.


# Phase 5A - Chart Manager
**Status:** Not yet accepted

## Purpose

Implement Apache ECharts lifecycle and the required portfolio, benchmark, allocation, drawdown, and later Monte Carlo visual containers with responsive iPhone-safe behavior and PNG export.

## Dependencies

- Accepted Portfolio Engine
- Accepted Benchmark Engine
- Historical Data Service
- Stable UI state events

## Required deliverables

- `js/charts/chart-manager.js`
- `js/charts/chart-options.js`
- `js/charts/chart-export.js`
- `js/charts/chart-state.js`
- Updated `tests/ui-tests.html`
- Development ECharts integration

## Canonical implementation prompt

```text
Build Phase 5A Chart Manager.

Authoritative spec: requirements.md, Version 2.2.
Use Apache ECharts from the approved development source for this phase. It will be vendored in Phase 10A.
Do not implement financial calculations inside chart modules.

Create or update:
- js/charts/chart-manager.js
- js/charts/chart-options.js
- js/charts/chart-export.js
- js/charts/chart-state.js
- tests/ui-tests.html

Required chart support:
1. Normalized portfolio versus benchmark comparison.
2. Modeled portfolio account-value growth.
3. Allocation chart.
4. Drawdown chart.
5. Containers and shared conventions for Monte Carlo confidence fan and percentile bands added later.

Requirements:
1. Consume prepared series from portfolio, benchmark, and later analytics modules.
2. Add time filters: 1M, 3M, 6M, YTD, 1Y, Since Purchase, and Max.
3. Add series toggles, zoom, pan where compatible, and reset zoom.
4. Add PNG export.
5. Dispose and recreate chart instances safely.
6. Resize using a bounded responsive strategy.
7. Support theme changes without leaking chart instances.
8. Show loading, unavailable, quote-only, insufficient-history, stale, and quality-warning states.
9. Label Stooq-derived series as split-adjusted, dividend-unadjusted price-return approximations.
10. Support iPhone 13 mini portrait and landscape.
11. Respect safe-area insets in Home Screen mode.
12. Re-render or resize after orientation change.
13. Avoid hover-only interaction.
14. Prevent chart pan/zoom from conflicting with swipeable tabs.
15. Prevent whole-page horizontal overflow while allowing table or chart-local interaction.
16. Provide exact file contents and manual tests.
```

## Canonical audit prompt

```text
Audit Phase 5A against requirements.md Version 2.2.

Check:
- Chart modules contain no financial calculations.
- Required chart types and time filters are supported.
- Series toggles, zoom, reset, and PNG export work.
- Lifecycle cleanup prevents duplicate instances and listeners.
- Theme and resize behavior are stable.
- Availability and stale states are explicit.
- Methodology labels are visible.
- iPhone 13 mini portrait, landscape, safe area, orientation change, and touch gestures are handled.
- Swipeable tab and chart gestures do not conflict.
- No page-level horizontal overflow occurs.

Return blocking, important, and minor defects with exact fixes.
```

## Manual test checklist

- [ ] Render each supported chart with deterministic fixture data.
- [ ] Toggle every series and time filter.
- [ ] Zoom, pan where allowed, and reset.
- [ ] Export PNG and inspect dimensions and legibility.
- [ ] Switch light/dark themes repeatedly and inspect for duplicate canvases.
- [ ] Resize desktop window repeatedly.
- [ ] Test iPhone 13 mini portrait and landscape dimensions.
- [ ] Trigger orientation-change handling.
- [ ] Test chart gestures inside and outside swipeable panels.
- [ ] Render each unavailable/stale state.

## Exit criteria

- Charts render and clean up safely.
- PNG export works.
- Mobile and orientation behavior pass.
- Methodology and availability states are visible.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Do not build Monte Carlo calculations in this phase; only shared visual infrastructure.


# Phase 6A - Analytics Engine
**Status:** Not yet accepted

## Purpose

Implement aligned split-adjusted, dividend-unadjusted price-return series, CAGR, alpha, beta, and maximum drawdown using normalized local history and an approved risk-free rate.

## Dependencies

- Accepted Historical Data Service
- Accepted portfolio and benchmark interfaces
- Accepted chart data contracts
- Treasury rate service

## Required deliverables

- `js/analytics/return-series.js`
- `js/analytics/date-alignment.js`
- `js/analytics/cagr.js`
- `js/analytics/alpha-beta.js`
- `js/analytics/drawdown.js`
- `js/analytics/analytics-engine.js`
- Updated deterministic calculation tests

## Canonical implementation prompt

```text
Build Phase 6A Analytics Engine.

Authoritative spec: requirements.md, Version 2.2.
Use normalized Stooq close history through Historical Data Service.
Do not implement Monte Carlo.

Create or update:
- js/analytics/return-series.js
- js/analytics/date-alignment.js
- js/analytics/cagr.js
- js/analytics/alpha-beta.js
- js/analytics/drawdown.js
- js/analytics/analytics-engine.js
- tests/calculation-tests.html

Requirements:
1. Treat historical prices as split-adjusted and dividend-unadjusted.
2. Label every output as a price-return approximation.
3. Do not label any result exact total return or dividend-reinvested return.
4. Build daily arithmetic and log return utilities from valid close prices.
5. Align portfolio and benchmark observations by exact trading date.
6. Build normalized performance series from a base value.
7. Calculate CAGR using valid beginning value, ending value, and elapsed time, including partial years.
8. Calculate beta from aligned periodic returns.
9. Calculate alpha using the configured benchmark and approved risk-free rate with consistent periodicity.
10. Calculate headline maximum drawdown from the Price-Return Performance Series, not raw account value.
11. Handle missing, stale, insufficient, misaligned, zero, negative, and nonfinite inputs without fabricating metrics.
12. Preserve floating market-value weights without introducing daily rebalancing.
13. Respect lot acquisition dates and contribution-neutral performance logic.
14. Return methodology, observation counts, aligned date range, benchmark, risk-free-rate source, and warnings with each result.
15. Provide deterministic fixture calculations with independently verifiable expected values.
```

## Canonical audit prompt

```text
Audit Phase 6A against requirements.md Version 2.2.

Check:
- Historical data comes only from Historical Data Service.
- Price-return and total-return labels are correct.
- Date alignment uses exact intersection.
- CAGR handles partial years and invalid denominators.
- Alpha and beta use aligned returns and consistent risk-free periodicity.
- Headline drawdown uses the Price-Return Performance Series.
- Raw contributions do not appear as investment returns or recoveries.
- Floating weights do not imply daily rebalancing.
- Missing or insufficient data produces unavailable states.
- Result metadata includes counts, range, source, and warnings.
- Tests use independently checkable fixtures.

Return calculation defects, methodology risks, labeling defects, and exact fixes.
```

## Manual test checklist

- [ ] Verify arithmetic and log returns against hand calculations.
- [ ] Align two series with deliberately missing dates.
- [ ] Calculate CAGR over an exact year and a partial year.
- [ ] Calculate beta and alpha from a small known dataset.
- [ ] Calculate maximum drawdown from a known normalized path.
- [ ] Add a contribution to raw account value and verify headline drawdown is unaffected by the contribution artifact.
- [ ] Test missing benchmark, stale risk-free rate, insufficient observations, zero, negative, NaN, and Infinity.
- [ ] Inspect visible methodology labels and metadata.

## Exit criteria

- Core analytics match deterministic expectations.
- Alignment and contribution handling are correct.
- No fabricated metric appears.
- Labels and metadata comply with Version 2.2.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Phase 7 must consume the accepted aligned-return utilities rather than recalculate them independently.


# Phase 7A - Monte Carlo Worker Infrastructure
**Status:** Not yet accepted

## Purpose

Create non-blocking worker execution, input validation, run state, progress, cancellation, stale-run protection, reproducible seed handling, and diagnostics before implementing a simulation method.

## Dependencies

- Accepted Analytics Engine
- Stable portfolio and benchmark inclusion state
- Web Worker capability detection

## Required deliverables

- `js/monte-carlo/mc-controller.js`
- `js/monte-carlo/mc-state.js`
- `js/monte-carlo/mc-inputs.js`
- `js/workers/monte-carlo-worker.js`
- `js/workers/worker-protocol.js`
- `tests/monte-carlo-tests.html`

## Canonical implementation prompt

```text
Build Phase 7A Monte Carlo worker infrastructure.

Authoritative spec: requirements.md, Version 2.2.
Do not implement scenario analysis, Regime Switching, Stochastic Volatility, GBM math, or Historical Bootstrap math yet.

Create or update:
- js/monte-carlo/mc-controller.js
- js/monte-carlo/mc-state.js
- js/monte-carlo/mc-inputs.js
- js/workers/monte-carlo-worker.js
- js/workers/worker-protocol.js
- tests/monte-carlo-tests.html

Requirements:
1. Run simulations in a Web Worker.
2. Keep the main UI responsive.
3. Define typed or rigorously validated request, progress, result, cancellation, and error messages.
4. Define states: idle, validating, queued, running, cancelling, cancelled, completed, failed, and stale.
5. Validate included symbols, path count, horizon, lookback, initial values, and seed before starting.
6. Support 1,000, 2,500, and 5,000 paths; default 5,000.
7. Do not silently reduce a selected path count.
8. Support fixed and random seed modes.
9. Show progress and elapsed time; omit ETA if unreliable.
10. Allow cancellation and terminate or reuse workers safely.
11. Detect input changes during a run and mark the result stale.
12. Prevent a late stale result from replacing a newer result.
13. Record safe run metadata, elapsed time, cancellation, failure, and stale status in Diagnostics.
14. Handle lack of Web Worker support with an explicit unavailable state rather than blocking the main thread.
15. Provide deterministic protocol and state-machine tests.
```

## Canonical audit prompt

```text
Audit Phase 7A against requirements.md Version 2.2.

Check:
- No simulation method was implemented prematurely.
- Worker protocol validates every message.
- State transitions are explicit and legal.
- UI cannot display a stale or superseded result as current.
- Cancellation works before and during running.
- Fixed and random seed modes are represented.
- Selected path count is never silently reduced.
- Main-thread fallback does not run expensive simulation.
- Diagnostics omit sensitive portfolio detail where unnecessary.
- Worker and event listeners are cleaned up.

Return state-machine defects, race conditions, memory risks, and exact fixes.
```

## Manual test checklist

- [ ] Run a mock worker job and verify progress.
- [ ] Cancel before start and during running.
- [ ] Change a portfolio input during a run and verify stale state.
- [ ] Start a second run before the first returns and verify the first cannot overwrite it.
- [ ] Test 1,000, 2,500, and 5,000 path input validation.
- [ ] Test fixed and generated seeds.
- [ ] Disable Worker capability and verify unavailable state.
- [ ] Inspect Diagnostics for safe metadata.

## Exit criteria

- Worker protocol is stable.
- Cancellation and stale-run handling pass.
- UI remains responsive.
- No disallowed simulation method exists.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Accept this infrastructure before implementing Phase 7B or 7C.


# Phase 7B - GBM Monte Carlo
**Status:** Not yet accepted

## Purpose

Implement correlated multi-asset daily GBM from aligned local log returns, with covariance stabilization disclosure, seeded randomness, portfolio aggregation, and required output statistics.

## Dependencies

- Accepted Phase 7A infrastructure
- Accepted Analytics Engine aligned-return utilities
- Historical Data Service 757-close extraction

## Required deliverables

- `js/monte-carlo/gbm.js`
- `js/monte-carlo/random.js`
- `js/monte-carlo/covariance.js`
- `js/monte-carlo/statistics.js`
- Worker integration
- Updated Monte Carlo tests

## Canonical implementation prompt

```text
Build Phase 7B Geometric Brownian Motion Monte Carlo.

Authoritative spec: requirements.md, Version 2.2.
Use the accepted Phase 7A worker protocol.
Implement only GBM in this phase.

Create or update:
- js/monte-carlo/gbm.js
- js/monte-carlo/random.js
- js/monte-carlo/covariance.js
- js/monte-carlo/statistics.js
- js/workers/monte-carlo-worker.js
- tests/monte-carlo-tests.html

Requirements:
1. Use up to 756 aligned daily log-return observations derived from 757 normalized Stooq closes.
2. Estimate daily drift as the arithmetic mean of daily log returns.
3. Estimate daily volatility and covariance using sample statistics.
4. Simulate one trading-day step at a time.
5. Use 252 trading days per projection year.
6. Simulate correlated multivariate daily log returns.
7. Use a deterministic seeded PRNG for fixed-seed mode.
8. Use Cholesky decomposition when valid.
9. If covariance is singular or non-positive-definite, apply one documented stabilization method and disclose it in Diagnostics.
10. Do not silently drop a symbol or change the selected path count.
11. Aggregate simulated asset values into portfolio ending values using included holdings and current initial values.
12. Produce P10, P50, P90, ending-value distribution summary, expected annualized return, probability of loss, and Value at Risk.
13. Return confidence-fan and percentile-band data suitable for Phase 8 charts.
14. Handle insufficient history, invalid covariance, overflow, underflow, and nonfinite output visibly.
15. Provide deterministic tests for means, covariance, seeded reproducibility, correlation direction, percentiles, and failure states.
```

## Canonical audit prompt

```text
Audit Phase 7B GBM against requirements.md Version 2.2.

Check:
- Inputs are aligned local daily log returns.
- 757 closes and 756 returns are handled correctly.
- Drift, sample volatility, and sample covariance formulas are documented and correct.
- Simulation uses daily steps and 252 days per year.
- Correlation is preserved through multivariate generation.
- Fixed seed reproduces unchanged inputs.
- Stabilization is explicit, bounded, and disclosed.
- No symbol or path is silently removed.
- Portfolio aggregation and risk statistics are correct.
- Nonfinite and insufficient inputs fail visibly.
- Worker cancellation and stale-run rules remain intact.

Return mathematical defects, numerical risks, reproducibility defects, and exact fixes.
```

## Manual test checklist

- [ ] Verify drift, volatility, and covariance against a known fixture.
- [ ] Run a fixed-seed small simulation twice and compare exact results.
- [ ] Use a positively correlated fixture and inspect simulated correlation.
- [ ] Use a singular covariance fixture and verify disclosed stabilization.
- [ ] Run 1-, 5-, and 10-year horizons with small path counts.
- [ ] Verify P10 <= P50 <= P90.
- [ ] Verify probability of loss and VaR on a known distribution fixture.
- [ ] Cancel a GBM run and verify no stale result displays.

## Exit criteria

- Deterministic formulas pass.
- Correlation and reproducibility pass.
- Outputs and risk statistics are valid.
- Stabilization is disclosed.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Do not add EWMA estimation or stochastic volatility.


# Phase 7C - Historical Bootstrap Monte Carlo
**Status:** Not yet accepted

## Purpose

Implement whole-vector resampling of aligned daily arithmetic returns with replacement, preserving same-day cross-asset dependence and compounding through the global horizon.

## Dependencies

- Accepted Phase 7A infrastructure
- Accepted aligned daily arithmetic-return vectors
- Accepted statistics utilities

## Required deliverables

- `js/monte-carlo/bootstrap.js`
- Worker integration
- Updated `js/monte-carlo/statistics.js`
- Updated Monte Carlo tests

## Canonical implementation prompt

```text
Build Phase 7C Historical Bootstrap Monte Carlo.

Authoritative spec: requirements.md, Version 2.2.
Use the accepted Phase 7A worker protocol.
Implement only Historical Bootstrap in this phase.

Create or update:
- js/monte-carlo/bootstrap.js
- js/monte-carlo/statistics.js
- js/workers/monte-carlo-worker.js
- tests/monte-carlo-tests.html

Requirements:
1. Use up to 756 aligned daily arithmetic return vectors from normalized Stooq closes.
2. Preserve symbol order and exact date alignment.
3. Sample one complete same-day cross-asset return vector with replacement for each simulated trading day.
4. Never resample assets independently.
5. Compound sampled returns through the selected 1-10 year horizon using 252 trading days per year.
6. Do not impose an external drift adjustment.
7. Use the same fixed/random seed framework as GBM.
8. Respect included holdings and initial portfolio values.
9. Produce P10, P50, P90, ending-value distribution summary, expected annualized return, probability of loss, and Value at Risk.
10. Return confidence-fan and percentile-band data.
11. Handle returns less than or equal to -100%, insufficient vectors, empty symbols, nonfinite values, and overflow visibly.
12. Preserve Phase 7A cancellation, progress, and stale-run behavior.
13. Provide deterministic tests proving whole-vector resampling and fixed-seed reproducibility.
14. Do not implement block bootstrap unless explicitly approved later.
```

## Canonical audit prompt

```text
Audit Phase 7C Historical Bootstrap against requirements.md Version 2.2.

Check:
- Inputs are aligned daily arithmetic return vectors.
- Whole vectors, not independent asset returns, are resampled.
- Sampling is with replacement.
- No external drift adjustment is applied.
- Daily compounding and 252-day horizon conversion are correct.
- Fixed seed is reproducible.
- Required outputs are correct.
- Invalid -100% or nonfinite returns fail visibly.
- Worker cancellation and stale handling remain intact.
- Block bootstrap was not introduced.

Return algorithm defects, dependence-preservation risks, numerical risks, and exact fixes.
```

## Manual test checklist

- [ ] Use a tiny labeled vector fixture and verify sampled asset pairs always come from the same source day.
- [ ] Run a fixed-seed simulation twice and compare results.
- [ ] Verify sampling with replacement allows repeated days.
- [ ] Verify no drift adjustment is applied.
- [ ] Test a -100% return and a nonfinite return.
- [ ] Verify P10/P50/P90 ordering and risk statistics.
- [ ] Cancel a bootstrap run and verify clean state.

## Exit criteria

- Whole-vector dependence is preserved.
- Seeded results are reproducible.
- Outputs are valid.
- No block bootstrap or drift adjustment exists.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Phase 7 is accepted only when 7A, 7B, and 7C all pass.


# Phase 8A - Projection Horizon and Projection Visuals
**Status:** Not yet accepted

## Purpose

Apply one persisted 1-10 year global horizon across every forward-looking module and render confidence-fan and percentile-band visuals with calendar context.

## Dependencies

- Accepted Monte Carlo methods
- Accepted Chart Manager
- Accepted settings persistence

## Required deliverables

- `js/settings/projection-settings.js`
- `js/utils/projection-date-utils.js`
- `js/charts/mc-confidence-fan.js`
- `js/charts/mc-percentile-bands.js`
- Dashboard and Settings controls
- Export metadata hooks

## Canonical implementation prompt

```text
Build Phase 8A Projection Horizon and Projection Visuals.

Authoritative spec: requirements.md, Version 2.2.
Use the accepted Monte Carlo and Chart Manager interfaces.

Create or update:
- js/settings/projection-settings.js
- js/utils/projection-date-utils.js
- js/charts/mc-confidence-fan.js
- js/charts/mc-percentile-bands.js
- dashboard and Settings controls
- export metadata hooks

Requirements:
1. Provide one global Projection Horizon control.
2. Accept integer values from 1 through 10 years only.
3. Default to the requirements-approved initial value.
4. Use 252 trading days per projection year for calculations.
5. Calculate and display a human-readable projected calendar end date separately from the statistical trading-day length.
6. Place the control prominently in the dashboard header and also in Settings.
7. Persist changes locally.
8. Apply the selected horizon to GBM, Historical Bootstrap, summary cards, benchmark projection tables, confidence fan, percentile bands, CSV metadata, backup metadata, and print report context.
9. Changing the horizon must invalidate a prior simulation and trigger recalculation without page refresh when the user runs or approves it.
10. Do not silently start an expensive simulation on every input keystroke.
11. Render confidence fan and percentile bands with accessible legends, methodology labels, and unavailable states.
12. Support iPhone 13 mini portrait and landscape.
13. Provide exact files and manual tests.
```

## Canonical audit prompt

```text
Audit Phase 8A against requirements.md Version 2.2.

Check:
- Only integer horizons 1-10 are accepted.
- 252 trading days per year is used consistently.
- Calendar date and trading-day horizon are clearly distinguished.
- One setting controls every projection output.
- The selected value persists.
- Horizon changes mark prior simulations stale.
- Expensive runs are not triggered on every keystroke.
- Confidence fan and percentile bands consume accepted simulation output.
- Export and report metadata hooks include horizon and projected-through date.
- Desktop and iPhone layouts are usable.

Return consistency defects, stale-state defects, date risks, and exact fixes.
```

## Manual test checklist

- [ ] Set every horizon from 1 through 10 and verify persistence.
- [ ] Reject 0, 11, decimals, blank, NaN, and pasted invalid text.
- [ ] Verify 1 year maps to 252 simulation steps and 10 years to 2,520.
- [ ] Verify projected calendar date display updates.
- [ ] Run GBM and Bootstrap at two horizons and verify prior results become stale.
- [ ] Inspect confidence fan and percentile bands.
- [ ] Verify CSV/report metadata hooks receive horizon and date.
- [ ] Test controls in iPhone portrait and landscape.

## Exit criteria

- One global horizon controls all projections.
- Dates and steps are consistent.
- Stale-result handling works.
- Projection visuals render accessibly.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Do not add deterministic scenario analysis.


# Phase 9A - Full Portable Backup and Restore
**Status:** Not yet accepted

## Purpose

Provide a versioned, validated, transactional backup containing configuration and normalized historical data so the Mac can initialize or update the iPhone without automatic synchronization.

## Dependencies

- Stable persistence schema
- Accepted historical data and portfolio state
- File and download capability

## Required deliverables

- `js/export/full-backup-export.js`
- `js/export/full-backup-restore.js`
- Backup schema and integrity metadata
- Restore preview UI
- Updated storage/UI tests
- Mac-to-iPhone transfer procedure

## Canonical implementation prompt

```text
Build Phase 9A Full Portable Backup and Restore.

Authoritative spec: requirements.md, Version 2.2.
Implement this before final reporting so the Mac-to-iPhone transfer workflow is available early.

Create or update:
- js/export/full-backup-export.js
- js/export/full-backup-restore.js
- restore preview and confirmation UI
- persistence transaction helpers
- tests/storage-tests.html and tests/ui-tests.html

Requirements:
1. Export one versioned full portable backup containing:
   - holdings and lots
   - benchmarks and active-symbol states
   - settings and UI preferences
   - projection and Monte Carlo settings
   - normalized historical candles
   - historical dataset metadata, hashes, dates, counts, and adjustment methodology
   - historical quality flags
   - historical import history
   - diagnostics settings needed for safe restore
2. Exclude the Finnhub API key by default.
3. Do not include cached provider request URLs or secrets.
4. Include backup schema version, application version, creation timestamp, source-device label, section counts, and integrity checksum or equivalent validation.
5. Validate the complete backup before changing current state.
6. Show a restore preview with versions, counts, symbols, date ranges, and warnings.
7. Reject unsupported future versions, malformed sections, duplicate keys, invalid records, and checksum failure.
8. Restore transactionally so a failed restore leaves the prior state intact.
9. Offer replace behavior for the complete portable state; do not silently merge incompatible historical datasets.
10. Invalidate derived analytics and simulations after successful restore.
11. Prompt for a local Finnhub key after restore because the key is absent.
12. Support transfer from Mac to iPhone through AirDrop or Files.
13. Record backup and restore success or safe failure in Diagnostics.
14. Provide deterministic corruption and rollback tests.
```

## Canonical audit prompt

```text
Audit Phase 9A against requirements.md Version 2.2.

Check:
- Full backup includes every required state and historical section.
- API key and sensitive request details are excluded.
- Schema version and integrity validation are present.
- Entire backup is validated before mutation.
- Restore preview is complete.
- Unsupported, malformed, duplicate, or corrupted data is rejected.
- Restore rollback preserves prior data.
- Historical data is not silently merged across incompatible adjustment bases.
- Derived results are invalidated.
- Mac-to-iPhone transfer and post-restore key entry are documented.
- Diagnostics do not expose private backup content.

Return data-loss risks, privacy risks, compatibility risks, and exact fixes.
```

## Manual test checklist

- [ ] Export a full backup from a populated Mac test profile.
- [ ] Inspect backup metadata and confirm no key exists.
- [ ] Restore into an empty test profile.
- [ ] Compare holdings, settings, counts, hashes, and date ranges.
- [ ] Corrupt the checksum and verify rejection.
- [ ] Remove a required section and verify rejection.
- [ ] Use an unsupported future schema version.
- [ ] Inject a restore failure and verify old state remains.
- [ ] Transfer through AirDrop/Files and restore on iPhone after Phase 1D.
- [ ] Verify the iPhone requests its own Finnhub key.

## Exit criteria

- Full backup round-trip preserves required state.
- No secret is exported.
- Corruption and rollback tests pass.
- Mac-to-iPhone restore works before final acceptance.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

This phase is the approved synchronization mechanism. Do not add cloud sync.


# Phase 9B - Export and Reporting
**Status:** Not yet accepted

## Purpose

Add CSV exports, chart PNG integration, a print-optimized report for browser Print to PDF, and lightweight configuration backup while preserving methodology and freshness context.

## Dependencies

- Accepted calculations, charts, projections, and full portable backup
- Browser Blob/download and print support

## Required deliverables

- `js/export/csv-export.js`
- `js/export/backup-export.js`
- `js/export/backup-restore.js`
- `js/export/print-report.js`
- `js/export/export-manager.js`
- Updated `css/print.css`
- Updated UI tests

## Canonical implementation prompt

```text
Build Phase 9B Export and Reporting.

Authoritative spec: requirements.md, Version 2.2.
Use browser Print to PDF. Do not add a custom PDF library.
Do not weaken the accepted full portable backup behavior from Phase 9A.

Create or update:
- js/export/csv-export.js
- js/export/backup-export.js
- js/export/backup-restore.js
- js/export/print-report.js
- js/export/export-manager.js
- css/print.css
- tests/ui-tests.html

Requirements:
1. CSV export for holdings.
2. CSV export for lots.
3. CSV export for portfolio analytics.
4. CSV export for historical comparison data where available.
5. CSV export for Monte Carlo summaries and benchmark projection results.
6. Include projection horizon and projected-through date.
7. Include observation count, aligned range, source, split adjustment, dividend exclusion, quote timestamp, risk-free-rate timestamp, stale warnings, and simulation seed/method where relevant.
8. Escape CSV safely and preserve numeric precision appropriate for data export.
9. Create a print-optimized report page containing required summary cards, holdings, benchmarks, analytics, charts, Monte Carlo outputs, methodology, freshness, and warnings.
10. Integrate PNG chart exports.
11. Implement lightweight configuration backup and restore separately from full portable backup.
12. Exclude the Finnhub key from every export by default.
13. Do not provide public share links or upload exports.
14. Implement backup reminders: 30 calendar days or 10 saved edits since last backup, whichever occurs first, with a 30-day dismissal.
15. Record safe export failures in Diagnostics.
16. Provide exact files and manual tests.
```

## Canonical audit prompt

```text
Audit Phase 9B against requirements.md Version 2.2.

Check:
- Every required CSV exists and escapes values correctly.
- Methodology, source, dates, freshness, and projection context are included.
- Print report contains required tables and charts and works through browser Print to PDF.
- PNG integration works.
- Configuration backup is distinct from full portable backup.
- API key is excluded from all exports.
- No upload or public share mechanism exists.
- Backup reminder triggers follow the exact rules.
- Export errors are visible and safe.
- Print styles work on desktop and do not depend on unsupported libraries.

Return blocking export defects, privacy risks, labeling defects, and exact fixes.
```

## Manual test checklist

- [ ] Export every CSV and open it in a spreadsheet application.
- [ ] Test commas, quotes, line breaks, Unicode, and formula-like user text for safe CSV handling.
- [ ] Verify full precision fields are not display-rounded unnecessarily.
- [ ] Open the print report and use browser Print Preview.
- [ ] Save a PDF and inspect page breaks, charts, warnings, and headers.
- [ ] Export each chart as PNG.
- [ ] Test configuration backup round-trip.
- [ ] Inspect every export for API-key absence.
- [ ] Simulate 30 days and 10 edits to verify reminder rules.
- [ ] Cancel a download and verify an explicit safe state.

## Exit criteria

- CSV, PNG, and print outputs work.
- Methodology and freshness context are complete.
- No key or upload path exists.
- Backup reminders are correct.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Use Phase 9A full backup for device transfer; configuration backup is the smaller convenience option.


# Phase 10A - Hardening, Vendoring, Offline, and iPhone Validation
**Status:** Not yet accepted

## Purpose

Vendor dependencies, finalize service-worker caching and storage diagnostics, complete accessibility and security hardening, and validate the Mac and iPhone offline operating model.

## Dependencies

- All functional phases accepted
- Phase 1D completed on target home Wi-Fi
- Stable final local HTTPS origin
- Full backup and restore available

## Required deliverables

- Vendored ECharts under `vendor/echarts/`
- Final versioned service-worker cache
- Offline fallback and update behavior
- Accessibility and security fixes
- Performance and compatibility reports
- Final manual backup

## Canonical implementation prompt

```text
Build Phase 10A hardening increment.

Authoritative spec: requirements.md, Version 2.2.
Do not add new product features unless required to satisfy acceptance.

Tasks:
1. Vendor Apache ECharts into vendor/echarts/ and remove the runtime CDN dependency.
2. Update service-worker static caching to include the app shell, icons, and vendored assets with explicit cache versioning.
3. Do not precache user exports, API keys, IndexedDB content, or runtime-sensitive URLs.
4. Implement safe cache upgrade and old-cache cleanup.
5. Confirm the app shell launches offline after a successful visit.
6. Confirm IndexedDB historical data, portfolio state, and cached quotes render when the Mac server is unavailable.
7. Distinguish Mac host unavailable, internet unavailable, Finnhub unavailable, stale cache, and local-history available states.
8. Add or verify StorageManager estimate, persisted status, persistence request, and clear warnings when unavailable.
9. Audit keyboard navigation, labels, landmarks, focus order, visible focus, dialog focus trapping, and announcements.
10. Audit high contrast and color-blind-safe chart distinctions.
11. Sanitize all user-entered text and avoid unsafe HTML rendering.
12. Audit API-key non-exposure in source, logs, diagnostics, exports, backups, URLs, and service-worker caches.
13. Test Firefox on macOS Big Sur.
14. Test Safari browser and Home Screen modes on iPhone 13 mini, iOS 26.5.
15. Test portrait, landscape, safe-area insets, orientation change, touch gestures, file import, backup restore, and horizontal table scrolling.
16. Test Monte Carlo progress and cancellation for 1-, 5-, and 10-year horizons with 1,000, 2,500, and 5,000 paths on iPhone.
17. Benchmark approximately 8, 13, and 25 active symbols on the Mac without silently reducing correctness.
18. Test application update after service-worker cache-version change.
19. Test recovery documentation after browser storage loss.
20. Confirm no public hosting, remote access, router forwarding, backend, or cloud sync is required.
21. Save final performance, compatibility, and acceptance notes.
```

## Canonical audit prompt

```text
Audit Phase 10A hardening against requirements.md Version 2.2.

Check:
- ECharts is local and offline-capable.
- Service-worker caches are explicitly versioned and do not contain secrets or user data.
- Offline launch works after successful installation.
- Mac-host, internet, provider, stale, and local-history states are distinct.
- Storage persistence diagnostics are correct.
- Accessibility basics pass.
- User-entered text is safely rendered.
- API key is absent from every prohibited surface.
- Firefox/macOS Big Sur and Safari/iPhone 13 mini are tested.
- Portrait, landscape, safe area, orientation, gestures, import, restore, and Monte Carlo cancellation pass.
- Performance notes exist for required symbol/path/horizon combinations.
- No prohibited deployment or architecture drift exists.

Return blocking, important, and minor defects. Identify exact files and retest steps.
```

## Manual test checklist

- [ ] Disconnect internet while keeping the Mac server available; inspect states.
- [ ] Stop the Mac server and launch the installed iPhone app offline.
- [ ] Update cache version and verify controlled update behavior.
- [ ] Inspect Cache Storage for secrets and user files.
- [ ] Request storage persistence and inspect Diagnostics.
- [ ] Run keyboard-only navigation on desktop.
- [ ] Run screen-reader spot checks for forms, errors, dialogs, and chart summaries.
- [ ] Test high contrast and non-color chart distinctions.
- [ ] Test iPhone portrait and landscape, safe areas, orientation, gestures, file import, and restore.
- [ ] Run required Monte Carlo path/horizon combinations and record elapsed time.
- [ ] Test approximately 8, 13, and 25 active symbols on Mac.
- [ ] Clear browser data in a test profile and follow recovery instructions.

## Exit criteria

- Vendored offline app works.
- Security and accessibility audits pass.
- Required Mac and iPhone tests are recorded.
- No prohibited architecture is present.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

Phase 1D must be completed before this phase can receive final acceptance.


# Phase 10B - Final Requirements Audit
**Status:** Not yet accepted

## Purpose

Perform the final no-new-features audit against every Version 2.2 requirement, acceptance criterion, non-goal, device target, data-source rule, and privacy constraint.

## Dependencies

- All prior phases accepted
- Complete test records
- Final local HTTPS and iPhone validation
- Final backup

## Required deliverables

- Final pass/fail requirements matrix
- Defect list grouped by severity
- Retest evidence
- Final accepted backup identifier
- Release decision

## Canonical implementation prompt

```text
Perform Phase 10B final audit.

Authoritative spec: requirements.md, Version 2.2.
Do not add new features unless required to correct a failed acceptance criterion.

Audit at minimum:
1. Private personal-use scope only.
2. No backend, cloud sync, public hosting, remote access, VPN requirement, or router port forwarding.
3. Approved Finnhub endpoints only; no /stock/candle.
4. Stooq history is private, split-adjusted, and dividend-unadjusted.
5. Complete-series manual historical replacement works transactionally.
6. Historical Data Service is the only analytical history interface.
7. Quote-only mode works when local history is missing.
8. Request queue enforces 60/minute, 30/second, priorities, bounded concurrency, and 429 backoff.
9. 25 active-symbol cap is enforced across holdings and benchmarks.
10. API key is not hardcoded, committed, logged, exported, backed up, cached, or exposed in diagnostics.
11. Holdings and lots add/edit/delete, preserve audit notes, and do not auto-apply corporate actions.
12. Built-in benchmarks can be deleted and re-added.
13. Deleting a benchmark does not affect a same-ticker holding.
14. Historical analytics are labeled split-adjusted, dividend-unadjusted price-return approximations.
15. Headline drawdown uses the Price-Return Performance Series.
16. GBM and Historical Bootstrap are the only MVP Monte Carlo methods.
17. Simulations use workers, progress, cancellation, seeds, and stale-run protection.
18. Charts render responsively and export PNG.
19. Projection horizon is globally consistent from 1 through 10 years.
20. Full portable backup and transactional restore work from Mac to iPhone.
21. API key is excluded from backup by default.
22. CSV and browser Print to PDF work.
23. Backup reminder rules are correct.
24. PWA launches offline after a successful visit.
25. Mac-host unavailable, internet unavailable, provider unavailable, stale, and local-history states are distinct.
26. Trusted same-Wi-Fi HTTPS and Home Screen installation work on iPhone 13 mini iOS 26.5.
27. iPhone portrait, landscape, safe areas, gestures, file import, restore, and Monte Carlo cancellation are tested.
28. Firefox/macOS Big Sur compatibility passes.
29. Accessibility and safe rendering basics pass.
30. Performance notes exist for the required symbol, horizon, and path-count combinations.
31. Every acceptance criterion in requirements.md is mapped to test evidence.
32. Every explicit non-goal remains excluded.

Output:
- A complete pass/fail matrix keyed to requirements sections.
- Defects grouped as blocking, important, or minor.
- Exact files and retest procedures for every failure.
- A final release recommendation: accept, accept with documented minor limitations, or reject.
- No speculative future features.
```

## Canonical audit prompt

```text
Review the Phase 10B audit itself for completeness and evidence quality.

Check:
- Every requirements section and acceptance criterion is represented.
- Every pass cites a test, file, or observable result.
- No unsupported assumption is marked pass.
- Blocking defects are not downgraded.
- Security, privacy, data integrity, numerical correctness, offline behavior, and iPhone behavior are all covered.
- The release recommendation matches the evidence.
- No API key or private backup content appears in the audit.

Return only audit-quality defects and required corrections.
```

## Manual test checklist

- [ ] Trace every acceptance criterion to a test record.
- [ ] Search the project tree for prohibited endpoint strings and likely secret patterns.
- [ ] Inspect service-worker caches, Local Storage, IndexedDB metadata, exports, and backups.
- [ ] Run the final desktop smoke suite.
- [ ] Run the final iPhone Home Screen and offline suite.
- [ ] Run final parser, persistence, analytics, Monte Carlo, and export tests.
- [ ] Confirm the final working-folder backup opens independently.

## Exit criteria

- Every criterion has evidence.
- No blocking defect remains.
- Final backup is verified.
- Release decision is explicit and justified.

## Backup gate

- Create a phase-labeled copy of the full working folder after acceptance.
- Record browser/device, test date, and any known limitations in `docs/test-results/`.

## Phase notes

This phase closes the MVP. Future features require a new approved requirements version.

# 9. Cross-Phase Testing Matrix

| Test area | Primary phase | Retest phases |
|---|---|---|
| Static shell and navigation | 1A | 5A, 10A |
| Local Storage and IndexedDB | 1B | 2C, 2D, 9A, 10A |
| Setup wizard | 1C | 3B, 9A, 10A |
| Trusted local HTTPS and Home Screen | 1D | 9A, 10A, 10B |
| Request limits and retries | 2A | 2F, 10B |
| Stooq parsing and validation | 2B | 2C, 2D, 10B |
| Seed installation and migrations | 2C | 9A, 10A |
| Manual historical replacement | 2D | 6A, 7A-7C, 9A, 10B |
| Historical alignment and lookback | 2E | 6A, 7B, 7C |
| Live quotes and metadata | 2F | 3A, 4A, 10A |
| Portfolio calculations | 3A | 6A, 9B, 10B |
| Portfolio UI and corporate actions | 3B | 9A, 10A |
| Benchmark separation and symbol cap | 4A | 5A, 6A, 7A, 10B |
| Charts and mobile gestures | 5A | 8A, 9B, 10A |
| CAGR, alpha, beta, drawdown | 6A | 9B, 10B |
| Worker states and cancellation | 7A | 7B, 7C, 10A |
| GBM | 7B | 8A, 9B, 10A |
| Historical Bootstrap | 7C | 8A, 9B, 10A |
| Projection horizon | 8A | 9B, 10A |
| Full portable backup and restore | 9A | 10A, 10B |
| CSV, PNG, print report | 9B | 10B |
| Offline, accessibility, compatibility | 10A | 10B |

## 9.1 Deterministic fixture policy

- Use synthetic fixtures for committed parser and calculation tests.
- Use the eight private Stooq files for local acceptance testing.
- Keep expected calculation outputs explicit and independently verifiable.
- Never use a live API response as the sole proof of calculation correctness.
- Never include a real API key in test data.

## 9.2 Browser and device matrix

| Environment | Required use |
|---|---|
| Firefox on macOS Big Sur | Primary development and full functional acceptance |
| Safari on iPhone 13 mini browser mode | Network, import, layout, and compatibility tests |
| Safari Home Screen web-app mode | Final PWA, offline, safe-area, storage, and restore acceptance |
| Firefox on iOS | Secondary compatibility checks where practical |

# 10. Backup, Versioning, and Release Discipline

## 10.1 Manual working-folder backups

After every accepted phase:

1. Stop editing.
2. Run all phase tests.
3. Confirm no fatal console errors.
4. Record test results.
5. Duplicate the entire project folder.
6. Name the backup with phase and acceptance date.
7. Open the backup independently before proceeding.

Example:

```text
MVP-Portfolio-Dash-phase-03A-accepted-YYYY-MM-DD/
```

## 10.2 Application and schema versions

Track independently:

- Application version
- Local Storage schema version
- IndexedDB schema version
- Historical dataset version
- Full portable backup schema version
- Service-worker cache version

A version change must have a documented reason and migration or invalidation behavior.

## 10.3 Historical update versioning

For each imported symbol record:

- Source file name
- Source ticker
- Canonical symbol
- SHA-256 or equivalent file hash
- Record count
- First and last date
- Source and adjustment methodology
- Import mode
- Import timestamp
- Previous version or hash
- Added, changed, removed, and unchanged counts
- Result and safe diagnostics reference

## 10.4 Release backup

Before Phase 10B acceptance, create:

- Final source-folder backup
- Configuration backup
- Full portable backup
- Test evidence folder
- Final requirements audit

The Finnhub key must not be included in any of these artifacts.

# 11. Mac-to-iPhone Operating Workflow

## 11.1 Initial installation

1. Complete Phase 1D on the target home Wi-Fi.
2. Start the private static HTTPS server on the Mac.
3. Open the stable HTTPS origin in Safari on the iPhone.
4. Confirm certificate trust and no warning.
5. Add the app to the Home Screen.
6. Launch the installed app.
7. Initialize using either the private seed installation or a full portable backup from the Mac.
8. Enter the Finnhub key locally on the iPhone.
9. Request persistent storage where supported.
10. Export a new full backup after successful setup.

## 11.2 Routine use

- The Mac and iPhone use separate browser storage.
- Each device makes its own approved Finnhub and Treasury requests.
- The Mac does not proxy API calls.
- The installed iPhone app may use cached shell and IndexedDB data when the Mac server is unavailable.
- Live data still requires internet access and a valid local key.

## 11.3 Historical refresh

1. Download fresh complete Stooq files on the Mac.
2. Import through Phase 2D.
3. Review added, changed, removed, and unchanged records.
4. Confirm complete-series replacement.
5. Verify analytics and simulations are invalidated.
6. Run historical and calculation tests.
7. Export a new full portable backup.
8. Transfer through AirDrop or Files.
9. Restore transactionally on the iPhone.
10. Verify counts, hashes, date ranges, holdings, settings, and historical availability.

## 11.4 Offline behavior

When the Mac server is stopped after successful installation:

Available on iPhone:

- Cached application shell
- Saved holdings, lots, benchmarks, and settings
- Local historical charts and analytics
- Monte Carlo from local data
- Cached quote snapshots with stale labels
- Backup export

Unavailable or limited:

- Application updates from the Mac
- Reinstallation after browser data loss
- Uncached static assets
- New Finnhub and Treasury data when internet is unavailable

# 12. Final MVP Acceptance Checklist

## Architecture and scope

- [ ] Client-side PWA only.
- [ ] No backend, public hosting, cloud sync, remote access, or router port forwarding.
- [ ] Private same-home-Wi-Fi use is documented.
- [ ] Code is modular and parameter-driven.

## Data sources

- [ ] Only approved Finnhub live endpoints are used.
- [ ] Finnhub `/stock/candle` is absent.
- [ ] Stooq history is private, split-adjusted, and dividend-unadjusted.
- [ ] Treasury risk-free rate has source, timestamp, cache, and stale warning.

## Historical data

- [ ] Eight private seed symbols install into IndexedDB.
- [ ] Historical records use `[symbol,date]` identity.
- [ ] Manifest, hash, dates, counts, source, and adjustment metadata persist.
- [ ] Unchanged files are skipped.
- [ ] Manual imports validate before storage changes.
- [ ] Complete-series replacement is the default.
- [ ] Append is allowed only after exact overlap validation.
- [ ] Failed imports and restores roll back.
- [ ] Historical Data Service returns exact-date aligned series.
- [ ] 757 closes produce 756 returns.
- [ ] Missing, stale, insufficient, and quality-warning states are explicit.

## Portfolio and benchmarks

- [ ] Holdings and lots add, edit, and delete.
- [ ] Multiple lots and fractional shares work.
- [ ] Cost basis, current values, and weights are correct.
- [ ] Acquisition dates are respected.
- [ ] Corporate actions are manual and audited.
- [ ] Built-in benchmarks can be deleted and re-added.
- [ ] Same-ticker holding and benchmark records remain distinct.
- [ ] 25 active-symbol cap is enforced.

## Analytics and Monte Carlo

- [ ] Outputs are labeled split-adjusted, dividend-unadjusted price-return approximations.
- [ ] CAGR, alpha, beta, and drawdown use aligned observations.
- [ ] Headline drawdown uses the Price-Return Performance Series.
- [ ] GBM and Historical Bootstrap are the only MVP methods.
- [ ] Worker progress, cancellation, seeds, and stale-run handling work.
- [ ] Required percentiles and risk statistics are produced.
- [ ] Global 1-10 year horizon is consistent across outputs.

## Charts and UI

- [ ] Required charts render.
- [ ] Time filters, toggles, zoom/reset, and PNG export work.
- [ ] Light and dark themes persist.
- [ ] Availability and stale states are visible.
- [ ] iPhone 13 mini portrait and landscape work.
- [ ] Safe areas, orientation changes, touch targets, gestures, and tables are usable.
- [ ] Accessibility basics pass.

## Export, backup, and privacy

- [ ] CSV exports work and include methodology and freshness metadata.
- [ ] Browser Print to PDF report works.
- [ ] Configuration backup works.
- [ ] Full portable backup and transactional restore work.
- [ ] Mac-to-iPhone transfer works.
- [ ] API key is excluded from exports and backups by default.
- [ ] Backup reminder rules are correct.
- [ ] No user data is uploaded by the application.

## PWA, offline, and compatibility

- [ ] Final origin is stable trusted local HTTPS.
- [ ] Home Screen installation works.
- [ ] Offline relaunch works after a successful visit.
- [ ] Mac-host, internet, Finnhub, stale-cache, and local-history states are distinct.
- [ ] Firefox on macOS Big Sur passes.
- [ ] Safari and Home Screen mode on iPhone 13 mini iOS 26.5 pass.
- [ ] Storage persistence and recovery warnings are present.
- [ ] Performance notes are recorded for required symbol, horizon, and path-count cases.

## Final release

- [ ] No blocking defect remains.
- [ ] Final requirements audit is complete.
- [ ] Final working-folder backup opens independently.
- [ ] Final full portable backup validates and restores.
- [ ] Release recommendation is recorded.

# 13. Prompt Execution Rules

1. Use one implementation prompt at a time.
2. Do not ask for the whole application in one response.
3. Request exact file contents for only the authorized files.
4. Copy files into SebEthaEdit and save.
5. Run from the correct origin.
6. Open Developer Tools and fix fatal runtime errors before adding another module.
7. Run the relevant deterministic test page.
8. Perform the manual test checklist.
9. Run the separate audit prompt.
10. Fix only documented defects.
11. Re-run tests and audit.
12. Create a manual backup.
13. Update the roadmap status.

Do not accept generated work that silently adds:

- Backend code
- Public hosting
- Remote access
- Router port forwarding
- Cloud sync
- Automatic device synchronization
- Brokerage integration
- Build tooling not explicitly approved
- Premium Finnhub dependencies
- Finnhub historical candles
- News
- Dividend-income calculations
- Total-return claims
- WebSocket streaming
- Regime Switching Monte Carlo
- Stochastic Volatility Monte Carlo
- Deterministic shock scenarios
- Block bootstrap
- Custom PDF libraries
- API keys in code, documentation, fixtures, logs, diagnostics, URLs, exports, or backups

---

## Consolidation Record

This document merges the applicable detail and prompts from the former Version 2.1 roadmap with the approved private local multi-source architecture introduced in Version 2.2. Obsolete historical-provider, public-hosting, remote-access, and literal development-key content has been removed. This document replaces both prior roadmap files; `requirements.md` Version 2.2 remains the authoritative product specification.

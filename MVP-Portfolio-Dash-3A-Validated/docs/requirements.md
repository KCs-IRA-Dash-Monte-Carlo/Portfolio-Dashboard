# Retirement Portfolio Dashboard
## Private Local Multi-Source MVP Requirements Specification

**Version:** 2.2  
**Status:** Approved rescope for private Mac and iPhone use  
**Primary Constraint:** Finnhub free-tier live data plus private local Stooq history  
**Target Build Type:** Client-side PWA hosted on the owner's Mac over trusted home Wi-Fi

---

## 1. Project Objective

Build a private, local, client-side retirement portfolio dashboard using:

- Finnhub free-tier U.S. stock and ETF endpoints for current quote snapshots and market context
- Private Stooq daily historical files for split-adjusted, dividend-unadjusted OHLCV history
- An approved public no-key source for the risk-free rate

The application shall provide:

- Portfolio holdings and multi-lot tracking
- Quote snapshots
- OHLCV-based historical charts
- Split-adjusted, dividend-unadjusted price-return approximation analytics
- Benchmark comparisons
- Lightweight projection tools
- GBM and Historical Bootstrap Monte Carlo projections
- Local persistence
- Offline-capable PWA shell
- CSV export
- Print-to-PDF reporting
- Full portable backup and restore between the Mac and iPhone

The application must function without an application backend and without premium Finnhub datasets.

The application must be parameter-driven and reusable. It must not be hardcoded around the initial portfolio.

The application is for the owner’s personal use only. Public hosting, public distribution of the bundled historical files, remote internet access, cloud synchronization, and router port forwarding are excluded from the MVP.

## 2. Approved Data Sources and Operating Constraints

The MVP shall use only the following approved sources:

- Finnhub free-tier stock endpoints for current quote snapshots, symbol lookup, company metadata, market status, market holidays, peers where retained, and basic metrics
- Private Stooq text files for daily U.S. stock and ETF historical OHLCV
- The U.S. Treasury Fiscal Data API, or another explicitly approved public no-key source, for the risk-free rate

### 2.1 Permitted Finnhub endpoints

Permitted Finnhub endpoints for MVP:

- `/quote`
- `/search`
- `/stock/symbol`
- `/stock/profile2`
- `/stock/peers`
- `/stock/market-status`
- `/stock/market-holiday`
- `/stock/metric`

Finnhub `/stock/candle` is not an MVP dependency and must not be required for historical analytics.

### 2.2 Approved historical-data source

Private Stooq files shall provide:

- Daily frequency only
- U.S. stock and ETF OHLCV
- Split-adjusted prices
- Dividend-unadjusted returns
- One complete historical series per imported symbol

The initial private dataset contains:

- DCO
- VTV
- ONEQ
- SPY
- IWM
- AVUV
- AVDV
- PSCH

The initial eight-symbol dataset has been validated as sufficient for the planned 756-observation daily Monte Carlo lookback.

Occasional updates shall use manual full-series replacement imports in the same Stooq text format.

### 2.3 Excluded Finnhub and market-data capabilities

The MVP must not require:

- Premium Finnhub data
- Finnhub historical candles
- Dividend history
- Standardized financial statements
- SEC filings
- Ownership data
- Company executives
- Full tick history
- Full tick data
- Deep international coverage
- Non-U.S. market data unless explicitly approved
- Company news
- Market news

### 2.4 Finnhub free-tier operating limits

The application must be designed around these limits:

- 60 API calls per minute
- 30 API calls per second
- MVP active-symbol cap of 25 total active symbols

Historical file parsing and IndexedDB reads do not consume Finnhub request budget.

## 3. Target Platforms and Compatibility

### 3.1 Primary desktop platform

Primary desktop target:

- Mozilla Firefox desktop
- macOS Big Sur 11.7.11
- MacBook Retina, 1.2 GHz Dual-Core Intel, 8 GB memory

### 3.2 Primary mobile platform

Primary mobile target:

- Safari on iPhone 13 mini
- iOS 26.5
- Device model: NLAD3LL/A
- Access only while connected to the same trusted home Wi-Fi as the Mac host

Firefox on iOS may be tested as a secondary browser, but Safari and Home Screen web-app mode are the primary iPhone targets.

### 3.3 iOS constraints

Testing must cover:

- Local HTTPS trust
- Home Screen installation
- Local Storage and IndexedDB persistence
- Service-worker behavior
- Offline launch after successful installation
- File import from the iOS Files picker
- Full backup restore
- Portrait and landscape layouts
- Touch gestures
- Storage-loss and eviction recovery
- Mac host unavailable after the application has been cached

### 3.4 JavaScript compatibility

Use:

- HTML
- CSS
- Plain JavaScript
- ES2020-compatible syntax
- Apache ECharts

Avoid dependencies on newer browser features that would break the primary desktop target. Feature-detect optional APIs.

### 3.5 Responsive behavior

Support:

- Desktop layout
- Tablet layout
- iPhone 13 mini portrait layout
- iPhone 13 mini landscape layout
- Touch interaction
- Horizontally swipeable mobile panels only where gesture conflicts are controlled
- Safe-area insets in Home Screen web-app mode

## 4. Technology and Deployment Constraints

The MVP must be:

- Client-side only
- PWA-capable
- No application backend
- No brokerage connection
- No user account system
- No cloud synchronization
- No required build system unless later explicitly approved
- Hosted privately from the owner’s Mac
- Accessible only on the trusted home Wi-Fi
- Served from a stable local HTTPS origin for final iPhone PWA use

Required files:

- `index.html`
- `manifest.json`
- `service-worker.js`
- Required static assets
- Private historical-data files and manifest

A build tool may be reconsidered later if performance, ECharts bundle size, or modularity makes it necessary. For MVP, keep the toolchain minimal.

### 4.1 Private local-network hosting

The final personal-use origin must use a stable hostname or reserved local IP, a stable port, and HTTPS trusted by the iPhone.

The project must not require:

- Public DNS
- Public static hosting
- Router port forwarding
- Dynamic DNS
- Remote internet access
- VPN access
- Server-side API proxying

Changing protocol, hostname, IP address, or port may create a separate browser origin and therefore separate Local Storage, IndexedDB, and service-worker state. The setup documentation must warn the user to keep the final origin stable.

## 5. Initial Portfolio Defaults

The setup wizard should prepopulate the following default lots:

| Ticker | Shares | Acquisition Date | Purchase Price per Share |
|---|---:|---|---:|
| DCO | 39 | 2026-05-15 | 145.17948 |
| VTV | 547 | 2026-05-15 | 207.0364 |
| ONEQ | 918 | 2026-05-15 | 104.06513 |

These are editable defaults only.

They must not be immutable business logic.

---

## 6. Setup Wizard

On first launch, present a setup wizard.

The wizard must support:

- Finnhub API key entry
- Warning that API keys are stored locally
- Warning that local browser data can be lost or evicted
- Initial portfolio review
- Add/edit/delete holdings
- Add/edit/delete acquisition lots
- Initial benchmark review
- Theme selection
- Initial projection horizon selection
- Backup/export reminder
- Private historical seed-dataset status
- Historical installation progress
- Full-backup restore option for initializing the iPhone

Setup must not require successful historical-data installation before completion.

If historical installation fails, the app must allow quote-only operation while disabling or marking unavailable modules that require historical data.

On a new iPhone installation, the user may initialize the app by either:

1. Installing the private bundled Stooq seed dataset, or
2. Restoring a full portable backup exported from the Mac.

After successful iPhone setup, the app should request persistent storage where supported and immediately recommend a full backup.

## 7. API Key Handling

The Finnhub API key must be entered by the user at runtime.

The key must not be:

- Hardcoded into source code
- Committed to version control
- Included in `requirements.md`
- Exposed in diagnostics
- Included in exports
- Logged to the console
- Displayed in plaintext after initial entry unless the user explicitly reveals it

Any API key used during development must be treated as temporary and rotated before production use.

---

## 8. Portfolio Data Model

### 8.1 Holdings

Support:

- Add holding
- Edit holding
- Delete holding
- Multiple holdings subject to the active-symbol cap

### 8.2 Acquisition lots

Each holding may contain multiple acquisition lots.

Each lot must store:

- Ticker
- Shares
- Purchase price per share
- Acquisition date

When the user adds to an existing holding, treat the entry as a new lot unless the user explicitly edits an existing lot.

### 8.3 Lot actions

Support:

- Add lot
- Edit lot
- Delete lot

### 8.4 Position entry

For each lot, require:

- Shares
- Purchase price
- Acquisition date

Automatically calculate total invested cost.

### 8.5 Share handling

Support fractional shares.

Use full JavaScript `Number` precision internally and round only for display.

### 8.6 Rebalancing assumption

Use:

- Buy-and-hold
- No periodic rebalancing
- Fixed share counts unless the user edits portfolio lots

### 8.7 Taxes

Exclude:

- Realized gains
- Tax optimization
- Tax filing
- Tax-lot disposal accounting
- Wash-sale handling


### 8.8 Corporate actions and lot ledger

The MVP does not automatically detect or apply stock splits, reverse splits, ticker changes, spin-offs, mergers, or other corporate actions to stored lots.

Reason:

- Finnhub free-tier MVP data does not provide a complete corporate-action ledger.
- Auto-adjusting lots without a reliable corporate-action source would create a higher risk of incorrect account values than requiring user review.

Required MVP behavior:

- Show a clear Settings and Help notice that users are responsible for updating lots after corporate actions.
- Provide an explicit lot-edit workflow for adjusting shares and purchase price after a split or similar event.
- Preserve an audit note field on lots so users can record manual adjustments.
- If quote or historical price behavior suggests a possible split, the app may show a non-authoritative warning, but it must not automatically alter stored lots.

Future versions may add automatic corporate-action detection only if a reliable data source is approved.

---

## 9. Active-Symbol Limit

MVP active-symbol limit:

- Maximum 25 total active symbols across holdings and benchmarks
- Additional symbols may be stored but inactive
- Only active symbols are refreshed, charted, and used in projections
- The user must be able to activate/deactivate symbols
- Activating a symbol beyond the cap must show a clear warning and prevent activation unless a future advanced override is explicitly approved

The 25-symbol cap is intended to keep the app compatible with Finnhub free-tier rate limits.

The symbol-management view must support search or filtering across stored inactive and active symbols so users can manage larger saved watchlists without relying only on table sorting.

---

## 10. Benchmark Management

Built-in benchmarks are seeded defaults, not permanent locked records.

Default benchmark tickers:

- SPY
- IWM
- AVUV
- AVDV
- PSCH

The user must be able to:

- Add benchmark tickers
- Delete benchmark tickers
- Re-add deleted built-in benchmark tickers
- Activate benchmark tickers
- Deactivate benchmark tickers
- Rename benchmark display labels where appropriate
- Search and validate benchmark tickers using Finnhub symbol lookup
- Include or exclude benchmarks from charts
- Include or exclude benchmarks from benchmark projection tables

Benchmarks shall be stored in the same symbol-management system as portfolio holdings but classified separately as benchmark assets.

Benchmarks must not require:

- Shares
- Purchase price
- Cost basis
- Acquisition lots

Benchmarks count toward the 25 total active-symbol MVP limit.

Deleting a benchmark removes it from:

- Comparison charts
- Benchmark tables
- Projection tables
- Saved benchmark configuration

Deleting a benchmark must not delete any portfolio holding with the same ticker unless the user explicitly deletes that holding separately.

If a deleted built-in benchmark is re-added, it behaves like any other user-added benchmark.

---

## 11. Storage and Persistence

Use:

- Local Storage for small user configuration
- IndexedDB for market data, imported historical data, diagnostics, and larger structured datasets

Mac and iPhone storage are independent. No automatic synchronization is provided.

### 11.1 Local Storage

Store in Local Storage:

- Holdings
- Lots
- Active-symbol preferences
- Benchmarks
- API settings metadata
- Theme
- Accent color
- Font scaling
- UI preferences
- Projection horizon
- Monte Carlo settings
- Export preferences
- Historical import preferences
- Last backup and restore metadata

### 11.2 IndexedDB

Store in IndexedDB:

- Cached quote snapshots
- Normalized historical OHLCV candles
- Historical dataset manifests
- Historical import batches
- Historical quality flags
- Company metadata cache
- Diagnostics history
- Export staging data

Recommended historical candle key:

```text
[symbol, date]
```

Historical records must preserve:

- Source
- Source ticker
- Frequency
- Price-adjustment method
- Dividend-adjustment method
- Dataset version
- Import timestamp
- Source-file hash
- Quality flags

### 11.3 Write behavior

Persistence writes must be:

- Batched where practical
- Debounced where practical
- Versioned by schema
- Transactional for historical full-series replacement

Do not rewrite large state blobs on every small input event.

A failed historical replacement must not leave a partially replaced symbol series.

### 11.4 Storage persistence and diagnostics

Where supported, the application shall use:

- `navigator.storage.estimate()`
- `navigator.storage.persisted()`
- `navigator.storage.persist()`

Diagnostics must show:

- Persistence requested
- Persistence granted or denied
- Estimated storage usage
- Estimated quota
- IndexedDB availability
- Seed dataset version
- Last historical import
- Last full backup
- Last full restore

The app must not assume that persistent storage will be granted.

### 11.5 Data-loss warning

Because the application has no backend and no cloud sync, the app must warn users that browser-local data may be lost, cleared, or evicted, especially on iOS.

Required mitigation:

- Configuration backup export
- Full portable backup export including historical data
- Restore from backup import
- Periodic export reminder
- Warning during setup
- Warning in Settings

Periodic export reminder rule:

- Remind the user if no backup has been exported in the last 30 calendar days, or
- Remind the user after 10 saved portfolio/benchmark/settings edits since the last backup, whichever comes first.
- Allow the user to dismiss the reminder for 30 calendar days.

## 12. Market Data Strategy

The app shall use separate live-data and historical-data paths.

### 12.1 Quote snapshots

Use Finnhub `/quote` for quote snapshots.

Retrieve quote snapshots:

- On application load when internet access is available
- When the user presses Manual Refresh
- For active symbols only

Quote snapshots must be labeled as snapshots, not continuous streaming values.

Finnhub quote snapshots must not be converted into complete daily OHLCV candles.

### 12.2 Historical data source

Use private Stooq text files for historical OHLCV.

The source format is:

```text
<TICKER>,<PER>,<DATE>,<TIME>,<OPEN>,<HIGH>,<LOW>,<CLOSE>,<VOL>,<OPENINT>
```

Required interpretation:

- `PER` must equal `D`
- `DATE` uses `YYYYMMDD`
- `TIME` is a daily placeholder and is not used for session timing
- `.US` suffixes are normalized to canonical symbols
- `OPENINT` is ignored for stocks and ETFs
- Prices are split-adjusted
- Dividends are not included
- Volume is retained as source-provided volume and must not be assumed to be raw exchange share volume

### 12.3 Private seed dataset

The private project may bundle the eight validated Stooq files for:

- DCO
- VTV
- ONEQ
- SPY
- IWM
- AVUV
- AVDV
- PSCH

On first use per browser origin:

1. Load the historical dataset manifest.
2. Compare dataset version and file hashes with IndexedDB.
3. Parse and validate changed or missing files.
4. Normalize the records.
5. Store them transactionally in IndexedDB.
6. Record installation status and provenance.
7. Skip unchanged files on later launches.

The application must not parse every source file on every startup.

### 12.4 Manual historical updates

Occasional updates shall use manual Stooq imports in the same format.

Default update method:

- Complete file validation
- Comparison with the stored series
- User preview of added, changed, removed, and unchanged records
- Full-series replacement for each confirmed symbol
- Transactional write
- Derived-data invalidation

Full-series replacement is the default because future stock splits may restate the entire historical series.

Incremental append may be supported only when all overlapping records exactly match the stored series.

### 12.5 Historical-data service

Charts, analytics, portfolio calculations, and Monte Carlo must access history through a provider-independent service.

At minimum, expose stable interfaces for:

- `getSeries(symbol, options)`
- `getLatestCandle(symbol)`
- `getDateRange(symbol)`
- `getAlignedSeries(symbols, options)`
- `getDatasetStatus(symbol)`

Business logic must not parse source files directly.

### 12.6 Symbol search

Use `/search` and/or `/stock/symbol` for ticker validation and symbol lookup.

A newly added symbol may operate in quote-only mode until compatible local history is imported.

### 12.7 Company metadata

Use `/stock/profile2` for company metadata such as:

- Name
- Ticker
- Exchange
- IPO date
- Market cap
- Shares outstanding
- Logo
- Website
- Currency
- Country
- Industry classification

Company profile data must be cached in IndexedDB with a default TTL of 7 calendar days per symbol, unless manually refreshed or invalidated by schema upgrade.

### 12.8 Company peers

`/stock/peers` may be used for basic company context only.

Peer analytics are not required for MVP.

Peer data must be fetched on demand only and cached with a default TTL of 7 calendar days per symbol.

### 12.9 Market status and holidays

Use:

- `/stock/market-status`
- `/stock/market-holiday`

Use these to show whether the market is open and to support trading-calendar behavior.

### 12.10 Basic metrics

Use `/stock/metric` for basic company context only.

Permitted examples:

- 52-week high
- 52-week low
- Beta
- Other available summary metrics

These values must not substitute for calculated portfolio analytics unless explicitly validated and documented.

Basic metrics must be cached with a default TTL of 7 calendar days per symbol.

## 13. Excluded Market Data Features

The MVP excludes:

- Dividend history
- Dividend reinvestment
- Estimated annual income
- Standardized income statements
- Balance sheets
- Cash flow statements
- SEC filings
- Ownership data
- Insider data
- Executive profiles
- Company news
- Market news
- Full tick history
- Non-U.S. market coverage unless specifically verified

If a dividend-related value appears through `/stock/metric`, it may be shown only as informational company context and must not be used for portfolio-income calculations.

---

## 14. Request Queue and Rate-Limit Management

Network Data Services must enforce request management compatible with Finnhub free-tier limits.

Required behavior:

- Maximum 60 Finnhub calls per minute
- Maximum 30 Finnhub calls per second
- No uncontrolled parallel API fan-out
- Prioritize portfolio holding quotes before benchmark quotes
- Prioritize quote snapshots before metadata
- Use cached local historical data instead of network history requests
- Use throttling
- Use request queueing
- Use retry handling
- Use backoff for rate-limit responses
- Handle HTTP 429 visibly
- Show API status in Diagnostics
- Show approximate Finnhub request budget in Diagnostics

Historical file parsing, IndexedDB access, and local imports are outside the Finnhub request budget and must not be presented as API calls.

## 15. Feature Availability States

Each major dashboard module must support applicable states:

- Available
- Loading
- Stale
- Quote-only
- Insufficient history
- Rate-limited
- Offline
- Temporarily unavailable
- Error
- Historical dataset installing
- Historical import required
- Historical file missing
- Historical file invalid
- Historical replacement pending confirmation
- Historical dataset current
- Historical dataset stale
- Historical quality warning
- Adjustment metadata missing
- Local Mac host unavailable
- Local certificate invalid
- Application update unavailable
- Offline shell active

The UI must clearly distinguish:

- Internet or Finnhub failure
- Local Mac host failure
- Historical-data absence
- Historical-data validation failure
- Local cached operation

A plan/entitlement-unavailable state may remain for Finnhub endpoints still used by the app, but it is no longer the normal historical-data fallback state.

## 16. Return Methodology

The application uses split-adjusted, dividend-unadjusted Stooq OHLCV history for historical performance calculations.

Returns are price-return approximations.

The app must not label these calculations as:

- Exact total return
- Dividend-reinvested total return
- Brokerage-reconciled performance
- Tax-adjusted performance

### 16.1 Account Value Series

The Account Value Series uses user-entered shares multiplied by current or historical prices.

Use this series for:

- Current account value
- Position value
- Portfolio allocation
- Dollar gain/loss
- Account-style reporting

Historical account value is a modeled split-adjusted price series. It assumes stored lot shares and purchase prices have been manually updated after corporate actions where necessary.

### 16.2 Price-Return Performance Series

The Price-Return Performance Series uses split-adjusted, dividend-unadjusted close history to calculate:

- Normalized returns
- CAGR
- Alpha
- Beta
- Drawdown
- Benchmark comparisons
- Projections

This series excludes dividends and may not reconcile with brokerage total-return reporting.

### 16.3 Labeling

Every chart or metric derived from Stooq history must clearly communicate that it is a split-adjusted, dividend-unadjusted price-return approximation.

## 17. Portfolio Performance

### 17.1 Weighting

Use market-value weights that float over time based on active holdings and available price data.

For holding `i` at time `t`:

```text
w_i,t = MV_i,t / sum(MV_j,t)
```

where `MV_i,t` is the holding's market value at time `t`.

### 17.2 Buy-and-hold treatment

The portfolio must represent fixed-share buy-and-hold behavior with no rebalancing.

Do not implement floating weights in a way that accidentally implies daily rebalancing.

### 17.3 Multiple acquisition dates

Each lot has its own acquisition date.

The portfolio inception date is the earliest active acquisition date unless a different portfolio inception date is explicitly configured later.

---

## 18. Core Dashboard Metrics

Include dashboard cards for:

- Current portfolio value
- Today's dollar gain/loss
- Today's percentage gain/loss
- Total dollar gain/loss
- Total percentage gain/loss
- CAGR, price-return approximation
- Alpha, price-return approximation
- Beta, price-return approximation
- Maximum Drawdown, price-return approximation
- Allocation
- Market status
- Last successful data refresh
- API status

Exclude from MVP:

- Dividend yield as portfolio income
- Estimated annual income
- True total return
- Tax-adjusted return

If a metric cannot be calculated reliably from free-tier data, show an unavailable state.

---

## 19. Risk-Free Rate

Use the U.S. Treasury Fiscal Data API, or another explicitly approved public no-key source, for the current 3-Month U.S. Treasury Bill yield.

Requirements:

- Do not rely on Finnhub premium data for this
- Cache the last successful value
- Display the retrieval timestamp
- Show stale warning if unavailable
- Do not silently substitute an arbitrary fixed rate

If the public source is unavailable, the user may optionally enter a manual risk-free rate for local calculations, clearly labeled as user-provided.

---

## 20. Benchmark Comparison

Normalize portfolio and benchmark series to a common percentage-return basis.

Built-in and user-added active benchmarks must support comparison where historical candle data is available.

If the selected start date is not a trading day:

- Use the first valid trading session on or after the selected date

If a benchmark lacks sufficient OHLCV history:

- Show insufficient-history state
- Do not fabricate data
- Do not include it in calculations requiring aligned history

Benchmarks count toward the 25 active-symbol cap.

---

## 21. Time Filters

Provide chart quick filters:

- 1 Month
- 3 Months
- 6 Months
- YTD
- 1 Year
- Since Purchase
- Max

Filters must update relevant charts without requiring a page refresh.

If the filtered window lacks sufficient data, show a clear insufficient-data state.

---

## 22. Charts

Use Apache ECharts.

Required MVP charts:

- Normalized portfolio vs. benchmark comparison
- Portfolio account-value growth chart
- Allocation chart
- Drawdown chart
- Monte Carlo confidence fan
- Monte Carlo percentile bands

Chart functionality:

- Series toggles
- Zoom
- Pan where compatible
- Reset zoom
- PNG export
- Responsive resizing
- Touch interaction

### 22.1 Mobile gesture rule

Swipeable tabs and chart pan/zoom can conflict on touch devices.

On mobile:

- Horizontal chart pan must be disabled inside horizontally swipeable tab containers, or
- Swipe-to-change-tab must be disabled while the user is interacting with a chart

The implementation must avoid gesture conflicts that make charts or tabs unusable.

---

## 23. Drawdown

Include:

- Maximum Drawdown metric
- Drawdown-over-time chart

Use a documented peak-to-trough methodology based on the Price-Return Performance Series.

---

## 24. Analytics Engine

Required calculated metrics:

- CAGR
- Alpha
- Beta
- Maximum Drawdown

All calculated analytics must use aligned OHLCV-derived return observations.

### 24.1 CAGR

Calculate from valid beginning value, ending value, and elapsed time.

Handle:

- Partial years
- Missing data
- Invalid zero or negative denominator cases

### 24.2 Alpha and Beta

Use a visible and configurable active benchmark where appropriate.

Use aligned return observations.

Do not calculate from mismatched trading dates.

### 24.3 Maximum Drawdown

The MVP headline Maximum Drawdown metric must be calculated from the Price-Return Performance Series, not from raw account value.

Raw account value can jump when the user adds new lots. A naive peak-to-trough calculation on raw dollar value can understate drawdowns because new contributions may appear as recoveries.

MVP rule:

- Headline drawdown: use the Price-Return Performance Series.
- Raw account-value drawdown: excluded from MVP unless implemented as a clearly labeled supplemental view.
- Any future account-value drawdown view must either adjust for contributions or explicitly label itself as unadjusted and not comparable to performance drawdown.

---

## 25. Monte Carlo Engine

### 25.1 MVP methods

MVP Monte Carlo methods:

1. Geometric Brownian Motion
2. Historical Bootstrap

Removed from MVP:

- Regime Switching
- Stochastic Volatility

These removed methods must not appear in MVP requirements or acceptance criteria.

### 25.2 Data basis

Monte Carlo must use normalized daily returns derived from validated local Stooq close history stored in IndexedDB.

If insufficient historical data exists, the app must show an insufficient-history warning rather than fabricating values.

### 25.3 Lookback

Use up to 756 valid trailing daily return observations where available.

A 756-return window requires 757 aligned closing prices.

If fewer observations are available, the app may allow the user to proceed only if it clearly labels the shorter lookback.

### 25.4 Paths

Run:

- 5,000 paths by default

Provide explicit lower path-count choices such as 1,000 and 2,500 for slower mobile devices. The app must not silently reduce the selected path count.

### 25.5 Projection horizon

Monte Carlo must use the global projection horizon.

### 25.6 Include/exclude controls

For each active holding, provide a Monte Carlo include/exclude toggle.

Default:

- Included

Benchmarks can be included or excluded from benchmark projection tables.

### 25.7 Correlation

Use correlated simulations where there is sufficient aligned data.

If the active symbol set is too large for acceptable performance, the app must allow the user to reduce the projection universe.

Handle singular or non-positive-definite covariance matrices using a documented stabilization method.

### 25.8 GBM parameter estimation

GBM must use aligned daily log returns derived from normalized Stooq close prices.

Default MVP estimation method:

- Daily drift: arithmetic mean of daily log returns over the available lookback window
- Daily volatility: sample standard deviation of daily log returns
- Correlation/covariance: sample covariance matrix of aligned daily log returns
- Simulation step: one trading day
- Projection year: 252 trading days

For a correlated multi-asset GBM run, simulate multivariate daily log returns using the estimated mean vector and covariance matrix. If covariance stabilization is required, disclose it in Diagnostics.

EWMA drift and volatility are excluded from MVP unless explicitly approved later.

### 25.9 Historical Bootstrap resampling method

Historical Bootstrap must resample aligned daily return vectors derived from normalized Stooq close prices.

Default MVP resampling method:

- Use daily arithmetic return vectors aligned by trading date across included assets
- Resample one-day return vectors with replacement
- Preserve same-day cross-asset dependence by resampling whole return vectors
- Compound sampled returns through the selected projection horizon
- Do not impose an external drift adjustment in MVP

Block bootstrap is deferred unless explicitly approved later.

### 25.10 Outputs

Required Monte Carlo outputs:

- P10
- P50 / Median
- P90
- Ending value distribution
- Expected annualized return
- Probability of loss
- Value at Risk
- Confidence fan
- Percentile bands

Benchmark-beating probability may only be shown when the benchmark has sufficient aligned history.

### 25.11 Reproducibility

Provide:

- Fixed random seed option
- Randomly generated seed option

A fixed seed must reproduce results when inputs are unchanged.

### 25.12 Mobile execution

On the iPhone:

- Run simulations in a Web Worker
- Keep the UI responsive
- Show progress
- Allow cancellation
- Handle app suspension cleanly
- Record elapsed time and failures in Diagnostics
- Benchmark 1-, 5-, and 10-year horizons with 1,000, 2,500, and 5,000 paths

## 26. Global Projection Horizon

Include one global Projection Horizon control.

Allow:

- Minimum: 1 year
- Maximum: 10 years
- Increment: 1 year

Valid values:

- 1
- 2
- 3
- 4
- 5
- 6
- 7
- 8
- 9
- 10 years

Use:

- 252 trading days per projection year

The selected horizon must apply to every forward-looking analysis, including:

- Monte Carlo simulations
- Projection charts
- Confidence bands
- Percentile tables
- Summary cards
- Exported reports

The control must:

- Be prominent in the dashboard header
- Also be available in Settings
- Persist locally
- Trigger recalculation without page refresh

---

## 27. Projection Date Display

Display both:

- Selected projection horizon
- Calculated projected ending calendar date

Example:

- `5 Years`
- `Projected Through: May 15, 2031`

Display projection horizon and date context on:

- Forward-looking charts
- Monte Carlo visualizations
- Relevant summary cards
- CSV exports
- Print-to-PDF reports

The UI must distinguish between:

- Statistical trading-day horizon used in calculations
- Human-readable projected calendar end date

---

## 28. Scenario Analysis

Scenario analysis is deferred from MVP unless explicitly approved later.

The MVP may include only simple projection summaries generated by GBM and Historical Bootstrap.

Removed from MVP:

- 2008-style shock
- COVID-style shock
- Bull deterministic scenario
- Bear deterministic scenario
- Custom deterministic scenario

---

## 29. Web Workers and Asynchronous Processing

Run computationally expensive simulations asynchronously using Web Workers.

Requirements:

- Keep the UI responsive
- Do not block the main thread
- Show simulation progress
- Allow cancellation
- Permit continued dashboard interaction while simulation runs

Progress indicator should show where feasible:

- Simulation method
- Progress percentage
- Elapsed time
- Estimated time remaining

If ETA cannot be estimated reliably, omit it.

### 29.1 Simulation state machine

The app must define explicit behavior when simulation inputs change during a running simulation.

Required behavior:

- Mark running simulation as stale when inputs change
- Allow user to cancel and restart, or automatically cancel and restart after confirmation
- Prevent stale simulation results from being displayed as current
- Record stale/cancelled simulation status in Diagnostics

Inputs that can invalidate a running simulation include:

- Holding edits
- Lot edits
- Benchmark changes
- Active-symbol changes
- Projection horizon changes
- Include/exclude toggle changes
- Monte Carlo method changes
- Historical data refresh

---

## 30. User Interface

### 30.1 Themes

Support:

- Dark mode
- Light mode
- Toggle between modes

### 30.2 Customization

Support:

- Accent color customization
- Chart palette customization
- Font-size scaling

### 30.3 Mobile

On the iPhone 13 mini:

- Portrait mode must be fully functional
- Landscape mode should provide wider chart viewing
- Use compact summary cards
- Use one principal chart or table per mobile panel
- Avoid hover-only interactions
- Use touch-sized controls
- Respect safe-area insets in Home Screen mode
- Keep projection controls outside chart gesture regions
- Allow tables to scroll horizontally without moving the entire page
- Re-render charts after orientation changes
- Avoid rendering all historical rows into the DOM

### 30.4 Tables

Tables require:

- Sortable columns
- Mobile horizontal scrolling where necessary

Table search and filtering are deferred unless the holdings/benchmarks UX proves insufficient.

## 31. Accessibility

Include:

- Keyboard navigation
- ARIA labels
- Visible focus states
- High-contrast compatibility
- Color-blind-safe chart palettes
- Scalable fonts
- Semantic HTML where practical

Do not rely on color alone to communicate financial gain/loss or chart identity.

---

## 32. Settings

Include a Settings area containing:

- Finnhub API key management
- Theme selection
- Accent color
- Chart palette
- Font scaling
- Simulation defaults
- Projection horizon
- Benchmark management
- Active-symbol management
- Historical dataset status
- Manual Stooq import
- Historical series replacement
- Historical cache management
- Export settings
- Configuration backup export
- Full portable backup export
- Backup restore
- Clear Local Storage control
- Clear IndexedDB control
- Storage persistence request/status
- Application version
- Historical dataset version
- Last successful quote synchronization
- Last successful historical import
- Last full backup and restore

Destructive actions must require confirmation.

## 33. About and Diagnostics

Include Diagnostics showing:

- Application version
- Current browser origin
- Local Mac host reachability when detectable
- Last quote refresh
- Last successful historical import
- API status
- Approximate Finnhub request budget
- Rate-limit warnings
- Browser compatibility information
- Local Storage availability
- IndexedDB availability
- Storage persistence status
- Storage usage and quota estimate
- Cache status
- Historical source: Stooq
- Price adjustment: split-adjusted
- Dividend adjustment: none
- Per-symbol first and last dates
- Per-symbol observation counts
- Common aligned observation count
- Dataset version
- Source-file hashes
- Import mode and timestamp
- Historical quality flags
- Failed requests
- Import errors
- API errors
- Browser capability warnings
- Simulation warnings
- Stale data warnings
- Derived-data invalidation status

Do not expose the Finnhub API key in logs or diagnostics.

## 34. Export and Backup

### 34.1 CSV export

Support CSV export for:

- Holdings
- Lots
- Portfolio analytics
- Historical comparison data where available
- Simulation summaries
- Benchmark results
- Projection horizon
- Projection end date

### 34.2 Print-to-PDF report

MVP report export shall use a print-optimized report page and the browser’s native Print to PDF function.

The printable report should include:

- Charts
- Tables
- Current prices
- Portfolio analytics
- Monte Carlo outputs
- Projection horizon
- Projection end date
- Data freshness timestamps
- Stale-data warnings

Custom client-side PDF generation is deferred.

### 34.3 PNG export

Charts must support PNG export through ECharts-compatible functionality.

### 34.4 Configuration backup

Configuration backup should include:

- Holdings
- Lots
- Benchmarks
- Settings
- Active-symbol preferences
- Projection settings

### 34.5 Full portable backup

Full portable backup shall include:

- All configuration backup fields
- Normalized historical candles
- Historical dataset metadata
- Historical quality flags
- Historical import history
- Cached metadata where practical

The full backup is the supported Mac-to-iPhone transfer method.

Do not include the Finnhub API key unless the user explicitly opts in and receives a warning.

If a restored backup does not include an API key, the app must prompt the user to enter one before live refresh. The restored portfolio and history must remain usable offline or in cached mode.

### 34.6 Backup integrity

Backup files must include:

- Backup schema version
- Application version
- Export timestamp
- Dataset version
- Record counts
- Integrity checksum where practical

Restore must validate the entire file before changing stored data. Failed restore must not leave partial state.

## 35. Progressive Web App and Home-Wi-Fi Access

Build the application as an installable PWA where supported.

Include:

- Web app manifest
- Service worker
- Application icons
- Offline shell caching
- Static asset caching
- Stable private HTTPS origin for final iPhone use

Cache:

- HTML
- CSS
- JavaScript
- Fonts
- Static assets
- Vendored ECharts
- Private bundled Stooq seed files or the resources required to reinstall them

When offline or when the Mac host is unavailable after installation, the iPhone application should:

- Continue to load from its service-worker cache
- Display saved portfolio configuration
- Display IndexedDB historical data
- Display cached quote data
- Run historical analytics and Monte Carlo
- Clearly indicate that application updates are unavailable
- Clearly indicate when live internet quotes are unavailable

The Mac or local server is required for:

- Initial installation
- Application updates
- Reinstallation after local storage loss
- Access to uncached static assets

Use explicit cache versioning so updates can invalidate stale static caches.

The project must not open router ports or expose the local server to the public internet.

## 36. Input Validation and Data Integrity

Validate before calculation or storage.

Handle at minimum:

- Invalid ticker symbols
- Duplicate ticker entries
- Multiple lots for the same ticker
- Invalid acquisition dates
- Future acquisition dates
- Zero shares
- Negative shares
- Invalid prices
- Zero or negative purchase prices
- Missing benchmark data
- Missing quote data
- Invalid API responses
- Insufficient historical data
- Misaligned trading dates
- Singular covariance matrices
- Non-positive-definite covariance matrices
- NaN propagation
- Infinity propagation
- Unsupported browser capabilities
- Storage quota issues
- IndexedDB failures
- Invalid Stooq headers
- Wrong historical frequency
- Mixed tickers in a single-symbol file
- Invalid historical dates
- Duplicate historical dates
- Unsorted historical rows
- Nonpositive OHLC values
- OHLC bound violations
- Negative or nonfinite volume
- Conflicting replacement data
- Partial import or restore failures
- Dataset version mismatch
- File-hash mismatch

Duplicate tickers are valid when they represent multiple lots under a single holding.

A ticker may exist both as a holding and a benchmark only if the data model keeps those records separate and the UI makes the distinction clear.

Historical import and restore operations must validate completely before committing changes.

## 37. Numerical Precision and Formatting

Use full JavaScript `Number` precision internally.

Round only for display.

Default presentation:

- Prices: 2 decimals, or security precision where appropriate
- Shares: up to 6 decimals
- Percentages: 2 decimals
- CAGR: 2 decimals
- Alpha: 3 decimals
- Beta: 3 decimals

Do not repeatedly round intermediate values.

---

## 38. Dates and Time Zones

Use exchange trading-calendar logic where required.

For U.S. market data:

- Treat market session dates in Eastern Time
- Display user-facing timestamps in the user's local time zone

Prevent off-by-one-day errors caused by parsing date-only strings as UTC timestamps.

---

## 39. Performance Targets

Target:

- Initial dashboard render under 2 seconds after required local data is available, where practical
- Seed-history installation and full restore must show progress and remain responsive
- Monte Carlo completion within approximately 5 seconds for the eight-symbol seed case on the primary Mac where practical

The 5-second target does not apply to the iPhone or to the full 25-symbol cap.

For 13 to 25 active symbols, the MVP does not guarantee a fixed completion time. It must remain non-blocking, show progress, allow cancellation, and allow the user to reduce active projection symbols or paths.

Phase 7 and Phase 10 testing must benchmark:

- Approximately 8, 13, and 25 active symbols on the Mac
- 1-, 5-, and 10-year horizons on the iPhone
- 1,000, 2,500, and 5,000 paths on the iPhone

These are targets, not permission to silently reduce statistical correctness or path count.

## 40. Application Architecture

Use modular ES2020 architecture.

Separate logical components for:

- Data Services
- Historical Dataset Manager
- Request Queue
- Portfolio Engine
- Analytics Engine
- Monte Carlo Engine
- Chart Manager
- Persistence Manager
- UI Manager
- Export Manager
- Settings Manager
- Diagnostics Manager
- Utility Functions

Business logic must remain independent from rendering logic.

### 40.1 Data Services

Responsible for:

- Finnhub API access
- Quote retrieval
- Symbol lookup
- Company metadata retrieval
- Market status retrieval
- Basic metrics retrieval
- Risk-free-rate retrieval
- Request validation
- Cache fallback
- Error normalization

### 40.2 Historical Dataset Manager

Responsible for:

- Stooq file parsing
- Historical validation
- Symbol normalization
- Provenance metadata
- Dataset manifests and hashes
- Private seed installation
- Manual import preview
- Full-series replacement
- Historical quality flags
- IndexedDB persistence coordination
- Derived-data invalidation
- Aligned historical-series retrieval

### 40.3 Request Queue

Responsible for:

- Finnhub rate-limit enforcement
- Request prioritization
- Throttling
- Backoff
- Retry logic
- API budget status

### 40.4 Portfolio Engine

Responsible for:

- Holdings
- Lots
- Cost basis
- Position values
- Portfolio values
- Buy-and-hold calculations
- Market-value weights

### 40.5 Analytics Engine

Responsible for:

- Price-return calculations
- CAGR
- Alpha
- Beta
- Drawdown
- Normalization
- Date alignment

### 40.6 Monte Carlo Engine

Responsible for:

- GBM
- Historical Bootstrap
- Correlated random generation
- Covariance calculation
- Cholesky or fallback stabilization
- Percentiles
- Risk statistics
- GBM parameter estimation
- Historical Bootstrap vector resampling

### 40.7 Chart Manager

Responsible for:

- ECharts initialization
- Series updates
- Theme updates
- Responsive resizing
- PNG export
- Chart lifecycle cleanup
- Touch-gesture conflict management
- Orientation-change handling

### 40.8 Persistence Manager

Responsible for:

- Local Storage schema
- IndexedDB schema
- Versioning
- Migration
- Settings persistence
- Portfolio persistence
- Quote cache persistence
- Historical candle persistence
- Transactional import and restore

### 40.9 UI Manager

Responsible for:

- Setup wizard
- Tabs
- Forms
- Modals
- Historical import workflow
- Backup and restore workflow
- Mobile behavior
- User feedback
- Feature availability states

### 40.10 Export Manager

Responsible for:

- CSV export
- Print report page
- PNG export integration
- Configuration backup
- Full portable backup
- Backup restore

### 40.11 Diagnostics Manager

Responsible for:

- Error records
- API status
- Cache status
- Storage status
- Historical dataset status
- Import diagnostics
- Capability checks
- Simulation warnings
- Stale data warnings

## 41. Public Calculation Interfaces

Every major calculation must expose a documented public function or stable interface.

At minimum:

- Account value
- Position value
- Portfolio value
- Price return
- CAGR
- Alpha
- Beta
- Maximum Drawdown
- Normalization
- GBM Monte Carlo
- Historical Bootstrap Monte Carlo
- Export routines

---

## 42. Parameter-Driven Design

The application must be configurable through state and UI, not source-code changes.

Configurable items include:

- Holdings
- Lots
- Benchmarks
- Active-symbol states
- Simulation parameters
- Projection horizon
- Analytics settings
- Display preferences

---

## 43. Security and Privacy

Because the application is client-side and privately hosted:

- Do not send portfolio data to an application backend
- Do not upload selected historical files
- Do not transmit normalized candles or calculated return series to the Mac host after the page is loaded
- Do not log API keys
- Do not include API keys in exported reports
- Do not expose API keys in diagnostics
- Minimize API-key exposure in the UI
- Document that Local Storage is not encrypted secure storage
- Sanitize user-entered text before rendering
- Avoid unsafe `innerHTML` use with untrusted values
- Use trusted local HTTPS for the final iPhone origin
- Restrict access to the trusted home Wi-Fi
- Do not configure router port forwarding
- Do not expose the application to the public internet

Finnhub and Treasury requests shall be made directly from the user’s browser. The Mac host must not act as an API-key proxy.

## 44. Error Handling

Provide clear user-facing errors for:

- Invalid API key
- API rate limit
- Network unavailable
- Quote unavailable
- Historical file missing
- Historical import invalid
- Historical replacement conflict
- Insufficient history
- Simulation failure
- Export failure
- Restore failure
- Storage quota failure
- IndexedDB failure
- Service worker failure
- Local Mac host unavailable
- Local certificate invalid
- Application update unavailable

Errors must:

- State what failed
- State whether cached data is being used
- State whether the failure affects live data, local history, or application updates
- Avoid exposing secrets
- Be recorded in Diagnostics where appropriate

## 45. Browser Capability Checks

At startup, detect required capabilities including:

- Local Storage
- IndexedDB
- Service Workers
- Web Workers
- Fetch
- Promise
- ECharts availability
- Blob/download support
- File input support
- Required graphics capabilities
- Storage estimate support
- Persistent-storage support
- Online/offline state
- Home Screen display mode where detectable

Show graceful warnings for missing capabilities.

## 46. Application Versioning

Display an application version.

Use versioning for:

- Application releases
- Local Storage schema migrations
- IndexedDB schema migrations
- Service-worker cache invalidation

Do not assume old stored data always matches the current schema.

---

## 47. Testing Requirements

### 47.1 Functional tests

Test:

- First launch
- Setup wizard
- API key save/update
- Add/edit/delete holdings
- Add/edit/delete lots
- Multiple lots per ticker
- Add/delete/re-add built-in benchmarks
- Add/delete user benchmarks
- Activate/deactivate symbols
- 25 active-symbol cap
- Symbol-management search/filter
- Manual quote refresh
- Metadata cache TTL behavior
- Private seed-history installation
- Manual Stooq file import
- Full-series historical replacement
- Import conflict preview
- Historical quality warnings
- Corporate-action manual adjustment notice/workflow
- Offline startup
- Mac host unavailable after installation
- Cached fallback
- Theme persistence
- Projection horizon persistence
- Monte Carlo include/exclude
- Simulation cancellation
- CSV export
- Print-to-PDF report
- PNG chart export
- Configuration backup
- Full portable backup
- Full restore on iPhone

### 47.2 Data-source tests

Test Finnhub with a temporary runtime development key, then rotate the key before release.

Verify:

- `/quote`
- `/search`
- `/stock/profile2`
- `/stock/market-status`
- `/stock/market-holiday`
- `/stock/metric`

Do not require `/stock/candle`.

Required live-data test symbols:

- DCO
- VTV
- ONEQ
- SPY
- IWM
- AVUV
- AVDV
- PSCH

### 47.3 Historical-data tests

Use private production files for local acceptance testing and deterministic synthetic fixtures for parser unit tests.

Verify:

- Exact Stooq header parsing
- Daily frequency enforcement
- Ticker normalization
- Date conversion without UTC off-by-one errors
- Numeric parsing
- Duplicate-date rejection
- Unsorted-row handling
- OHLC bound validation
- Nonfinite-value rejection
- Full-series replacement
- Transaction rollback
- Manifest and hash checks
- Dataset-version upgrade
- Per-symbol date range and observation count
- Eight-symbol alignment
- Extraction of 756 daily return vectors
- Quality-flag generation
- Derived-data invalidation

### 47.4 Calculation tests

Use deterministic fixtures to test:

- Cost basis
- Account value
- Portfolio weights
- Price-return normalization
- CAGR
- Alpha
- Beta
- Drawdown
- Percentiles
- VaR
- Covariance/correlation behavior
- Fixed-seed reproducibility
- GBM drift/volatility estimation
- Historical Bootstrap vector resampling

### 47.5 Compatibility tests

Test on:

- Firefox on macOS Big Sur 11.7.11
- Safari on iPhone 13 mini, iOS 26.5
- Safari Home Screen web-app mode
- Firefox iOS where practical

### 47.6 Home-Wi-Fi and offline tests

Test:

- Stable local HTTPS origin
- Trusted certificate on iPhone
- Same-Wi-Fi access
- No router port forwarding
- Home Screen installation
- Offline relaunch
- Mac server unavailable after caching
- Application update after cache-version change
- Storage persistence request and status
- Recovery after local data loss

### 47.7 Responsive and mobile tests

Test:

- iPhone 13 mini portrait
- iPhone 13 mini landscape
- Tablet
- Desktop
- Touch interactions
- Chart gesture conflicts
- Horizontal table scrolling
- Orientation changes
- Monte Carlo progress and cancellation

## 48. Acceptance Criteria

The MVP is accepted only when:

1. Finnhub free-tier endpoints provide live quotes and market context without requiring premium datasets.
2. Historical analytics use private Stooq daily files rather than Finnhub historical candles.
3. Historical prices are identified as split-adjusted and dividend-unadjusted.
4. The application does not present OHLCV-based returns as exact total return.
5. The application respects the 25-symbol active limit.
6. The request queue enforces the approved Finnhub limits.
7. The eight private seed symbols install and are queryable from IndexedDB.
8. The application can extract 756 aligned daily return vectors for the seed universe.
9. Manual historical imports support validated full-series replacement.
10. Failed imports do not leave partial historical data.
11. The application works in quote-only mode when a symbol lacks local history.
12. The application supports GBM and Historical Bootstrap Monte Carlo only.
13. The application excludes dividend-income calculations and news from MVP.
14. The application warns users about local-only storage and possible data loss.
15. Configuration backup and full portable backup both work.
16. A full backup can initialize or update the iPhone without automatic synchronization.
17. The API key is excluded from backup by default.
18. Holdings and acquisition lots support add/edit/delete.
19. Built-in benchmarks can be added, deleted, re-added, activated, and deactivated.
20. Deleting a benchmark does not delete a same-ticker holding.
21. Normalized benchmark comparison works when aligned local history exists.
22. Historical, API, offline, local-host, import, and storage states are clearly distinguished.
23. Simulations run without freezing the main UI and can be cancelled.
24. Required charts render on desktop and iPhone 13 mini layouts.
25. Dark/light themes work and persist.
26. CSV, PNG, and print-to-PDF exports work.
27. The PWA loads offline after a successful visit.
28. The iPhone can launch the installed app when the Mac server is unavailable, using cached assets and local IndexedDB data.
29. Diagnostics exposes failures, dataset status, and storage status without exposing secrets.
30. The application runs on Firefox/macOS Big Sur and Safari/iPhone 13 mini iOS 26.5.
31. The code remains parameter-driven and modular.
32. No application backend, cloud sync, public hosting, remote access, or router port forwarding is required.
33. Corporate actions are not auto-applied; manual lot-adjustment workflows remain available.
34. Company profile, peer, and metric caches use explicit TTLs.
35. GBM and Historical Bootstrap methods are documented and testable.
36. Backup reminders follow the defined trigger rule.
37. The final iPhone origin uses trusted local HTTPS and remains stable.

## 49. Explicit Non-Goals

Do not add to MVP:

- Public hosting
- Public distribution of the private Stooq files
- Remote internet access to the dashboard
- Router port forwarding
- VPN-based remote access
- Cloud synchronization
- Automatic cross-device synchronization
- Application backend
- Brokerage account connectivity
- Automated trading
- Order execution
- Tax filing
- Tax optimization
- Realized-gain tax-lot disposal accounting
- User accounts
- Continuous quote polling
- Automatic high-frequency polling
- WebSocket streaming
- Automatic corporate-action adjustment
- Raw unadjusted account-value drawdown as a headline metric
- Cryptocurrency support
- Options analytics
- Margin analytics
- True total-return analytics
- Dividend reinvestment
- Dividend-income projection
- Company news
- Market news
- Regime Switching Monte Carlo
- Stochastic Volatility Monte Carlo
- Standardized financial statements
- SEC filings
- Ownership data
- Company executives
- Custom client-side PDF generation library

## 50. Future Version Candidates

Potential future features, only if explicitly approved later:

- Dividend-aware total return using a suitable data source
- Income projection
- Company news dashboard
- Market news dashboard
- Sector and peer analytics
- Regime Switching Monte Carlo
- Stochastic Volatility Monte Carlo
- Larger-symbol portfolio mode
- Cloud sync
- Paid data-provider support
- Brokerage import
- Advanced table filtering/search
- Custom PDF report builder
- Optional WebSocket trade updates, with separate quota/lifecycle management
- Automatic corporate-action detection and lot adjustment using a reliable corporate-action data source
- Block bootstrap Monte Carlo
- EWMA drift/volatility overlays
- Build-system optimization and tree-shaking

---

## 51. Build Sequence

Implement in this order.

### Phase 0: Live endpoint verification

- Verify approved Finnhub live-data endpoints with a temporary runtime key
- Confirm quote-only operation
- Confirm rate-limit behavior
- Record response shapes and failure modes
- Do not require `/stock/candle`

### Phase 1: Application foundation

- Application shell
- PWA manifest
- Service worker
- Theme
- Settings
- Local Storage
- IndexedDB
- Setup wizard
- Capability checks
- Local-data-loss warnings
- Backup/restore shell

### Phase 1D: Private home-Wi-Fi access

- Establish stable local hostname or reserved IP
- Configure static local HTTPS
- Configure trusted iPhone certificate
- Configure Mac firewall for home-network access only
- Verify no router port forwarding
- Test Safari and Home Screen installation

### Phase 2A: Request queue

- Finnhub request queue
- Rate limits
- Priorities
- Retry and backoff
- Diagnostics hooks

### Phase 2B: Stooq parser and validation

- Source parser
- Header and frequency validation
- Date and numeric parsing
- Ticker normalization
- OHLCV validation
- Quality flags
- Synthetic fixtures and private acceptance tests

### Phase 2C: Private seed installation

- Dataset manifest
- File hashes
- IndexedDB installation
- Dataset versioning
- Transactional writes
- Skip unchanged files

### Phase 2D: Manual historical updates

- Multi-file import
- Preview
- Full-series replacement
- Conflict reporting
- Rollback
- Derived-data invalidation

### Phase 2E: Historical-data service and diagnostics

- Series queries
- Date-range queries
- Alignment
- 756-return extraction
- Freshness states
- Diagnostics

### Phase 2F: Finnhub live-data services

- Authentication
- Quote retrieval
- Symbol lookup
- Company metadata
- Market status and holidays
- Basic metrics
- Risk-free-rate retrieval
- Cache fallback
- Error normalization

### Phase 3: Portfolio engine

- Holdings
- Lots
- Cost basis
- Account value
- Position values
- Floating weights
- Validation
- Portfolio performance series
- Manual corporate-action adjustment workflow

### Phase 4: Benchmark engine

- Built-in benchmark seeding
- Add/delete/re-add benchmarks
- Activate/deactivate benchmarks
- User-added benchmarks
- Benchmark normalization
- Date alignment
- 25 active-symbol cap enforcement

### Phase 5: Charting

- ECharts integration
- Comparison chart
- Account-value growth chart
- Allocation
- Drawdown
- Responsive behavior
- Mobile gesture handling
- PNG export

### Phase 6: Analytics

- CAGR
- Alpha
- Beta
- Maximum Drawdown
- Risk-free-rate integration
- Split-adjusted, dividend-unadjusted labeling

### Phase 7: Monte Carlo

- Web Worker infrastructure
- Seeded PRNG
- GBM
- Historical Bootstrap
- Correlation
- Covariance handling
- Percentiles
- Risk outputs
- Progress
- Cancellation
- Stale-run state machine
- Mac and iPhone performance tests

### Phase 8: Projection horizon

- Global 1–10 year horizon
- Projection dates
- Confidence fan
- Percentile bands
- Projection metadata

### Phase 9A: Full portable backup and restore

- Historical data included
- Transactional restore
- Integrity validation
- Mac-to-iPhone workflow

### Phase 9B: Export and reporting

- CSV
- Print report page
- PNG chart export integration
- Configuration backup
- Freshness metadata

### Phase 10: Hardening

- Diagnostics
- Accessibility
- Performance optimization
- Offline tests
- Home-Wi-Fi tests
- iPhone 13 mini tests
- Compatibility tests
- Full requirements audit

## 52. Development Process Requirement

Do not attempt to implement the full application in one unreviewed generation.

For each phase:

1. Review relevant requirements.
2. Define interfaces.
3. Implement the smallest working increment.
4. Run it.
5. Fix runtime errors.
6. Test calculations.
7. Audit against requirements.
8. Save a working backup/version.
9. Continue to the next phase.

The requirements in this document are authoritative unless explicitly amended by the project owner.

---

## 53. Required Transparency in the App

The application must clearly communicate these limitations:

- Finnhub free-tier data is rate-limited.
- Stooq historical prices are split-adjusted and dividend-unadjusted.
- OHLCV-based returns are price-return approximations, not exact total return.
- Dividend history and dividend-income calculations are excluded from MVP.
- Historical data may be missing, stale, or insufficient for some symbols.
- New symbols require compatible local history imports for historical analytics.
- Mac and iPhone browser storage are separate.
- No automatic cross-device synchronization exists.
- Browser Local Storage and IndexedDB are not cloud backup.
- iOS may evict local site data.
- The Mac host is required for initial installation and application updates, but not for cached offline operation after installation.
- Live quotes require internet access even when the Mac host is available.
- Monte Carlo results are probabilistic model outputs, not guaranteed forecasts.
- Historical drift, volatility, and correlations may not persist.
- The dashboard is intended only for private use on the trusted home Wi-Fi.

## 54. Final MVP Product Definition

The completed MVP is a private, customizable, parameter-driven retirement portfolio dashboard and installable PWA that:

- Is hosted from the owner’s Mac on the trusted home Wi-Fi
- Is accessible on Firefox desktop and Safari on an iPhone 13 mini
- Uses Finnhub free-tier endpoints for live quote snapshots and market context
- Uses private Stooq files for split-adjusted, dividend-unadjusted daily history
- Supports manual full-series Stooq replacement imports
- Tracks editable multi-lot U.S. stock and ETF holdings
- Provides price-return approximation analytics
- Compares portfolio performance against configurable benchmarks
- Enforces a 25 active-symbol cap
- Runs GBM and Historical Bootstrap projections
- Applies one global 1–10 year projection horizon
- Supports offline cached operation after installation
- Persists configuration and historical data locally on each device
- Warns about local-data-loss risk
- Uses full portable backup and restore for Mac-to-iPhone transfer
- Exports CSV, PNG chart images, and print-to-PDF reports
- Requires no application backend, cloud sync, public hosting, remote access, or router port forwarding
- Maintains modular separation between data, calculations, persistence, rendering, exports, and diagnostics

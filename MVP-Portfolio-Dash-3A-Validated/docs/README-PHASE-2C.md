# Phase 2C: Private Stooq Seed Installation

Authoritative source: `requirements.md`, Version 2.2.

## Included files

```text
data/historical/manifest.json
data/historical/seed/avdv.us.txt
data/historical/seed/avuv.us.txt
data/historical/seed/dco.us.txt
data/historical/seed/iwm.us.txt
data/historical/seed/oneq.us.txt
data/historical/seed/psch.us.txt
data/historical/seed/spy.us.txt
data/historical/seed/vtv.us.txt
js/data/historical-dataset-manager.js
js/data/historical-file-parser.js
js/data/historical-import-errors.js
js/data/historical-normalizer.js
js/data/historical-validator.js
js/persistence/schema.js
js/persistence/indexed-db.js
tests/historical-data-tests.html
```

The four Phase 2B parser files are included so the Phase 2C folder is runnable as a self-contained overlay. They are unchanged Phase 2B dependencies.

## Dataset

- Dataset ID: `stooq-private-seed`
- Dataset version: `2026-07-09`
- Symbols: AVDV, AVUV, DCO, IWM, ONEQ, PSCH, SPY, VTV
- Total normalized candles: 34,122
- Source: Stooq
- Frequency: daily
- Prices: split-adjusted
- Dividends: not adjusted
- Candle key: `[symbol, date]`

## Installation behavior

1. The manager loads `data/historical/manifest.json`.
2. It compares each symbol's installed dataset version, dataset hash, source-file hash, counts, dates, source, and adjustment metadata with IndexedDB.
3. Current files are skipped without fetching or parsing their source text.
4. Missing or changed files are fetched, checked against their SHA-256 and byte length, parsed, validated, and normalized.
5. Each symbol is replaced in one IndexedDB transaction covering its candles, symbol manifest, import batch, and quality flags.
6. A failed transaction leaves the previously stored symbol series unchanged.
7. The dataset-level status record is updated after each installation attempt.

## Integration

Copy the contents of this folder into the project root, preserving paths. Replace the existing `js/persistence/schema.js`, `js/persistence/indexed-db.js`, and `tests/historical-data-tests.html` with these versions. Do not rename the seed files or change their contents unless the manifest is regenerated with new hashes and metadata.

Serve from the project root. Do not open the test page directly from Finder because ES modules and fetch require an HTTP or HTTPS origin.

```text
cd ~/Desktop/MVP-Portfolio-Dash
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000/tests/historical-data-tests.html
```

## Manual acceptance tests

1. Press **Run synthetic tests**. Expected: `9/9 passed; 0 failed`.
2. Press **Install or verify private eight-symbol seed**. Progress must identify the active symbol and update record counts while each symbol transaction is writing.
3. Confirm the result shows:
   - `current: true`
   - `expectedFileCount: 8`
   - `currentFileCount: 8`
   - `expectedRecordCount: 34122`
   - `installedRecordCount: 34122`
   - no failures
4. Press the install button again. Expected:
   - `imported` is empty
   - `skipped` contains all eight symbols
   - progress states that no source files were parsed
5. Reload the page and press **Check private seed status**. Expected: the dataset remains current from IndexedDB without a reinstall.
6. Open Firefox Developer Tools, then Storage, Indexed DB, `mvpPortfolioDashboard`:
   - `historicalCandles` has key path `[symbol, date]`
   - `historicalDatasetManifests` contains eight `symbol:` records and one `dataset:` record
   - symbol manifests contain dataset version, dataset hash, source-file hash, source, frequency, adjustment metadata, count, first date, last date, and installed time
   - `historicalImportBatches` contains one completed batch per imported symbol
7. To test rollback with synthetic data, rerun the automatic tests. The rollback test submits an invalid compound key after a valid record and verifies the original series and manifest remain intact.
8. To test a real update later, replace a seed file only together with a regenerated manifest. A version or hash change must import the affected symbol; unchanged symbols must skip.

## Storage caution

The Mac and iPhone use independent browser storage. Clearing site data, changing the protocol/host/port origin, or browser eviction can remove IndexedDB history. Keep full portable backups after later backup/restore support is built.

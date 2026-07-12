# Phase 2D Integration

Copy these files into the existing project, preserving paths:

- `js/data/historical-import-service.js`
- `js/ui/historical-import-dialog.js`
- `js/ui/historical-import-preview.js`
- `tests/historical-data-tests.html`

The service imports the existing Phase 2B `parseAndNormalizeHistoricalFile` function. It does not duplicate parser or validator logic.

## Phase 2C storage adapter contract

Pass a storage adapter to `createHistoricalImportService({ storage })`.

Required read methods:

- `getHistoricalSeries(symbol)` or `getSeries(symbol)`
- `getHistoricalMetadata(symbol)` or `getDatasetMetadata(symbol)`; optional

Required transaction method:

- `runHistoricalSymbolTransaction(symbol, callback)` or `runSymbolTransaction(symbol, callback)`

The callback receives a transaction object with all of these operations. Alias names shown after `or` are also accepted:

- `replaceHistoricalSeries(records)` or `replaceSeries(records)`
- `appendHistoricalRecords(records)` or `appendSeries(records)`
- `putHistoricalMetadata(metadata)` or `putDatasetMetadata(metadata)`
- `addHistoricalImportHistory(entry)` or `addImportHistory(entry)`
- `addDiagnostic(entry)`
- `putDerivedInvalidation(entry)` or `invalidateDerived(entry)`

Required audit method outside the symbol transaction:

- `recordHistoricalImportAttempt(entry)`

That method should persist safe validation-failure, unchanged-import, append-conflict, and transaction-failure records to the historical import audit/Diagnostics stores. It must not store complete source-file contents.

The Phase 2C transaction wrapper must abort the entire symbol transaction if any callback operation rejects. The service assumes that guarantee and never performs delete-then-write operations outside the wrapper.

## Basic wiring

```js
import { createHistoricalImportService } from "./js/data/historical-import-service.js";
import { createHistoricalImportDialog } from "./js/ui/historical-import-dialog.js";

const importService = createHistoricalImportService({
  storage: historicalStorageAdapter,
  invalidationDispatcher: derivedDataCoordinator
});

const importDialog = createHistoricalImportDialog({
  service: importService,
  onCommitted(result) {
    // Refresh historical dataset status and Diagnostics views.
  }
});

document.querySelector("#open-historical-import").addEventListener("click", () => {
  importDialog.open();
});
```

The durable invalidation marker is written inside the symbol transaction. The optional dispatcher runs only after commit and can cancel or clear in-memory analytics and simulation results.

## Manual test

1. Start the static server from the project root with `python3 -m http.server 8000`.
2. Open `http://localhost:8000/tests/historical-data-tests.html` in Firefox.
3. Confirm all automated tests pass.
4. Open the manual import dialog and select multiple files.
5. Repeat file selection in Safari on iPhone using Files.
6. Confirm replacement is selected by default and requires explicit confirmation when the installed series would change.
7. Confirm append is unavailable for conflicting or unverifiable overlap.
8. Confirm a forced transaction failure leaves the prior symbol series unchanged.
9. After application integration, inspect IndexedDB and Diagnostics for the import history, source hash, metadata, and stale analytics/simulation marker.

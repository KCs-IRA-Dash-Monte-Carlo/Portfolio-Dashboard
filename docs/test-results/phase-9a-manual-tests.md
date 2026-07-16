# Phase 9A Manual Acceptance Tests

## Validation record

- Validation date: 2026-07-15
- Result: pending revalidation
- Manual tester: not yet recorded after repair
- Scope: full portable backup export, preview, validation, restore, rollback,
  credential exclusion, and Mac-to-iPhone transfer workflow

The prior manual result was withdrawn because the integrity and compatibility
repairs below require a fresh browser and device run. This document is now the
retest plan; it is not acceptance evidence.

## Required retest checks

1. Export a populated full backup and confirm configuration, normalized
   historical data, manifests, quality flags, import history, cached metadata,
   and diagnostics were represented.
2. Inspect backup contents and confirm the Finnhub key, authentication
   header, and credential-bearing request details were absent.
3. Confirm schema version, application version, export timestamp, source
   device label, section counts, and SHA-256 integrity metadata were present.
4. Restore into an empty profile and compare holdings, lots, settings,
   historical counts, symbols, date ranges, and adjustment/source metadata.
5. Corrupt the checksum, remove a required section, supply a future schema
   version, and injected malformed or duplicate records; each restore was
   rejected before mutation.
6. Force an IndexedDB transaction failure and a settings-write failure;
   previously stored state remained intact.
7. Confirm restore replaces the complete portable state without silently
   merging historical datasets, and marks analytics and simulations stale.
8. Transfer the backup through the Mac-to-iPhone workflow using AirDrop or
   Files, restore it on iPhone Firefox, and confirm the Finnhub key must be
   entered separately for the page session.
9. Confirm the session-key control supports edit and clear/reset, while reload
   requires re-entry.
10. Confirm success, rejection, and safe-failure statuses are explicit in the
    UI and backup/restore diagnostics contain metadata without credentials.

## Automated retest requirements

- Run the storage and UI browser test pages in Firefox after the repair.
- Run the applicable Node suites and `git diff --check` before recording a
  result.

## Remaining limitations

Phase 9A has no accepted manual or physical-device evidence after this repair.
Phase 10A still owns final offline, Home Screen, accessibility, and compatibility
hardening. No new product features were introduced by this repair.

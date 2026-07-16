# Phase 9A Manual Acceptance Tests

## Validation record

- Validation date: 2026-07-15
- Result: passed
- Manual tester: project owner
- Scope: full portable backup export, preview, validation, restore, rollback,
  credential exclusion, and Mac-to-iPhone transfer workflow

The owner confirmed the Phase 9A manual acceptance checks below against the
served application. This records Phase 9A validation evidence; the normal
branch, pull-request, accepted-tag, and GitHub synchronization workflow remains
governed by the roadmap.

## Passed checks

1. Exported a populated full backup and confirmed configuration, normalized
   historical data, manifests, quality flags, import history, cached metadata,
   and diagnostics were represented.
2. Inspected backup contents and confirmed the Finnhub key, authentication
   header, and credential-bearing request details were absent.
3. Confirmed schema version, application version, export timestamp, source
   device label, section counts, and SHA-256 integrity metadata were present.
4. Restored into an empty profile and compared holdings, lots, settings,
   historical counts, symbols, date ranges, and adjustment/source metadata.
5. Corrupted the checksum, removed a required section, supplied a future schema
   version, and injected malformed or duplicate records; each restore was
   rejected before mutation.
6. Forced an IndexedDB transaction failure and a settings-write failure;
   previously stored state remained intact.
7. Confirmed restore replaces the complete portable state without silently
   merging historical datasets, and marks analytics and simulations stale.
8. Transferred the backup through the Mac-to-iPhone workflow using AirDrop or
   Files, restored it on iPhone Firefox, and confirmed the Finnhub key must be
   entered separately for the page session.
9. Confirmed the restored-key session control supports edit and clear/reset,
   while reload requires re-entry.
10. Confirmed success, rejection, and safe-failure statuses are explicit in the
    UI and backup/restore diagnostics contain metadata without credentials.

## Automated complement

- `node --check` passed for the Phase 9A export, restore, and manager modules.
- `node tests/phase-2f-node-tests.mjs`: 19/19 passed.
- `node tests/phase-3b-node-tests.mjs`: passed.
- `git diff --check`: passed.
- Browser storage/UI pages remain the primary acceptance harness and should be
  rerun in Firefox after any Phase 9A repair.

## Remaining limitations

Physical-device evidence is limited to the owner’s completed manual run. Phase
10A still owns final offline, Home Screen, accessibility, and compatibility
hardening. No new product features were introduced by this validation record.

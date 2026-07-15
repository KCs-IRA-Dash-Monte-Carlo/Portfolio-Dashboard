# Phase 8A Manual Acceptance Tests

## Validation record

- Validation date: 2026-07-15
- Result: passed
- Manual tester: project owner
- Test origin: locally served application (`http://127.0.0.1:4173`), not `file://`
- Automated complement: `tests/monte-carlo-tests.html?autorun=1` passed 36/36 in Firefox.

The owner confirmed all seven checks below, including GBM and Historical
Bootstrap stale-state behavior, PNG context, and iPhone 13 mini portrait and
landscape usability. This records Phase 8A validation evidence; the normal
branch, pull-request, and accepted-tag workflow remains governed by the
roadmap.

Run these checks against the served application (not `file://`) after clearing no existing portfolio data unless persistence is the behavior under test.

1. In the dashboard header set the horizon to every integer from 1 through 10. Reload after each representative change and confirm the Settings control, dashboard card, projected-through date, and trading-day length agree.
2. In either control paste or type `0`, `11`, `1.5`, blank text, and `NaN`. Confirm a validation message appears, the persisted value does not change, and no simulation starts.
3. Set 1 year and confirm the UI says 252 statistical trading days; set 10 years and confirm 2,520. Confirm the calendar date is displayed separately as “Projected Through”.
4. Complete one GBM run and one Historical Bootstrap run. Change the horizon and confirm both visuals become stale and no automatic expensive run begins. Run or explicitly approve a new run and confirm both visuals refresh without a page reload.
5. Confirm the confidence fan has P10, P50, and P90 legend/toggle labels, a visible P10–P90 range, a methodology statement, and a keyboard-readable chart summary. Confirm percentile bands list P5 through P95 and have the same context.
6. Use each chart’s Export PNG action after a completed run. Confirm the image itself includes the horizon, projected-through date, and statistical trading-day length; confirm no credentials appear.
7. At iPhone 13 mini portrait (375 × 812 CSS px) and landscape (812 × 375 CSS px), verify header/Settings controls remain reachable, charts do not cause page-level horizontal overflow, controls meet the 44 px tap target expectation, and orientation changes do not create duplicate chart canvases.

# Phase 7C Manual Acceptance Test Record

## Snapshot

- Phase: 7C - Historical Bootstrap Monte Carlo
- Test date: 2026-07-15
- Acceptance evidence: owner-reported manual test pass

## Browser and device

- Browser: Mozilla Firefox on macOS
- Device: owner's MacBook
- Primary desktop target: macOS Big Sur 11.7.11
- Physical mobile target: iPhone 13 mini was not tested for this phase

## Manual results

| Checklist | Result | Notes |
|---|---:|---|
| Whole-vector dependence preservation | Passed | Labeled fixture confirmed that sampled asset pairs came from the same source day. |
| Fixed-seed reproducibility | Passed | Repeated seeded simulations produced matching results. |
| Sampling with replacement | Passed | Repeated source days were observed. |
| No drift adjustment | Passed | Bootstrap results used sampled returns without an external drift adjustment. |
| Invalid return handling | Passed | `-100%` and nonfinite return cases were handled visibly. |
| Distribution and risk statistics | Passed | P10/P50/P90 ordering and risk statistics were valid. |
| Cancellation | Passed | A cancelled bootstrap run returned to a clean state. |

## Known limitations

- Browser version and exact local test origin were not included in the owner’s pass report.
- This record does not claim physical iPhone, Home Screen, touch, orientation, or on-screen-keyboard validation.
- Live Finnhub/Treasury requests and GitHub Pages/offline behavior were outside this phase’s manual checklist.
- The manual results are recorded from the owner’s report; automated browser and audit evidence should be recorded separately if run.

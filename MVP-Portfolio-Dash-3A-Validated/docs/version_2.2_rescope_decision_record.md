# Version 2.2 Rescope Decision Record

## Decision

Preserve the existing project and replace Finnhub historical-candle retrieval with private local Stooq history.

## Approved architecture

- Finnhub free-tier endpoints: live quote snapshots and market context
- Stooq text files: split-adjusted, dividend-unadjusted daily OHLCV
- Historical updates: occasional manual full-series replacement in the same format
- Hosting: private static HTTPS from the owner’s Mac
- Access: Mac and iPhone 13 mini on the same trusted home Wi-Fi only
- Synchronization: manual full portable backup and restore
- Backend, public hosting, remote access, cloud sync, and router port forwarding: excluded

## Validated private seed dataset

- Symbols: DCO, VTV, ONEQ, SPY, IWM, AVUV, AVDV, PSCH
- Total rows: 34,122
- Common aligned dates: 1,703
- Common range: 2019-09-27 through 2026-07-09
- Monte Carlo capacity: 756 aligned daily return vectors

## Build impact

Preserve completed Phase 1 and Phase 2A work. Add Phase 1D and replace the historical portion of Phase 2 with Phases 2B–2E. Continue Finnhub live-data work as Phase 2F.

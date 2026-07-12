# Phase 0 Endpoint Verification

Project: MVP Portfolio Dashboard
Spec: requirements.md Version 2.1
Phase: 0
Status: Draft / In Progress / Complete
Tester:
Date:
Browser:
Machine:
Network:
Finnhub account tier: Free
API key handling: Runtime manual testing only. Real key is not stored in this document.

## Security Confirmation

* [ ] Real API key is not included in this document.
* [ ] Real API key is not committed to source control.
* [ ] Real API key is not saved in source files.
* [ ] Real API key is not logged.
* [ ] Real API key is not included in screenshots.
* [ ] Real API key is not included in exports.
* [ ] Real API key is not exposed in diagnostics.

All request URLs below must redact the token as `[REDACTED]`.

---

## Test Symbols

| Symbol | Role      | Notes             |
| ------ | --------- | ----------------- |
| DCO    | Holding   | Seed holding      |
| VTV    | Holding   | Seed holding      |
| ONEQ   | Holding   | Seed holding      |
| SPY    | Benchmark | Default benchmark |
| IWM    | Benchmark | Default benchmark |
| AVUV   | Benchmark | Default benchmark |
| AVDV   | Benchmark | Default benchmark |
| PSCH   | Benchmark | Default benchmark |

---

## Endpoint Summary

| Endpoint                | Status                             | Notes |
| ----------------------- | ---------------------------------- | ----- |
| `/quote`                | Not tested / Pass / Fail / Partial |       |
| `/stock/candle`         | Not tested / Pass / Fail / Partial |       |
| `/search`               | Not tested / Pass / Fail / Partial |       |
| `/stock/symbol`         | Not tested / Pass / Fail / Partial |       |
| `/stock/profile2`       | Not tested / Pass / Fail / Partial |       |
| `/stock/market-status`  | Not tested / Pass / Fail / Partial |       |
| `/stock/market-holiday` | Not tested / Pass / Fail / Partial |       |
| `/stock/metric`         | Not tested / Pass / Fail / Partial |       |

---

## `/quote` Results

Expected fields: `c`, `d`, `dp`, `h`, `l`, `o`, `pc`, `t`.

| Symbol | HTTP |  c | pc |  t | Pass? | Failure classification | Notes |
| ------ | ---: | -: | -: | -: | ----- | ---------------------- | ----- |
| DCO    |      |    |    |    |       |                        |       |
| VTV    |      |    |    |    |       |                        |       |
| ONEQ   |      |    |    |    |       |                        |       |
| SPY    |      |    |    |    |       |                        |       |
| IWM    |      |    |    |    |       |                        |       |
| AVUV   |      |    |    |    |       |                        |       |
| AVDV   |      |    |    |    |       |                        |       |
| PSCH   |      |    |    |    |       |                        |       |

Redacted sample URL:

```text
https://finnhub.io/api/v1/quote?symbol=SPY&token=[REDACTED]
```

---

## `/stock/candle` Results

Expected fields: `s`, `t`, `o`, `h`, `l`, `c`, `v`.

Test range:

```text
resolution = D
from = 1780272000
to = 1783555199
```

| Symbol | HTTP | s | Row count | Arrays same length? | Pass? | Failure classification | Notes |
| ------ | ---: | - | --------: | ------------------- | ----- | ---------------------- | ----- |
| DCO    |      |   |           |                     |       |                        |       |
| VTV    |      |   |           |                     |       |                        |       |
| ONEQ   |      |   |           |                     |       |                        |       |
| SPY    |      |   |           |                     |       |                        |       |
| IWM    |      |   |           |                     |       |                        |       |
| AVUV   |      |   |           |                     |       |                        |       |
| AVDV   |      |   |           |                     |       |                        |       |
| PSCH   |      |   |           |                     |       |                        |       |

Redacted sample URL:

```text
https://finnhub.io/api/v1/stock/candle?symbol=SPY&resolution=D&from=1780272000&to=1783555199&token=[REDACTED]
```

Quote-only fallback required?

```text
Yes / No
Affected symbols:
Affected modules:
Notes:
```

---

## `/search` Results

Expected fields: `count`, `result[]`, `description`, `displaySymbol`, `symbol`, `type`.

| Query | HTTP | Expected symbol found? | Type | Pass? | Notes |
| ----- | ---: | ---------------------- | ---- | ----- | ----- |
| DCO   |      |                        |      |       |       |
| VTV   |      |                        |      |       |       |
| ONEQ  |      |                        |      |       |       |
| SPY   |      |                        |      |       |       |
| IWM   |      |                        |      |       |       |
| AVUV  |      |                        |      |       |       |
| AVDV  |      |                        |      |       |       |
| PSCH  |      |                        |      |       |       |

---

## `/stock/symbol?exchange=US` Results

Expected response: JSON array of U.S. symbols.

| Check                | Result |
| -------------------- | ------ |
| HTTP status          |        |
| JSON array returned? |        |
| DCO found?           |        |
| VTV found?           |        |
| ONEQ found?          |        |
| SPY found?           |        |
| IWM found?           |        |
| AVUV found?          |        |
| AVDV found?          |        |
| PSCH found?          |        |
| Notes                |        |

---

## `/stock/profile2` Results

Expected fields where available: `country`, `currency`, `exchange`, `ipo`, `marketCapitalization`, `name`, `shareOutstanding`, `ticker`, `weburl`, `logo`, `finnhubIndustry`.

| Symbol | HTTP | Name/ticker present? | Exchange | Currency | Sparse ETF metadata? | Pass? | Notes |
| ------ | ---: | -------------------- | -------- | -------- | -------------------- | ----- | ----- |
| DCO    |      |                      |          |          |                      |       |       |
| VTV    |      |                      |          |          |                      |       |       |
| ONEQ   |      |                      |          |          |                      |       |       |
| SPY    |      |                      |          |          |                      |       |       |
| IWM    |      |                      |          |          |                      |       |       |
| AVUV   |      |                      |          |          |                      |       |       |
| AVDV   |      |                      |          |          |                      |       |       |
| PSCH   |      |                      |          |          |                      |       |       |

---

## `/stock/market-status?exchange=US` Results

Expected fields: `exchange`, `holiday`, `isOpen`, `session`, `timezone`, `t`.

| Field    | Value | Present? |
| -------- | ----- | -------- |
| exchange |       |          |
| holiday  |       |          |
| isOpen   |       |          |
| session  |       |          |
| timezone |       |          |
| t        |       |          |

Classification:

```text
Available / Temporary error / Rate-limited / Plan-entitlement unavailable / Error
```

Notes:

```text
```

---

## `/stock/market-holiday?exchange=US` Results

Expected fields: `data[]`, `atDate`, `eventName`, `tradingHour`.

| Check                       | Result |
| --------------------------- | ------ |
| HTTP status                 |        |
| Holiday data returned?      |        |
| Date field present?         |        |
| Event name present?         |        |
| Trading-hour field present? |        |
| Notes                       |        |

---

## `/stock/metric` Results

Expected fields: `metric`, selected basic metrics such as `52WeekHigh`, `52WeekLow`, `beta` where available, and possible `series`.

| Symbol | HTTP | metric object? | 52-week high/low? | beta? | Sparse ETF metrics? | Pass? | Notes |
| ------ | ---: | -------------- | ----------------- | ----- | ------------------- | ----- | ----- |
| DCO    |      |                |                   |       |                     |       |       |
| VTV    |      |                |                   |       |                     |       |       |
| ONEQ   |      |                |                   |       |                     |       |       |
| SPY    |      |                |                   |       |                     |       |       |
| IWM    |      |                |                   |       |                     |       |       |
| AVUV   |      |                |                   |       |                     |       |       |
| AVDV   |      |                |                   |       |                     |       |       |
| PSCH   |      |                |                   |       |                     |       |       |

Important limitation:

```text
Metrics from /stock/metric are informational company context only. They are not substitutes for calculated portfolio analytics.
```

---

## Failure Log

| Time | Endpoint | Symbol | HTTP | Redacted response summary | Classification | Retry result | Notes |
| ---- | -------- | ------ | ---: | ------------------------- | -------------- | ------------ | ----- |
|      |          |        |      |                           |                |              |       |

Allowed classifications:

```text
available
quote-only
insufficient-history
rate-limited
temporary-unavailable
invalid-key
plan-entitlement-unavailable
symbol-unavailable
schema-change
unknown-error
```

---

## Availability Decisions

### Quote-only fallback

```text
Required? Yes / No
Symbols:
Reason:
Modules disabled:
```

### Temporary unavailable

```text
Observed? Yes / No
Evidence:
Retry behavior:
Cache fallback needed:
```

### Rate limited

```text
Observed? Yes / No
Evidence:
Approximate request volume:
Backoff recommendation:
```

### Plan/entitlement unavailable

```text
Observed? Yes / No
Endpoint:
Symbols affected:
Evidence:
Repeated after retry? Yes / No
Decision:
```

### Invalid key

```text
Observed? Yes / No
Evidence:
Decision:
```

---

## Phase 0 Exit Checklist

* [ ] `/quote` tested for all required symbols.
* [ ] `/stock/candle` tested for all required symbols.
* [ ] `/search` tested for all required symbols.
* [ ] `/stock/symbol?exchange=US` tested.
* [ ] `/stock/profile2` tested for all required symbols.
* [ ] `/stock/market-status?exchange=US` tested.
* [ ] `/stock/market-holiday?exchange=US` tested.
* [ ] `/stock/metric` tested for all required symbols.
* [ ] Quote-only fallback behavior documented.
* [ ] Temporary error behavior documented.
* [ ] Rate-limit behavior documented.
* [ ] Plan/entitlement behavior documented.
* [ ] No real API key appears in this document.
* [ ] No application implementation code was written.
* [ ] Data-layer implementation can proceed / cannot proceed.

Final Phase 0 decision:

```text
Proceed to Phase 1 / Repeat endpoint verification / Resolve API access first
```

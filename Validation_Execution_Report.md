# Submission 3: Execution Report and QA Findings

## Environment Summary

| Item | Recorded value |
|---|---|
| Application | FinServe Retail Demo Platform (`fs-retail`) |
| UI URL | `http://127.0.0.1:8082` |
| API URL | `http://127.0.0.1:8082/api` |
| Browser | Chromium |
| Execution mode | Playwright, headed, local lab environment |
| Operating system | Windows host; lab OS not recorded |
| Test user | Seeded valid customer (`investor1`, credential not reproduced here) |
| Seeded defect mode | `SEEDED_DEFECT_BUILD=false` |
| Build/version | Not supplied by the application or execution log |
| Execution date/time | Not recorded in the JUnit artifact; capture this on the final rerun |

## Execution Summary

| Metric | Result |
|---|---:|
| Total tests | 73 |
| Passed | 53 |
| Failed | 20 |
| Skipped | 0 |
| Blocked | 0 recorded |
| Reruns | 0 recorded |
| Overall status | **Failed; release decision blocked pending triage** |

The source is `test-results/junit-results.xml`. The HTML report is available at
`playwright-report/index.html` in the local workspace.

## Scope Executed

Authentication, dashboard, mutual funds, investment, insurance listing and
purchase, policies, portfolio, redemption, profile, support, transactions,
smoke flow, and browserless API tests were executed. The run used Chromium only.
Firefox and WebKit cross-browser coverage were not included in this execution.

## Failure Analysis

- **Seeded application defects: 5 observed.** See `DEFECT_LOG.md` for SD-AUTH-01,
  SD-PREMIUM-01, SD-ELIG-01, SD-REDEEM-01, and SD-VALUE-01.
- **Additional failures requiring triage: 15.** These are not classified as
  product defects from the JUnit result alone. They cover dashboard recent
  transactions, insurance filtering, investment, mutual-fund sorting/reset and
  detail, policies, portfolio completeness, support submission, and transaction
  listing/filter/pagination. Each has failure evidence under `test-results/`.
- **API coverage: 6 tests passed.** No API failure was recorded in this run.
- **Automation, data, and environment classification:** requires a targeted
  rerun and inspection of each failing trace. Do not treat the 15 additional
  failures as confirmed application defects until that investigation is complete.

## Evidence Pack

Each failed test directory contains `test-failed-1.png`, `video.webm`,
`trace.zip`, and `error-context.md` where generated. Use:

```text
npx playwright show-trace test-results/<failed-test-directory>/trace.zip
```

Available summary evidence:

- HTML report: `playwright-report/index.html`
- JUnit report: `test-results/junit-results.xml`
- Failure artifacts: `test-results/<failed-test-directory>/`

These generated artifacts are excluded by the repository `.gitignore` because
they are environment-specific. Attach or archive them with the final submission.




# Final QA Summary

## Executive Summary

The Chromium validation run covered 73 automated tests across UI modules and
the API project. Fifty-three passed and 20 failed, with no skipped tests. Five
failures are explicitly tagged seeded application defects and have supporting
failure artifacts. The result is not a release-ready signal until the five
confirmed defects and the 15 additional failures are triaged and retested.

## Findings and Business Impact

| Finding | Impact | Next step |
|---|---|---|
| Locked account bypasses login protection | Security and compliance exposure | Fix lock enforcement; retest authentication first |
| Review premium differs from product premium | Customer consent and billing risk | Align product and review pricing; retest all products |
| Invalid DOB passes eligibility | Underwriting and suitability risk | Enforce age validation server-side and in UI |
| Zero-unit holding can be redeemed | Invalid financial operation risk | Disable redemption when units are zero |
| Holding value disagrees with units x NAV | Financial reporting and customer trust risk | Correct calculation and verify API/UI persistence |
| Fifteen further tests failed | Scope may include additional product, data, or script issues | Review traces and rerun each failure before filing |

## Coverage

Executed: authentication, dashboard, mutual funds, investment, insurance,
purchase, policies, portfolio, redemption, profile, support, transactions,
smoke, and API workflows. Browser coverage was Chromium only. Firefox and
WebKit, application build metadata, database evidence, and a recorded timestamp
are outstanding.

## Recommendation

Do not approve the current build for release. Prioritize authentication,
pricing, eligibility, redemption controls, and valuation. After fixes, run the
targeted seeded-defect tests, the smoke suite, and the complete regression
suite, then attach the regenerated Playwright HTML report, JUnit output, and
failure evidence.

## Submission Package Checklist

- [x] Execution report: `submission/EXECUTION_REPORT.md`
- [x] Defect log: `submission/DEFECT_LOG.md`
- [x] Final QA summary: `submission/QA_SUMMARY.md`
- [x] Final code repository: `https://github.com/Sidhartha2522/PlaywrightAssignment`
- [x] Existing local HTML/JUnit reports and failure artifacts identified
- [ ] Attach or archive generated reports and evidence for mentor review
- [ ] Add exact execution timestamp, application build, and active defect batch
- [ ] Classify and document the 15 non-seeded failures
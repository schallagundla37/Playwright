# Known Limitations and Retest Notes

## Known Limitations

- The recorded execution used Chromium only; Firefox and WebKit were not executed.
- The application build/version, active seeded-defect batch, and exact execution timestamp were not captured in the JUnit artifact.
- Fifteen non-seeded failures require targeted trace review to classify them as application, automation, data, or environment issues.
- Database query evidence was not available for the recorded run.
- Transaction detail assertions currently stop at URL navigation because the detail-page markup was not captured.
- The seeded-defect catalog is provisional because no official answer key was supplied.

## Retest Notes

1. Capture the application URL, build/version, active defect batch, browser, OS, test user, and execution timestamp.
2. Retest the five seeded defects: locked login, premium consistency, eligibility DOB, zero-unit redemption, and holding valuation.
3. Review and classify the remaining 15 failures using their traces, screenshots, videos, and error contexts.
4. Run the smoke suite after fixes.
5. Run the complete regression suite and attach the regenerated HTML report, JUnit output, screenshots, videos, and traces.
6. Add database or API evidence for persistence and calculation defects where UI evidence is insufficient.

## Current Recorded Result

The recorded Chromium run contained 73 tests: 53 passed, 20 failed, and 0 skipped. The current release recommendation is to hold approval pending defect fixes, failure triage, and retest.

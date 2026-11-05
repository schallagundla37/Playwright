# Test Execution Evidence

## Assigned lab VM run

The user confirmed that this workspace is running on the assigned lab VM. The application target was the VM-local service at `http://127.0.0.1:8081`.

| Run | Command | Result | Target |
|---|---|---|---|
| Smoke | `npm run test:smoke` | 1 passed; the first attempt timed out, then passed after the navigation wait was changed to `domcontentloaded` | VM-local app at `http://127.0.0.1:8081` |
| Full discovered suite | `npm test` | 6 passed, 70 skipped, 0 failed; 76 tests discovered; 36.3 seconds | VM-local app at `http://127.0.0.1:8081`, one worker |
| Type check | `npx tsc --noEmit` | Passed | Project on the lab VM |

The full run regenerated the HTML report at `playwright-report/index.html`. Playwright also records its last-run status in `test-results/.last-run.json`. These generated folders are ignored by Git; inspect the HTML report and remove sensitive content before sharing.

## Failure classification

The final full-suite run had no failures. The initial standalone smoke attempt timed out while waiting for the browser's default full-page `load` event. Its captured page showed the login form, and a direct GET to `/login` returned HTTP 200 in approximately 0.5 seconds. Waiting for `domcontentloaded` instead made the smoke pass in 2.3 seconds. Classification: **automation wait condition**; corrected and rerun. No application defect was logged.

## API execution location and skips

The API tests ran against the VM-local service at `127.0.0.1:8081`. The `/api/health` endpoint returned HTTP 200. The current lab source's `bootstrap/app.php` registers `routes/api.php`; I did not enable or modify API routing for this run.

API-V02 and API-V11 passed (401 responses without a valid API key). The other 11 API scenarios were skipped because no API key and no configured test credentials were present. The full-suite total of 70 skips also includes UI cases gated on agent credentials, dedicated disposable accounts, or seeded application records. These skips are not passes and do not provide full behavioral coverage.

## Lab VM evidence outstanding

This workspace has no Git repository or remote configured; the user will push the project. The run is on the assigned VM, but 70 scenarios skipped because this workspace has no configured agent credentials, API key, dedicated disposable accounts, or seeded application records. Therefore it is not evidence that the whole suite passed. For full behavioral execution, configure those values in the VM-local `.env`, rerun the gated scenarios as appropriate, retain the resulting HTML report, and classify any failures before logging defects.

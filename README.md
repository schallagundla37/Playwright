# Insurance Order Entry - Playwright TypeScript

This project contains 76 Playwright TypeScript UI and API scenarios for the insurance order entry lab application, including authentication, dashboard, client data, products, riders, beneficiaries, document validation, application workflow, and API contracts. The detailed scenario designs, risk themes, candidate seeded-defect mappings, and execution gates are in [TEST-CASE-DESIGN.md](./TEST-CASE-DESIGN.md).

## Prerequisites

- Node.js and npm installed in the lab VM.
- The insurance order entry application running in the lab VM at `http://127.0.0.1:8081` (port 8082 is a separate retail demo).
- A dedicated test agent username and password supplied by your mentor or lab. Do not put real credentials in source control.

## Setup

In PowerShell, from this project folder:

```powershell
npm ci
npx playwright install chromium
Copy-Item .env.example .env
```

Edit `.env` and set `APP_BASE_URL`, `E2E_USERNAME`, `E2E_PASSWORD`, and `E2E_API_KEY`. For example:

```dotenv
APP_BASE_URL=http://127.0.0.1:8081
E2E_USERNAME=your-lab-test-user
E2E_PASSWORD=your-lab-test-password
E2E_API_KEY=your-lab-api-key
```

Optional account/application IDs enable isolated-user and API scenarios. `E2E_LOCKOUT_USERNAME` must be a disposable account because the lockout test deliberately makes five failed login attempts. `E2E_AGE_INELIGIBLE_APPLICATION_ID` must refer to an application with an under-age client owned by the configured test agent. `E2E_FULL_SUBMISSION=true` runs a complete synthetic application workflow and should only be enabled with a disposable test-agent account. Never configure production credentials.

The suite uses the lab application's `/login`, `/dashboard`, `/applications/new`, and product/workflow routes. API tests first check `/api/health`; if it returns 404, those tests are explicitly skipped because the app has not registered its API routes. In the checked-in lab source, `routes/api.php` exists but is not registered in `bootstrap/app.php`. Registering that route file enables the API scenarios; once enabled, their endpoint and authorization assertions run normally. UI selectors use the application's `data-testid` attributes. Set credentials in `.env`; never put them in source control.

## Run tests

```powershell
npm run test:smoke
npm test
npm run test:auth
npm run test:client
npm run test:api
npm run test:modules
npm run test:headed
```

Open the HTML report after a run:

```powershell
npm run report
```

Playwright writes the report to `playwright-report` and failure screenshots, traces, and videos to `test-results`. These artifacts can contain sensitive page data; review and sanitize them before sharing.
The configuration uses one worker to reduce contention on the shared lab application. `npm test` executes the complete discovered suite and regenerates the HTML report.

## Scenario coverage

| Scenario | Coverage |
| --- | --- |
| SMOKE-V01 | Login route responds and exposes username/email and password controls |
| AUTH-V01–V08 plus recovery (9 cases) | Successful/failed/empty login, logout, route protection, locked account, five-attempt lockout, weak password policy, and recovery flow |
| DASH-V01–V06 | Dashboard, application list, new application, status filtering, empty state, and status visibility |
| CLI-V01–V10 | Valid and required client fields, age boundaries, future DOB, address copy, email, SSN masking, KYC type, and PEP details |
| PROD-V01–V07 | Product catalog/details, face value limits, premium recalculation, review summary, and suitability warning |
| RIDER-V01–V07 | Rider selection, coverage/age/count validation, mutual exclusion, optional selection, and premium summary |
| BEN-V01–V11 | Primary/secondary allocation, minor guardian, trust/organization fields, duplicates, irrevocable designation, edit, and removal |
| DOC-V01–V04 | Supported/unsupported files, size limit, and mandatory document |
| VAL-V01–V03 | Validation summary, error navigation, and blocked submission |
| WF-V01–V05 | Draft persistence/resume, gated end-to-end submission and confirmation, and submitted summary |
| API-V01–V12 plus API-AUTH-V01 (13 cases) | Product/rider catalogs, login, authorization, applications, client validation, application validation, beneficiaries, documents, submission, and status |

`npm run test:list` is the authoritative discovered-test count (76 in this submission). Environment-gated scenarios are reported as skipped unless their documented test account, API key, or seeded record is configured; a skipped scenario is not execution evidence for its behavior.

Scenarios requiring credentials, a disposable account, an API key, or a pre-seeded application are explicitly gated by optional environment variables. The complete submission test creates its own synthetic application data when enabled.

## Adapting to the lab build

Application builds can differ in labels, copy, and validation messages. If a locator does not match your build, update the semantic locator in the relevant page object or test to match the visible accessible label. Keep credentials in `.env`, use a dedicated test account, and avoid running tests that lock accounts against shared or production users.

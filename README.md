# FinServe Retail Platform — Playwright QA Automation

Black-box UI + API automation for the **FinServe Retail Demo Platform**
(Playwright lab, port 8082), covering authentication, dashboard, mutual fund
discovery, insurance discovery and purchase, policies, and portfolio — plus a
browserless API project against the platform's REST layer.

All locators and seeded-data assertions are derived from the **live
application's captured DOM**, not guessed from documentation.

## Prerequisites

- **Node.js 18 or newer** and npm (`node -v` / `npm -v` to check)
- **Git** to clone the repository
- **The FinServe app running and reachable.** Inside the lab VM it listens on
  `http://127.0.0.1:8082`; from outside use `http://<vm-public-ip>:8082`.
  Confirm before running anything:

  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8082/login
  # expect 200
  ```
- Roughly 1 GB of free disk for the Playwright browser binaries

## Setup

1. **Clone and enter the project**

   ```bash
   git clone <repo-url> fs-platform-qa-automation
   cd fs-platform-qa-automation
   ```

2. **Install dependencies** (Playwright test runner, TypeScript, dotenv)

   ```bash
   npm install
   ```

3. **Install the browsers.** Chromium is enough for the default run; install
   all three if you plan to run cross-browser.

   ```bash
   npx playwright install chromium
   # or, for cross-browser runs:
   npx playwright install
   ```

   On a fresh Linux VM add `--with-deps` to pull in the OS libraries:
   `npx playwright install --with-deps`.

4. **Create your environment file**

   ```bash
   # Windows (PowerShell / cmd)
   copy .env.example .env
   # macOS / Linux
   cp .env.example .env
   ```

   `.env.example` already carries the lab defaults: base URL, API URL and
   static API key, the five seed users from the feature guide (section 9),
   and the wrong password used in negative login tests. Edit `.env` only if
   your environment differs. Never commit `.env`.

5. **Review the toggles in `.env`**

   | Variable | Default | Purpose |
   |---|---|---|
   | `BASE_URL` / `API_BASE_URL` | `http://127.0.0.1:8082` / `…/api` | Where the app and its REST layer live |
   | `API_KEY` | `qa-demo-token-123` | `X-API-Key` for the API project |
   | `BROWSERS` | `chromium` | Comma-separated: `chromium,firefox,webkit` |
   | `HEADLESS` | `true` | Set `false` to watch the browser |
   | `DEFAULT_TIMEOUT_MS` | `30000` | Action/navigation timeout |
   | `SEEDED_DEFECT_BUILD` | `false` | See *Seeded-defect strategy* below |

6. **Verify the install** without touching the app

   ```bash
   npm run typecheck            # tsc --noEmit
   npx playwright test --list   # prints all 73 tests grouped by project
   ```

   Both commands work without a `.env`; any test that actually needs a
   credential fails fast with a clear "Missing required environment variable"
   message if the file is absent.

## Execution

### Quick start

```bash
npm run test:smoke      # ~15 tests: login, listings, purchase e2e, API health/auth
npm run report          # opens the HTML report in the browser
```

### All commands

| Command | What it runs |
|---|---|
| `npm test` | Full suite: one UI project per browser in `BROWSERS` plus the browserless `api` project |
| `npm run test:smoke` | `@smoke` — login, listings, purchase e2e, investment, redemption, API health/auth |
| `npm run test:regression` | Full `@regression` coverage (every module) |
| `npm run test:auth` | Authentication (TC-AUTH-*) |
| `npm run test:dashboard` | Dashboard (TC-DASH-*) |
| `npm run test:funds` | Mutual fund listing and detail (TC-FUND-*) |
| `npm run test:investment` | Investment form (TC-INV-*) |
| `npm run test:insurance` | Insurance product listing (TC-INS-*) |
| `npm run test:purchase` | Insurance purchase (TC-BUY-*) |
| `npm run test:policies` | Policies (TC-POL-*) |
| `npm run test:portfolio` | Portfolio (TC-PORT-*) |
| `npm run test:redemption` | Redemption (TC-RED-*) |
| `npm run test:transactions` | Transactions (TC-TRN-*) |
| `npm run test:profile` | Profile (TC-PROF-*) |
| `npm run test:support` | Support (TC-SUP-*) |
| `npm run test:api` | API project only, no browser (TC-API-*) |
| `npm run test:defects` | `@seeded-defect` — the five defect-detection specs |
| `npm run test:headed` | Whole suite with a visible browser |
| `npm run test:debug` | Playwright Inspector, step through a test |
| `npm run report` | Open the last HTML report |
| `npm run typecheck` | `tsc --noEmit` |

### Targeted runs

```bash
# One spec file
npx playwright test tests/insurance/buy-insurance.spec.ts

# One test case by id (ids are part of every test title)
npx playwright test --grep "TC-BUY-001"

# One browser only, regardless of BROWSERS
npx playwright test --project=chromium

# Combine tags: smoke tests of the insurance module
npx playwright test --grep "@smoke" --grep "@insurance"

# Cross-browser without editing .env (PowerShell / bash)
$env:BROWSERS="chromium,firefox,webkit"; npm test
BROWSERS=chromium,firefox,webkit npm test
```

### Running against the seeded-defect build

```bash
# Detection run: the five @seeded-defect specs assert correct behaviour.
# A failure, with its trace/screenshot/video, is the defect evidence.
npm run test:defects

# Documentation run on a build known to contain the defects: the same specs
# are marked expected-to-fail and the suite stays green.
$env:SEEDED_DEFECT_BUILD="true"; npm run test:defects
```

### Reading the results

- Console: the `list` reporter prints each test with its `TC-…` id.
- HTML report: `playwright-report/index.html` (`npm run report`). Each test
  shows its test-case id, risk, and any seeded-defect id as annotations.
- JUnit XML for CI dashboards: `test-results/junit-results.xml`.
- Failures keep a trace, screenshot, and video under `test-results/<test>/`.
  Open a trace with `npx playwright show-trace test-results/<test>/trace.zip`.

### Troubleshooting

| Symptom | Fix |
|---|---|
| `Missing required environment variable "…"` | Copy `.env.example` to `.env` |
| `net::ERR_CONNECTION_REFUSED` on `/login` | App not running or `BASE_URL` wrong; re-run the curl check above |
| `browserType.launch: Executable doesn't exist` | Run `npx playwright install` |
| Every UI test times out at login | Seed users differ from the feature guide; check the `*_EMAIL` / `*_PASSWORD` values |
| `TC-PORT-006` / `TC-TRN-007` show as skipped | Expected: no zero-unit holding / only one page of transactions for this user |
| `@seeded-defect` specs fail on the lab build | Expected: that failure is the detection evidence (see below) |

## Structure

```
src/
  config/env.ts        typed access to all environment values
  pages/               page objects (real DOM hooks documented per file)
  fixtures/            Playwright fixtures incl. loginAs / loggedInDashboard
  api/api-client.ts    X-API-Key request wrapper for the API project
  data/test-data.ts    seeded catalog facts observed on the live app
  data/seeded-defects.ts  provisional seeded-defect catalog
  utils/               traceability annotations, date helpers
tests/
  auth/ dashboard/ mutual-funds/ insurance/ policies/ portfolio/
  transactions/ profile/ support/ smoke/ api/
test-design/
  TestCaseDesignSheet.csv   73 test cases: steps, data, expected result,
                            severity/priority, evidence, automation status
```

## Test design

- **Design sheet**: `test-design/TestCaseDesignSheet.csv` holds one row per
  automated test, keyed by the same `TC-…` id used in the spec titles and
  report annotations.
- **Traceability**: every test carries a `TC-…` id and risk annotation
  (`trace()`), visible in the HTML report.
- **Locator strategy**: user-facing role/label locators first, `data-testid`
  where the DOM offers no stable accessible handle.
- **Deterministic assertions**: filters/sorts assert exact seeded membership
  (12 funds, 8 insurance products); portfolio summary is recomputed from the
  holdings rows; the e2e purchase verifies policy number, transaction
  reference, policy detail, list membership, and the dashboard count delta.

### Seeded-defect strategy

Specs tagged `@seeded-defect` assert **correct** behavior for suspected
seeded defects (locked login, premium consistency on `/buy-insurance`,
zero-unit redemption guards, eligibility DOB). With
`SEEDED_DEFECT_BUILD=false` a failure of one of these specs — with its trace,
screenshot, and video — is the detection evidence for the defect. Set
`SEEDED_DEFECT_BUILD=true` to mark them as expected failures
(`test.fail`) on a build known to contain the defects.

## Evidence

Failures retain trace (`npx playwright show-trace`), screenshot, and video
under `test-results/`; the HTML report lands in `playwright-report/`; JUnit
XML at `test-results/junit-results.xml`.

## CI

`.github/workflows/playwright.yml`:

- **Pull request / manual**: typecheck + `@smoke` on Chromium
- **Push to main / nightly (02:00 UTC)**: typecheck + full suite on
  Chromium/Firefox/WebKit + API project
- Reports and failure evidence are uploaded as artifacts (14-day retention)
- Credentials come from repository **secrets** (same names as `.env`)

GitHub-hosted runners must be able to reach the app: point `BASE_URL` /
`API_BASE_URL` secrets at the VM's public IP, or use a self-hosted runner
inside the lab VM.

## Known limitations / roadmap

- The failed-login error locator and the post-submit confirmation pages for
  investments/redemptions cover plausible markup variants; they will be
  tightened once DOM captures of those states are available.
- Transaction *detail* (`/transactions/{id}`) assertions stop at the URL —
  that page's markup has not been captured yet.
- The seeded-defect catalog is provisional (no answer key is distributed);
  IDs live in one map (`src/data/seeded-defects.ts`) for easy renaming.
  Current suspects: SD-AUTH-01 (locked login), SD-PREMIUM-01 (buy-insurance
  premium consistency), SD-REDEEM-01 (zero-unit redeem action),
  SD-VALUE-01 (holding value ≠ units × NAV on /redeem), SD-ELIG-01
  (eligibility DOB).

# Defect Log

The following five defects were observed by tests tagged `@seeded-defect` in
the recorded Chromium execution. Status is **Open** because no application fix
or retest result is available.

## SD-AUTH-01: Locked user can reach the dashboard

| Field | Details |
|---|---|
| Module / screen | Authentication / Login |
| Severity / priority | Critical / P1 |
| Preconditions / data | Locked seeded account; `SEEDED_DEFECT_BUILD=false`; app reachable |
| Steps | 1. Open `/login`. 2. Enter the locked user's credentials. 3. Select Sign In. |
| Expected | Login is blocked, the user remains on `/login`, and the dashboard is not reached. |
| Actual | The locked user can log in and reach the dashboard. |
| Evidence | `test-results/dashboard-dashboard-Dashbo-80cf1-ows-references-and-statuses-chromium/` and JUnit entry for `TC-AUTH-004` |
| Business impact | Bypasses account protection and creates material security and compliance risk. |
| Status | Open |

## SD-PREMIUM-01: Review premium differs from product premium

| Field | Details |
|---|---|
| Module / screen | Insurance purchase / Review |
| Severity / priority | Critical / P1 |
| Preconditions / data | Valid customer; an insurance product; purchase flow reaches review |
| Steps | 1. Open an insurance product. 2. Start purchase. 3. Continue to review. 4. Compare the displayed premium with the product card. |
| Expected | The review premium exactly matches the selected product premium. |
| Actual | The review premium differs from the product premium. |
| Evidence | `test-results/insurance-buy-insurance-In-90327-ct-premium-on-every-product-chromium/` and JUnit entry for `TC-BUY-001` |
| Business impact | Can cause customers to consent to or be charged an amount different from the advertised amount. |
| Status | Open |

## SD-ELIG-01: Out-of-range date of birth is accepted

| Field | Details |
|---|---|
| Module / screen | Insurance purchase / Eligibility |
| Severity / priority | High / P1 |
| Preconditions / data | Insurance product with an eligibility age rule; DOB outside that rule |
| Steps | 1. Start an insurance purchase. 2. Enter a date of birth outside the product eligibility age. 3. Submit or continue. |
| Expected | The purchase is rejected with a clear eligibility validation message. |
| Actual | The purchase accepts the out-of-range date of birth. |
| Evidence | `test-results/insurance-buy-insurance-In-070a7-eligibility-age-is-rejected-chromium/` and JUnit entry for `TC-BUY-005` |
| Business impact | May issue unsuitable policies, create underwriting and compliance exposure, and produce incorrect pricing. |
| Status | Open |

## SD-REDEEM-01: Zero-unit holding exposes Redeem

| Field | Details |
|---|---|
| Module / screen | Portfolio / Holdings |
| Severity / priority | High / P1 |
| Preconditions / data | Customer has a holding with `0.0000` units |
| Steps | 1. Open Portfolio. 2. Locate the zero-unit holding. 3. Inspect available actions. |
| Expected | Redeem is hidden or disabled for a zero-unit holding. |
| Actual | An active Redeem action is exposed. |
| Evidence | `test-results/portfolio-portfolio-Portfo-9cc9f-its-do-not-offer-redemption-chromium/` and JUnit entry for `TC-PORT-006` |
| Business impact | Enables invalid redemption attempts and may create erroneous financial transactions. |
| Status | Open |

## SD-VALUE-01: Holding value does not equal units multiplied by NAV

| Field | Details |
|---|---|
| Module / screen | Redemption / Holding details |
| Severity / priority | Critical / P1 |
| Preconditions / data | Holding with units and current NAV visible on `/redeem` |
| Steps | 1. Open Redemption. 2. Select the affected holding. 3. Calculate units x current NAV. 4. Compare with displayed current value. |
| Expected | Displayed current value equals units x current NAV, subject to documented rounding. |
| Actual | `701.5190 x Rs 142.55` is rendered as `Rs 99,999.99`, which is inconsistent. |
| Evidence | `test-results/portfolio-redemption-Redem-45a54--equals-units-current-NAV-chromium/` and JUnit entry for `TC-RED-005` |
| Business impact | Misstates customer holdings and redemption value, affecting financial reporting and customer trust. |
| Status | Open |

## Unclassified Failures

The remaining 15 failed tests are listed in the execution report. They require
trace review and targeted reruns to distinguish application defects from
automation, data, or environment issues before they are logged as defects.
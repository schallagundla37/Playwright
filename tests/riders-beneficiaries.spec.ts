import { expect, test, type Page } from '@playwright/test';
import { applicationIdFromPage, signInAsAgent, startApplication } from './helpers/session';

async function prepareRiderApplication(page: Page): Promise<void> {
  await startApplication(page);
  const applicationId = applicationIdFromPage(page);
  await page.goto(`/applications/${applicationId}/product`);
  await page.getByTestId('product-select').selectOption({ index: 1 });
  const range = await page.getByTestId('product-range-help').textContent();
  const minimumMatch = range?.match(/Allowed Sum Assured:\s*\$([\d,]+(?:\.\d+)?)/);
  if (!minimumMatch) {
    throw new Error(`Could not read the selected product's sum-assured minimum: ${range}`);
  }

  await page.getByTestId('product-sum-assured-input').fill(
    String(Math.ceil(Number(minimumMatch[1].replaceAll(',', '')))),
  );
  await page.getByTestId('product-payment-term-select').selectOption('10');
  await page.getByTestId('product-save-continue-button').click();
  await expect(page.getByTestId('rider-selection-form')).toBeVisible();
}

async function openBeneficiaries(page: Page): Promise<void> {
  await startApplication(page);
  const applicationId = applicationIdFromPage(page);
  await page.goto(`/applications/${applicationId}/beneficiaries`);
}

async function fillIndividualBeneficiary(
  page: Page,
  options: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    level?: 'PRIMARY' | 'SECONDARY';
    allocation?: number;
  } = {},
): Promise<void> {
  await page.getByTestId('beneficiary-level-select').selectOption(options.level ?? 'PRIMARY');
  await page.getByTestId('beneficiary-type-select').selectOption('INDIVIDUAL');
  await page.getByTestId('beneficiary-relationship-select').selectOption('SPOUSE');
  await page.getByTestId('beneficiary-first-name-input').fill(options.firstName ?? 'Jordan');
  await page.getByTestId('beneficiary-last-name-input').fill(options.lastName ?? 'Sample');
  await page.getByTestId('beneficiary-dob-input').fill(options.dateOfBirth ?? '1990-05-15');
  await page.getByTestId('beneficiary-allocation-input').fill(String(options.allocation ?? 100));
}

test.describe('Rider selection', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAgent(page);
    await prepareRiderApplication(page);
  });

  test('RIDER-V01: an eligible protection rider can be selected and saved', async ({ page }) => {
    const rows = page.locator('[data-testid^="rider-row-"]');
    const count = await rows.count();
    test.skip(count === 0, 'The lab has no active riders configured');

    await rows.first().getByRole('checkbox').check();
    await page.getByTestId('rider-save-continue-button').click();

    await expect(page).toHaveURL(/\/applications\/\d+\/beneficiaries(?:[/?#]|$)/);
  });

  test('RIDER-V02: rider coverage above the policy face value is rejected', async ({ page }) => {
    const row = page.locator('[data-testid^="rider-row-"]').first();
    test.skip(await page.locator('[data-testid^="rider-row-"]').count() === 0, 'No active riders configured');
    await row.getByRole('checkbox').check();
    await row.locator('[data-testid^="rider-coverage-amount-"]').fill('999999999');
    await page.getByTestId('rider-save-continue-button').click();

    await expect(page.getByText(/cannot exceed|coverage.*sum assured|sum assured.*coverage/i))
      .toBeVisible();
  });

  test('RIDER-V03: an age-ineligible rider selection is blocked', async ({ page }) => {
    const applicationId = process.env.E2E_AGE_INELIGIBLE_APPLICATION_ID;
    test.skip(
      !applicationId,
      'Set E2E_AGE_INELIGIBLE_APPLICATION_ID to a disposable application with an under-age client',
    );

    await page.goto(`/applications/${applicationId}/riders`);
    const riderRows = page.locator('[data-testid^="rider-row-"]');
    const texts = await riderRows.allTextContents();
    const index = texts.findIndex((text) => /critical illness/i.test(text));
    test.skip(index < 0, 'No critical-illness rider is configured in this lab');

    await riderRows.nth(index).getByRole('checkbox').check();
    await page.getByTestId('rider-save-continue-button').click();
    await expect(page.getByText(/age|not eligible|eligibility/i).first()).toBeVisible();
  });

  test('RIDER-V04: the maximum rider count is enforced', async ({ page }) => {
    const rows = page.locator('[data-testid^="rider-row-"]');
    const count = await rows.count();
    test.skip(count <= 4, 'The configured rider catalog does not exceed the four-rider limit');

    for (let index = 0; index < count; index += 1) {
      await rows.nth(index).getByRole('checkbox').check();
    }
    await page.getByTestId('rider-save-continue-button').click();

    await expect(page.getByText(/maximum 4 riders/i)).toBeVisible();
  });

  test('RIDER-V05: mutually exclusive waiver riders cannot both be selected', async ({ page }) => {
    const rows = page.locator('[data-testid^="rider-row-"]');
    const texts = await rows.allTextContents();
    const disabilityIndex = texts.findIndex((text) => /waiver.*disability/i.test(text));
    const criticalIndex = texts.findIndex((text) => /waiver.*critical illness/i.test(text));
    test.skip(
      disabilityIndex < 0 || criticalIndex < 0,
      'The lab does not contain both mutually exclusive waiver riders',
    );

    await rows.nth(disabilityIndex).getByRole('checkbox').check();
    await rows.nth(criticalIndex).getByRole('checkbox').check();
    await page.getByTestId('rider-save-continue-button').click();

    await expect(page.getByText(/cannot both be selected/i)).toBeVisible();
  });

  test('RIDER-V06: an application can continue without optional riders', async ({ page }) => {
    await page.getByTestId('rider-save-continue-button').click();

    await expect(page).toHaveURL(/\/applications\/\d+\/beneficiaries(?:[/?#]|$)/);
  });

  test('RIDER-V07: selected rider premiums appear in the review summary', async ({ page }) => {
    const rows = page.locator('[data-testid^="rider-row-"]');
    test.skip(await rows.count() === 0, 'The lab has no active riders configured');
    await rows.first().getByRole('checkbox').check();
    await page.getByTestId('rider-save-continue-button').click();

    const applicationId = applicationIdFromPage(page);
    await page.goto(`/applications/${applicationId}/riders`);
    await expect(page.getByTestId('rider-premium-summary')).toHaveText(
      /Current rider premium: \$\s*[\d,]+\.\d{2}/,
    );
    await page.goto(`/applications/${applicationId}/review`);
    await expect(page.getByTestId('review-total-premium')).toHaveText(/\$\s*[\d,]+\.\d{2}/);
    await expect(page.getByTestId('review-application-snapshot').getByText('Rider Premium'))
      .toBeVisible();
  });
});

test.describe('Beneficiaries', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAgent(page);
    await openBeneficiaries(page);
  });

  test('BEN-V01: an individual primary beneficiary can be added', async ({ page }) => {
    await fillIndividualBeneficiary(page);
    await page.getByTestId('beneficiary-save-button').click();

    await expect(page.getByText('Jordan Sample')).toBeVisible();
    await expect(page.locator('[data-testid^="beneficiary-row-"]')).toHaveCount(1);
  });

  test('BEN-V02: a primary allocation below 100 percent is reported during validation', async ({ page }) => {
    await fillIndividualBeneficiary(page, { allocation: 80 });
    await page.getByTestId('beneficiary-save-button').click();

    const applicationId = applicationIdFromPage(page);
    await page.goto(`/applications/${applicationId}/review`);
    await expect(page.getByTestId('review-validation-errors'))
      .toContainText(/primary.*100|allocation.*100|beneficiar/i);
  });

  test('BEN-V03: allocations above 100 percent are constrained by the form', async ({ page }) => {
    const allocation = page.getByTestId('beneficiary-allocation-input');
    await allocation.fill('120');

    await expect(allocation).toHaveAttribute('max', '100');
    await expect.poll(() => allocation.evaluate((input: HTMLInputElement) => input.validity.rangeOverflow))
      .toBeTruthy();
  });

  test('BEN-V04: primary and secondary allocation totals are tracked independently', async ({ page }) => {
    await fillIndividualBeneficiary(page, { allocation: 100 });
    await page.getByTestId('beneficiary-save-button').click();

    await fillIndividualBeneficiary(page, {
      firstName: 'Casey',
      lastName: 'Sample',
      level: 'SECONDARY',
      allocation: 100,
    });
    await page.getByTestId('beneficiary-save-button').click();

    const allocationSummary = page.getByTestId('beneficiary-allocation-summary');
    await expect(allocationSummary).toHaveAttribute('data-primary-total', '100');
    await expect(allocationSummary).toHaveAttribute('data-secondary-total', '100');
  });

  test('BEN-V05: a minor beneficiary cannot be saved without guardian details', async ({ page }) => {
    await fillIndividualBeneficiary(page, { dateOfBirth: '2015-05-15' });
    await page.getByTestId('beneficiary-save-button').click();

    await expect(page.getByTestId('beneficiary-error-summary'))
      .toContainText(/guardian.*required|legal acknowledgement/i);
  });

  test('BEN-V06: trust fields are shown and saved for a trust beneficiary', async ({ page }) => {
    await page.getByTestId('beneficiary-type-select').selectOption('TRUST');
    await page.getByTestId('beneficiary-level-select').selectOption('PRIMARY');
    await page.getByTestId('beneficiary-relationship-select').selectOption('TRUST');
    await page.getByTestId('beneficiary-trust-name-input').fill('Jordan Family Trust');
    await page.getByTestId('beneficiary-trustee-name-input').fill('Jordan Sample');
    await page.getByTestId('beneficiary-allocation-input').fill('100');
    await expect(page.getByTestId('beneficiary-first-name-input')).toBeDisabled();
    await page.getByTestId('beneficiary-save-button').click();

    await expect(page.getByText('Jordan Family Trust')).toBeVisible();
  });

  test('BEN-V07: organization fields are shown and saved for an organization beneficiary', async ({ page }) => {
    await page.getByTestId('beneficiary-type-select').selectOption('ORGANIZATION');
    await page.getByTestId('beneficiary-level-select').selectOption('PRIMARY');
    await page.getByTestId('beneficiary-relationship-select').selectOption('ORGANIZATION');
    await page.getByTestId('beneficiary-organization-name-input').fill('Sample Community Fund');
    await page.getByTestId('beneficiary-allocation-input').fill('100');
    await expect(page.getByTestId('beneficiary-first-name-input')).toBeDisabled();
    await page.getByTestId('beneficiary-save-button').click();

    await expect(page.getByText('Sample Community Fund')).toBeVisible();
  });

  test('BEN-V08: duplicate beneficiaries are rejected', async ({ page }) => {
    await fillIndividualBeneficiary(page, { allocation: 50 });
    await page.getByTestId('beneficiary-save-button').click();
    await fillIndividualBeneficiary(page, { allocation: 40 });
    await page.getByTestId('beneficiary-save-button').click();

    await expect(page.getByTestId('beneficiary-error-summary').or(
      page.getByTestId('validation-error-alert'),
    )).toContainText(/duplicate beneficiary|already added|duplicate|beneficiar/i);
  });

  test('BEN-V09: an irrevocable designation requires and retains confirmation', async ({ page }) => {
    await fillIndividualBeneficiary(page);
    await page.getByTestId('beneficiary-designation-select').selectOption('1');
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByTestId('beneficiary-save-button').click();

    const row = page.locator('[data-testid^="beneficiary-row-"]').first();
    await expect(row.getByText('Irrevocable')).toBeVisible();
    await expect(row.getByText('Locked')).toBeVisible();
  });

  test('BEN-V10: a revocable beneficiary can be edited', async ({ page }) => {
    await fillIndividualBeneficiary(page);
    await page.getByTestId('beneficiary-save-button').click();

    const row = page.locator('[data-testid^="beneficiary-row-"]').first();
    const rowId = await row.getAttribute('data-testid');
    if (!rowId) {
      throw new Error('Saved beneficiary row did not expose its test id');
    }
    const beneficiaryId = rowId.replace('beneficiary-row-', '');
    await page.getByTestId(`beneficiary-edit-${beneficiaryId}`).click();
    await page.getByTestId('beneficiary-first-name-input').fill('Updated');
    await page.getByTestId('beneficiary-save-button').click();

    await expect(page.getByText('Updated Sample')).toBeVisible();
  });

  test('BEN-V11: a revocable beneficiary can be removed', async ({ page }) => {
    await fillIndividualBeneficiary(page);
    await page.getByTestId('beneficiary-save-button').click();

    const row = page.locator('[data-testid^="beneficiary-row-"]').first();
    const rowId = await row.getAttribute('data-testid');
    if (!rowId) {
      throw new Error('Saved beneficiary row did not expose its test id');
    }
    const beneficiaryId = rowId.replace('beneficiary-row-', '');
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByTestId(`beneficiary-delete-${beneficiaryId}`).click();

    await expect(page.locator('[data-testid^="beneficiary-row-"]')).toHaveCount(0);
    await expect(page.getByTestId('beneficiary-empty-state')).toBeVisible();
  });
});

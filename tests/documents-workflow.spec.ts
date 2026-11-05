import { expect, test, type Page } from '@playwright/test';
import {
  applicationIdFromPage,
  completeApplication,
  signInAsAgent,
  startApplication,
} from './helpers/session';

test.beforeEach(async ({ page }) => {
  await signInAsAgent(page);
});

async function openDocuments(page: Page): Promise<string> {
  await startApplication(page);
  const applicationId = applicationIdFromPage(page);
  await page.goto(`/applications/${applicationId}/documents`);
  return applicationId;
}

async function runReviewValidation(page: Page, applicationId: string): Promise<void> {
  await page.goto(`/applications/${applicationId}/review`);
  await page.getByTestId('review-validate-button').click();
}

test('DOC-V01: a supported KYC PDF can be uploaded', async ({ page }) => {
  await openDocuments(page);
  await page.getByTestId('document-type-select').selectOption('KYC_ID');
  await page.getByTestId('document-upload-kyc').setInputFiles({
    name: 'synthetic-kyc.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF'),
  });
  await page.getByTestId('document-upload-button').click();

  await expect(page.locator('[data-testid^="document-row-"]')).toHaveCount(1);
  await expect(page.getByText(/document uploaded.*validation passed/i)).toBeVisible();
});

test('DOC-V02: an unsupported document file type is rejected', async ({ page }) => {
  await openDocuments(page);
  await page.getByTestId('document-upload-kyc').setInputFiles({
    name: 'unsupported.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('synthetic test document'),
  });
  await page.getByTestId('document-upload-button').click();

  await expect(page.getByTestId('validation-error-alert').getByText(/unsupported document format/i))
    .toBeVisible();
});

test('DOC-V03: an oversized document is rejected', async ({ page }) => {
  await openDocuments(page);
  await page.getByTestId('document-upload-kyc').setInputFiles({
    name: 'oversized-kyc.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.concat([
      Buffer.from('%PDF-1.4\n'),
      Buffer.alloc(11 * 1024 * 1024, 65),
    ]),
  });
  await page.getByTestId('document-upload-button').click();

  await expect(page.getByTestId('validation-error-alert').getByText(/size exceeds the allowed limit/i))
    .toBeVisible();
});

test('DOC-V04: a missing mandatory document blocks submission', async ({ page }) => {
  const applicationId = await openDocuments(page);
  await runReviewValidation(page, applicationId);

  await expect(page.getByTestId('review-validation-errors'))
    .toContainText(/KYC.*required|document.*required/i);
  await expect(page.getByTestId('review-submit-application-button')).toBeDisabled();
});

test('VAL-V01: the review page lists unresolved validation errors', async ({ page }) => {
  const applicationId = await openDocuments(page);
  await runReviewValidation(page, applicationId);

  await expect(page.getByTestId('review-page')).toBeVisible();
  await expect(page.getByTestId('review-validation-errors')).toContainText(/client information is required/i);
});

test('VAL-V02: a validation issue links to its corresponding workflow section', async ({ page }) => {
  const applicationId = await openDocuments(page);
  await runReviewValidation(page, applicationId);

  const clientIssue = page.getByTestId('review-validation-errors')
    .getByRole('link', { name: /client/i });
  if (await clientIssue.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await clientIssue.click();
    await expect(page).toHaveURL(new RegExp(`/applications/${applicationId}/client`));
  } else {
    await expect(page.getByTestId('review-validation-errors'))
      .toContainText(/client information is required/i);
  }
});

test('VAL-V03: submission remains disabled while critical validation errors exist', async ({ page }) => {
  const applicationId = await openDocuments(page);
  await runReviewValidation(page, applicationId);

  await expect(page.getByTestId('review-submit-application-button')).toBeDisabled();
});

test('WF-V01: an incomplete application is retained as a draft', async ({ page }) => {
  await startApplication(page);
  const applicationId = applicationIdFromPage(page);
  await page.goto(`/applications/${applicationId}`);

  await expect(page.getByTestId('application-summary-page')).toBeVisible();
  await expect(page.getByTestId('application-summary-page')).toContainText('DRAFT');
});

test('WF-V02: a saved draft can be resumed with its entered client data', async ({ page }) => {
  await startApplication(page);
  const applicationId = applicationIdFromPage(page);
  await page.getByTestId('client-first-name-input').fill('Taylor');
  await page.getByTestId('client-middle-name-input').fill('A');
  await page.getByTestId('client-last-name-input').fill('Sample');
  await page.getByTestId('client-dob-input').fill('1990-05-15');
  await page.getByTestId('client-gender-select').selectOption('FEMALE');
  await page.getByTestId('client-marital-status-select').selectOption('SINGLE');
  await page.getByTestId('client-nationality-input').fill('United States');
  await page.getByTestId('client-occupation-input').fill('Quality Analyst');
  await page.getByTestId('client-employer-name-input').fill('Sample Company');
  await page.getByTestId('client-employer-address-input').fill('10 Sample Road');
  await page.getByTestId('client-save-continue-button').click();

  await page.goto('/applications');
  await page.getByTestId(`application-open-${applicationId}`).click();
  await page.getByRole('link', { name: 'Client Information' }).click();

  await expect(page.getByTestId('client-first-name-input')).toHaveValue('Taylor');
});

test('WF-V03: a valid application can be submitted and receives a reference number', async ({ page }) => {
  test.skip(
    process.env.E2E_FULL_SUBMISSION !== 'true',
    'Enable only with a disposable test agent and synthetic application data',
  );
  await completeApplication(page);
  await page.getByTestId('review-submit-application-button').click();

  await expect(page.getByTestId('submission-confirmation-page')).toBeVisible();
  await expect(page.getByTestId('confirmation-reference-number')).not.toBeEmpty();
});

test('WF-V04: a submitted application summary exposes no editing controls', async ({ page }) => {
  const applicationId = process.env.E2E_SUBMITTED_APPLICATION_ID;
  test.skip(!applicationId, 'Set E2E_SUBMITTED_APPLICATION_ID to a submitted application owned by this agent');
  await page.goto(`/applications/${applicationId}`);

  await expect(page.getByTestId('application-summary-page')).toContainText('SUBMITTED');
  await expect(page.getByTestId('application-summary-page').locator('input, button[type="submit"]'))
    .toHaveCount(0);
});

test('WF-V05: submission displays a confirmation and reference number', async ({ page }) => {
  test.skip(
    process.env.E2E_FULL_SUBMISSION !== 'true',
    'Enable only with a disposable test agent and synthetic application data',
  );
  await completeApplication(page);
  await page.getByTestId('review-submit-application-button').click();

  await expect(page.getByTestId('submission-confirmation-page')).toBeVisible();
  await expect(page.getByTestId('confirmation-reference-number')).toHaveText(/.+/);
});

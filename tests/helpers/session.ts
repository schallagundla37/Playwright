import { expect, type Page, test } from '@playwright/test';
import { validClient } from '../../data/client';
import { fillClientDetails } from '../../pages/client.page';
import { LoginPage } from '../../pages/login.page';

export async function signInAsAgent(page: Page): Promise<void> {
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;
  test.skip(!username || !password, 'Set E2E_USERNAME and E2E_PASSWORD in .env');

  const login = new LoginPage(page);
  await login.open();
  await login.signIn(username!, password!);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
}

export async function startApplication(page: Page): Promise<void> {
  await page.goto('/applications/new');
  await page.getByTestId('application-create-draft-button').click();
  await expect(page).toHaveURL(/\/applications\/\d+\/client(?:[/?#]|$)/);
}

export function applicationIdFromPage(page: Page): string {
  const match = page.url().match(/\/applications\/(\d+)(?:\/|$)/);
  if (!match) {
    throw new Error(`Expected an application URL, received ${page.url()}`);
  }
  return match[1];
}

export async function completeApplication(page: Page): Promise<string> {
  await startApplication(page);
  const applicationId = applicationIdFromPage(page);

  await fillClientDetails(page);
  await page.getByTestId('client-save-continue-button').click();

  await page.getByTestId('residential-address-line-1-input').fill(validClient.address);
  await page.getByTestId('residential-city-input').fill(validClient.city);
  await page.getByTestId('residential-state-province-select').selectOption(validClient.state);
  await page.getByTestId('residential-postal-code-input').fill(validClient.postalCode);
  await page.getByTestId('address-same-as-residential-checkbox').check();
  await page.getByTestId('contact-primary-email-input').fill(validClient.email);
  await page.getByTestId('contact-mobile-number-input').fill('(512) 555-0123');
  await page.getByTestId('contact-preferred-mode-select').selectOption({ index: 1 });
  await page.getByTestId('address-contact-save-continue-button').click();

  await page.getByTestId('kyc-id-number-input').fill('123456789');
  await page.getByTestId('financial-annual-income-input').fill('300000');
  await page.getByTestId('financial-net-worth-input').fill('500000');
  await page.getByTestId('compliance-declaration-checkbox').check();
  await page.getByTestId('kyc-financial-save-continue-button').click();

  await page.getByTestId('product-select').selectOption({ index: 1 });
  const rangeHelp = page.getByTestId('product-range-help');
  await expect(rangeHelp).toContainText(/Allowed Sum Assured:/);
  const range = await rangeHelp.textContent();
  const minimumMatch = range?.match(/Allowed Sum Assured:\s*\$([\d,]+(?:\.\d+)?)/);
  if (!minimumMatch) {
    throw new Error(`Could not read the selected product's sum-assured minimum: ${range}`);
  }
  const minimum = Math.ceil(Number(minimumMatch[1].replaceAll(',', '')));
  await page.getByTestId('product-sum-assured-input').fill(String(minimum));
  await page.getByTestId('product-payment-term-select').selectOption('10');
  await page.getByTestId('product-save-continue-button').click();
  await page.getByTestId('rider-save-continue-button').click();
  await page.getByTestId('beneficiary-continue-button').click();

  await page.getByTestId('document-type-select').selectOption('KYC_ID');
  await page.getByTestId('document-upload-kyc').setInputFiles({
    name: 'synthetic-kyc.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF'),
  });
  await page.getByTestId('document-upload-button').click();
  await page.getByTestId('documents-continue-review-button').click();
  await page.getByTestId('review-validate-button').click();
  await expect(page.getByTestId('review-validation-passed')).toBeVisible();

  return applicationId;
}

export async function openApplicationSection(
  page: Page,
  section: RegExp,
): Promise<void> {
  const sectionLink = page.getByRole('link', { name: section }).or(
    page.getByRole('button', { name: section }),
  ).or(page.getByText(section, { exact: false }));
  await sectionLink.first().click();
}

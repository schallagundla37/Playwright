import { expect, test } from '@playwright/test';
import { invalidClientData, validClient } from '../data/client';
import { ClientPage } from '../pages/client.page';
import { applicationIdFromPage, signInAsAgent } from './helpers/session';

test.beforeEach(async ({ page }) => {
  await signInAsAgent(page);
});

test('CLI-V01: valid client details are accepted and allow progression', async ({ page }) => {
  const client = new ClientPage(page);
  await client.open();
  await client.fillValidClientDetails();
  await client.continueButton.click();

  await expect(page).toHaveURL(/\/applications\/\d+\/address-contact(?:[/?#]|$)/);
});

test('CLI-V02: mandatory client fields are validated before continuing', async ({ page }) => {
  const client = new ClientPage(page);
  await client.open();
  await client.expectRequiredFieldErrors();
});

test('CLI-V03: a date of birth below the minimum eligible age is rejected', async ({ page }) => {
  const client = new ClientPage(page);
  await client.open();
  await client.fillValidClientDetails();
  await page.getByTestId('client-dob-input').fill(invalidClientData.underageDateOfBirth);
  await client.continueButton.click();

  await expect(page.getByText(/age|18 years|eligible/i).first()).toBeVisible();
});

test('CLI-V04: a date of birth above the maximum eligible age is rejected', async ({ page }) => {
  const client = new ClientPage(page);
  await client.open();
  await client.fillValidClientDetails();
  await page.getByTestId('client-dob-input').fill('1940-05-15');
  await client.continueButton.click();

  await expect(page.getByText(/age|65 years|eligible/i).first()).toBeVisible();
});

test('CLI-V05: a future date of birth is rejected', async ({ page }) => {
  const client = new ClientPage(page);
  await client.open();
  await client.fillValidClientDetails();
  await page.getByTestId('client-dob-input').fill(invalidClientData.futureDateOfBirth);
  await client.continueButton.click();

  await expect(page.getByText(/future date of birth|date of birth/i).first()).toBeVisible();
  await expect(page).toHaveURL(/\/applications\/\d+\/client(?:[/?#]|$)/);
});

test('CLI-V06: selecting same-as-residential copies the address to mailing', async ({ page }) => {
  const client = new ClientPage(page);
  await client.open();
  await client.fillValidClientDetails();
  await client.continueButton.click();

  await page.getByTestId('residential-address-line-1-input').fill(validClient.address);
  await page.getByTestId('residential-city-input').fill(validClient.city);
  await page.getByTestId('residential-state-province-select').selectOption(validClient.state);
  await page.getByTestId('residential-postal-code-input').fill(validClient.postalCode);
  await page.getByTestId('address-same-as-residential-checkbox').check();

  await expect(page.getByTestId('mailing-address-line-1-input')).toHaveValue(validClient.address);
  await expect(page.getByTestId('mailing-city-input')).toHaveValue(validClient.city);
  await expect(page.getByTestId('mailing-state-province-select')).toHaveValue(validClient.state);
  await expect(page.getByTestId('mailing-postal-code-input')).toHaveValue(validClient.postalCode);
});

test('CLI-V07: invalid email format is rejected', async ({ page }) => {
  const client = new ClientPage(page);
  await client.open();
  await client.fillValidClientDetails();
  await client.continueButton.click();
  await page.getByTestId('contact-primary-email-input').fill(invalidClientData.email);
  await page.getByTestId('contact-mobile-number-input').fill(validClient.mobile);
  await page.getByTestId('contact-preferred-mode-select').selectOption({ index: 1 });
  await page.getByTestId('address-contact-save-continue-button').click();

  await expect(page.getByText(/primary email|email.*valid/i).first()).toBeVisible();
  await expect(page).toHaveURL(/\/applications\/\d+\/address-contact(?:[/?#]|$)/);
});

test('CLI-V08: a stored identity number is masked', async ({ page }) => {
  const client = new ClientPage(page);
  await client.open();
  const applicationId = applicationIdFromPage(page);
  await page.goto(`/applications/${applicationId}/kyc-financial`);

  await page.getByTestId('kyc-id-number-input').fill('123456789');
  await page.getByTestId('financial-annual-income-input').fill('100000');
  await page.getByTestId('financial-net-worth-input').fill('250000');
  await page.getByTestId('compliance-declaration-checkbox').check();
  await page.getByTestId('kyc-financial-save-continue-button').click();
  await page.goto(`/applications/${applicationId}/kyc-financial`);

  await expect(page.getByTestId('kyc-id-number-input')).toHaveValue(/[*•]{3,}\d{4}$/);
});

test('CLI-V09: unsupported KYC document type is rejected', async ({ page }) => {
  const client = new ClientPage(page);
  await client.open();
  const applicationId = applicationIdFromPage(page);
  await page.goto(`/applications/${applicationId}/documents`);
  await page.getByTestId('document-type-select').selectOption('KYC_ID');
  await page.getByTestId('document-upload-kyc').setInputFiles({
    name: 'unsupported.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('synthetic test file'),
  });
  await page.getByTestId('document-upload-button').click();

  await expect(page.getByText(/unsupported|invalid file|file type/i).first()).toBeVisible();
});

test('CLI-V10: PEP details are required when the agent marks a client as PEP', async ({ page }) => {
  const client = new ClientPage(page);
  await client.open();
  const applicationId = applicationIdFromPage(page);
  await page.goto(`/applications/${applicationId}/kyc-financial`);
  await page.getByTestId('compliance-pep-select').selectOption('1');

  await expect(page.getByTestId('compliance-pep-details-input')).toBeVisible();
  await expect(page.getByTestId('compliance-pep-details-input')).toHaveAttribute(
    'aria-required',
    'true',
  );
});

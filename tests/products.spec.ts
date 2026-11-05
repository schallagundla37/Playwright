import { expect, test, type Page } from '@playwright/test';
import { applicationIdFromPage, signInAsAgent, startApplication } from './helpers/session';

async function openProductConfiguration(page: Page): Promise<string> {
  await startApplication(page);
  const applicationId = applicationIdFromPage(page);
  await page.goto(`/applications/${applicationId}/product`);
  return applicationId;
}

test.beforeEach(async ({ page }) => {
  await signInAsAgent(page);
});

test('PROD-V01: catalog lists Whole Life products', async ({ page }) => {
  await page.goto('/products');
  await expect(page.getByTestId('product-catalog-page')).toBeVisible();
  await expect(page.getByRole('heading', { name: /whole life product catalog/i })).toBeVisible();
  await expect(page.locator('[data-testid^="product-card-"]').first()).toBeVisible();
});

test('PROD-V02: selecting a product opens its details', async ({ page }) => {
  await page.goto('/products');
  await page.getByRole('link', { name: /view details/i }).first().click();

  await expect(page).toHaveURL(/\/products\/\d+(?:[/?#]|$)/);
  await expect(page.getByTestId('product-detail-page')).toBeVisible();
  await expect(page.getByTestId('product-features')).not.toBeEmpty();
});

test('PROD-V03: sum assured below the selected product minimum is rejected', async ({ page }) => {
  const applicationId = await openProductConfiguration(page);
  await page.getByTestId('product-select').selectOption({ index: 1 });
  await page.getByTestId('product-sum-assured-input').fill('1');
  await page.getByTestId('product-payment-term-select').selectOption({ label: '10 years' });
  await page.getByTestId('product-save-continue-button').click();

  await expect(page).toHaveURL(new RegExp(`/applications/${applicationId}/product`));
  await expect(page.getByText(/minimum|sum assured|face value/i).first()).toBeVisible();
});

test('PROD-V04: sum assured above the selected product maximum is rejected', async ({ page }) => {
  const applicationId = await openProductConfiguration(page);
  await page.getByTestId('product-select').selectOption({ index: 1 });
  await page.getByTestId('product-sum-assured-input').fill('999999999999');
  await page.getByTestId('product-payment-term-select').selectOption({ label: '10 years' });
  await page.getByTestId('product-save-continue-button').click();

  await expect(page).toHaveURL(new RegExp(`/applications/${applicationId}/product`));
  await expect(page.getByText(/maximum|sum assured|face value/i).first()).toBeVisible();
});

test('PROD-V05: changing premium frequency recalculates the premium', async ({ page }) => {
  await openProductConfiguration(page);
  await page.getByTestId('product-select').selectOption({ index: 1 });
  await page.getByTestId('product-sum-assured-input').fill('500000');
  const premium = page.getByTestId('product-current-total-premium');
  const before = await premium.textContent();

  await page.getByTestId('product-premium-frequency-select').selectOption('QUARTERLY');
  await expect(premium).not.toHaveText(before ?? '');
});

test('PROD-V06: review shows the selected product and calculated premium', async ({ page }) => {
  const applicationId = await openProductConfiguration(page);
  await page.getByTestId('product-select').selectOption({ index: 1 });
  await page.getByTestId('product-sum-assured-input').fill('500000');
  await page.getByTestId('product-payment-term-select').selectOption({ label: '10 years' });
  await page.getByTestId('product-save-continue-button').click();
  await page.goto(`/applications/${applicationId}/review`);

  await expect(page.getByRole('heading', { name: /review application/i })).toBeVisible();
  await expect(page.getByTestId('review-total-premium')).not.toBeEmpty();
});

test('PROD-V07: product range guidance shows eligibility and sum-assured limits', async ({ page }) => {
  await openProductConfiguration(page);
  await page.getByTestId('product-select').selectOption({ index: 1 });

  await expect(page.getByTestId('product-range-help')).toContainText(/\d/);
});

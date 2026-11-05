import { expect, test } from '@playwright/test';

test('SMOKE-V01: the insurance application login page is reachable', async ({ page }) => {
  const response = await page.goto('/login', { waitUntil: 'domcontentloaded' });

  expect(response, 'The application should return a document response').not.toBeNull();
  expect(response!.status()).toBeLessThan(500);
  await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);
  await expect(page.getByLabel(/username|email/i).first()).toBeVisible();
  await expect(page.getByLabel(/password/i).first()).toBeVisible();
});

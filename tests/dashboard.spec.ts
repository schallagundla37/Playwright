import { expect, test } from '@playwright/test';
import { signInAsAgent, startApplication } from './helpers/session';

test.beforeEach(async ({ page }) => {
  await signInAsAgent(page);
});

test('DASH-V01: dashboard displays application status summaries', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /agent dashboard/i })).toBeVisible();
  await expect(page.getByTestId('dashboard-summary-draft')).toBeVisible();
  await expect(page.getByTestId('dashboard-summary-submitted')).toBeVisible();
  await expect(page.getByTestId('dashboard-summary-approved')).toBeVisible();
});

test('DASH-V02: an agent can open their application list', async ({ page }) => {
  await page.getByTestId('dashboard-view-all-applications-link').click();
  await expect(page).toHaveURL(/\/applications(?:[/?#]|$)/);
  await expect(page.getByTestId('applications-table')).toBeVisible();
});

test('DASH-V03: an agent can create a new draft application', async ({ page }) => {
  await startApplication(page);
  await expect(page.getByTestId('client-information-page')).toBeVisible();
  await expect(page).toHaveURL(/\/applications\/\d+\/client(?:[/?#]|$)/);
});

test('DASH-V04: an application row opens its application summary', async ({ page }) => {
  const firstApplication = page.locator('[data-testid^="application-open-"]').first();
  await firstApplication.click();

  await expect(page.getByTestId('application-summary-page')).toBeVisible();
  await expect(page.getByRole('heading', { name: /application summary/i })).toBeVisible();
});

test('DASH-V05: a new agent sees the empty application state', async ({ page }) => {
  const newAgentUsername = process.env.E2E_NEW_AGENT_USERNAME;
  const newAgentPassword = process.env.E2E_NEW_AGENT_PASSWORD;
  test.skip(
    !newAgentUsername || !newAgentPassword,
    'Set dedicated E2E_NEW_AGENT_USERNAME and E2E_NEW_AGENT_PASSWORD in .env',
  );

  await page.getByRole('button', { name: /log out|logout|sign out/i }).or(
    page.getByRole('link', { name: /log out|logout|sign out/i }),
  ).click();
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(newAgentUsername!);
  await page.getByLabel(/password/i).fill(newAgentPassword!);
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page.getByTestId('dashboard-empty-state')).toBeVisible();
});

test('DASH-V06: dashboard cards include all tracked application statuses', async ({ page }) => {
  for (const status of ['draft', 'submitted', 'under-review', 'approved', 'requires-info']) {
    await expect(page.getByTestId(`dashboard-summary-${status}`)).toBeVisible();
  }
});

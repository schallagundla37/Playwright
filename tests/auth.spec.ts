import { expect, test } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';
import { LoginPage } from '../pages/login.page';

const username = process.env.E2E_USERNAME;
const password = process.env.E2E_PASSWORD;

test('AUTH-V01: a valid agent can sign in and reach the dashboard', async ({ page }) => {
  test.skip(!username || !password, 'Set E2E_USERNAME and E2E_PASSWORD in .env');

  const login = new LoginPage(page);
  await login.open();
  await login.signIn(username!, password!);
  await page.goto('/dashboard');

  await new DashboardPage(page).expectLoaded();
});

test('AUTH-V02: an incorrect password is rejected without granting access', async ({ page }) => {
  test.skip(!username, 'Set E2E_USERNAME in .env');

  const login = new LoginPage(page);
  await login.open();
  await login.signIn(username!, 'Invalid-password-123!');

  await expect(page.getByRole('alert').or(
    page.getByText(/invalid|incorrect|unable to sign in|authentication failed/i),
  ).first()).toBeVisible();
  await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);
});

test('AUTH-V03: empty credentials show required-field validation', async ({ page }) => {
  const login = new LoginPage(page);
  await login.open();
  await login.signInButton.click();

  const email = page.getByTestId('login-email-input');
  const passwordField = page.getByTestId('login-password-input');
  await expect(email).toHaveAttribute('required', '');
  await expect(passwordField).toHaveAttribute('required', '');
  await expect.poll(() =>
    email.evaluate((input: HTMLInputElement) => input.validity.valueMissing),
  ).toBeTruthy();
  await expect.poll(() =>
    passwordField.evaluate((input: HTMLInputElement) => input.validity.valueMissing),
  ).toBeTruthy();
  await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);
});

test('AUTH-V05: direct dashboard access redirects an unauthenticated user to login', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);
});

test('AUTH-V04: logging out clears the session and redirects to login', async ({ page }) => {
  test.skip(!username || !password, 'Set E2E_USERNAME and E2E_PASSWORD in .env');
  const login = new LoginPage(page);
  await login.open();
  await login.signIn(username!, password!);
  await page.goto('/dashboard');
  await new DashboardPage(page).expectLoaded();

  const logout = page.getByRole('button', { name: /log out|logout|sign out/i }).or(
    page.getByRole('link', { name: /log out|logout|sign out/i }),
  );
  await logout.click();
  await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);
});

test('AUTH-RECOVERY: password recovery opens the reset flow', async ({ page }) => {
  const login = new LoginPage(page);
  await login.open();
  await page.getByRole('link', { name: /forgot password|reset password/i }).click();

  await expect(page).toHaveURL(/forgot|reset/i);
  await expect(page.getByLabel(/email|username/i).first()).toBeVisible();
});

test('AUTH-V08: the change-password form rejects a weak password', async ({ page }) => {
  test.skip(!username || !password, 'Set E2E_USERNAME and E2E_PASSWORD in .env');
  const login = new LoginPage(page);
  await login.open();
  await login.signIn(username!, password!);
  await page.goto('/change-password');

  await page.getByTestId('change-password-current').fill(password!);
  await page.getByTestId('change-password-new').fill('123');
  await page.getByTestId('change-password-confirm').fill('123');
  await page.getByTestId('change-password-submit').click();

  await expect(page.getByTestId('change-password-new')).toHaveClass(/is-invalid/);
  await expect(
    page.getByTestId('change-password-form').getByText(/at least 12 characters/i),
  ).toBeVisible();
});

test('AUTH-V06: a locked agent cannot authenticate', async ({ page }) => {
  const lockedUsername = process.env.E2E_LOCKED_USERNAME;
  const lockedPassword = process.env.E2E_LOCKED_PASSWORD;
  test.skip(
    !lockedUsername || !lockedPassword,
    'Set dedicated E2E_LOCKED_USERNAME and E2E_LOCKED_PASSWORD in .env',
  );

  const login = new LoginPage(page);
  await login.open();
  await login.signIn(lockedUsername!, lockedPassword!);

  await expect(page.getByText(/locked|account disabled|contact.*administrator/i).first())
    .toBeVisible();
  await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);
});

test('AUTH-V07: account locks after five failed login attempts', async ({ page }) => {
  const lockoutUsername = process.env.E2E_LOCKOUT_USERNAME;
  test.skip(
    !lockoutUsername,
    'Set E2E_LOCKOUT_USERNAME to a disposable account; this test locks it',
  );

  const login = new LoginPage(page);
  await login.open();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await login.signIn(lockoutUsername!, `Invalid-password-${attempt}!`);
  }

  await expect(page.getByText(/locked|too many attempts|account disabled/i).first())
    .toBeVisible();
});

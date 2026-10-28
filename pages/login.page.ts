import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly signInButton: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByLabel(/username|email/i).first();
    this.password = page.getByLabel(/password/i).first();
    this.signInButton = page.getByRole('button', { name: /log in|login|sign in/i });
  }

  async open(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.page).toHaveURL(/\/login(?:[/?#]|$)/);
  }

  async signIn(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.signInButton.click();
  }
}

import { expect, type Locator, type Page } from '@playwright/test';

export class DashboardPage {
  readonly heading: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /dashboard/i });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
    await expect(this.heading).toBeVisible();
  }

  async startApplication(): Promise<void> {
    await this.page.getByTestId('dashboard-new-application-button').click();
    await this.page.getByTestId('application-create-draft-button').click();
    await expect(this.page).toHaveURL(/\/applications\/\d+\/client(?:[/?#]|$)/);
  }
}

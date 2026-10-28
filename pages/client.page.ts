import { expect, type Locator, type Page } from '@playwright/test';
import { validClient } from '../data/client';

export async function fillClientDetails(page: Page): Promise<void> {
  await page.getByTestId('client-first-name-input').fill(validClient.firstName);
  await page.getByTestId('client-middle-name-input').fill(validClient.middleName);
  await page.getByTestId('client-last-name-input').fill(validClient.lastName);
  await page.getByTestId('client-dob-input').fill(validClient.dateOfBirth);
  await page.getByTestId('client-gender-select').selectOption(validClient.gender);
  await page.getByTestId('client-marital-status-select').selectOption(validClient.maritalStatus);
  await page.getByTestId('client-nationality-input').fill(validClient.nationality);
  await page.getByTestId('client-occupation-input').fill(validClient.occupation);
  await page.getByTestId('client-employer-name-input').fill(validClient.employerName);
  await page.getByTestId('client-employer-address-input').fill(validClient.employerAddress);
}

export class ClientPage {
  readonly continueButton: Locator;

  constructor(private readonly page: Page) {
    this.continueButton = page.getByTestId('client-save-continue-button');
  }

  async open(): Promise<void> {
    await this.page.goto('/applications/new');
    await this.page.getByTestId('application-create-draft-button').click();
    await expect(this.page).toHaveURL(/\/applications\/\d+\/client(?:[/?#]|$)/);
  }

  async expectRequiredFieldErrors(): Promise<void> {
    await this.continueButton.click();
    await expect(this.page.getByTestId('client-first-name-input')).toHaveAttribute('required', '');
    await expect(this.page).toHaveURL(/\/applications\/\d+\/client(?:[/?#]|$)/);
  }

  async fillValidClientDetails(): Promise<void> {
    await fillClientDetails(this.page);
  }
}

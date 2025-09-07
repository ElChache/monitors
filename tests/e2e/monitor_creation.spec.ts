import { test, expect } from '@playwright/test';

test.describe('Monitor Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/monitors/create');
  });

  test('page loads correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/Create Monitor/);
    await expect(page.getByRole('heading', { name: 'Create a New Monitor' })).toBeVisible();
  });

  test('create monitor with simple prompt', async ({ page }) => {
    const promptInput = page.getByLabel('Monitor Description');
    const createButton = page.getByRole('button', { name: 'Create Monitor' });

    await promptInput.fill('Alert me when Tesla stock drops 5%');
    await createButton.click();

    // Wait for confirmation or success message
    await expect(page.getByText('Monitor Created Successfully')).toBeVisible();
  });

  test('validate input validation', async ({ page }) => {
    const createButton = page.getByRole('button', { name: 'Create Monitor' });

    await createButton.click();

    // Check for error messages
    await expect(page.getByText('Please provide a monitor description')).toBeVisible();
  });
});
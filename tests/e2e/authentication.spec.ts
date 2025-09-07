import { test, expect } from '@playwright/test';

test.describe('User Authentication Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('login with valid credentials', async ({ page }) => {
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');
    const loginButton = page.getByRole('button', { name: 'Log In' });

    await emailInput.fill('test@example.com');
    await passwordInput.fill('ValidPassword123!');
    await loginButton.click();

    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('login with invalid credentials', async ({ page }) => {
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');
    const loginButton = page.getByRole('button', { name: 'Log In' });

    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('WrongPassword');
    await loginButton.click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('password reset flow', async ({ page }) => {
    await page.getByRole('link', { name: 'Forgot Password?' }).click();

    const emailInput = page.getByLabel('Email Address');
    const resetButton = page.getByRole('button', { name: 'Reset Password' });

    await emailInput.fill('test@example.com');
    await resetButton.click();

    await expect(page.getByText('Password reset link sent')).toBeVisible();
  });
});
import { test, expect } from '@playwright/test';

test.describe('User Settings and Preferences', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming we have a login helper or context
    await page.goto('/settings');
  });

  test('update email preferences', async ({ page }) => {
    const emailFrequencySelect = page.getByLabel('Email Notification Frequency');
    const saveButton = page.getByRole('button', { name: 'Save Preferences' });

    await emailFrequencySelect.selectOption('daily');
    await saveButton.click();

    await expect(page.getByText('Preferences Updated Successfully')).toBeVisible();
  });

  test('change password', async ({ page }) => {
    const currentPasswordInput = page.getByLabel('Current Password');
    const newPasswordInput = page.getByLabel('New Password');
    const confirmPasswordInput = page.getByLabel('Confirm New Password');
    const changePasswordButton = page.getByRole('button', { name: 'Change Password' });

    await currentPasswordInput.fill('OldPassword123!');
    await newPasswordInput.fill('NewPassword456!');
    await confirmPasswordInput.fill('NewPassword456!');
    await changePasswordButton.click();

    await expect(page.getByText('Password Changed Successfully')).toBeVisible();
  });

  test('manage notification settings', async ({ page }) => {
    const emailNotificationToggle = page.getByRole('switch', { name: 'Email Notifications' });
    const saveButton = page.getByRole('button', { name: 'Save Preferences' });

    await emailNotificationToggle.click();
    await saveButton.click();

    await expect(page.getByText('Notification Settings Updated')).toBeVisible();
  });
});
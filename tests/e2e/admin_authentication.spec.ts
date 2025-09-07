import { test, expect } from '@playwright/test';

test.describe('Admin Authentication and Authorization', () => {
  // Test setup to use an admin user
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Use admin credentials
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');
    const loginButton = page.getByRole('button', { name: 'Log In' });

    await emailInput.fill('admin@monitorhub.com');
    await passwordInput.fill('AdminPassword123!');
    await loginButton.click();

    // Wait for admin dashboard
    await page.waitForURL('/admin');
  });

  test('admin can access admin panel', async ({ page }) => {
    await expect(page).toHaveURL('/admin');
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
  });

  test('admin can view user management', async ({ page }) => {
    await page.goto('/admin/users');
    
    await expect(page.getByRole('table', { name: 'User Management' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update User' })).toBeVisible();
  });

  test('admin can change user roles', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Find a user and change their role
    const firstUserRoleToggle = page.getByRole('switch', { name: 'User Role' }).first();
    await firstUserRoleToggle.click();

    // Confirm dialog appears
    await expect(page.getByRole('dialog', { name: 'Confirm Role Change' })).toBeVisible();
    
    const confirmButton = page.getByRole('button', { name: 'Confirm' });
    await confirmButton.click();

    // Verify role change reflected
    await expect(page.getByText('Role Updated Successfully')).toBeVisible();
  });

  test('non-admin users cannot access admin panel', async ({ page }) => {
    // Log out first
    await page.goto('/logout');

    // Log in as regular user
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');
    const loginButton = page.getByRole('button', { name: 'Log In' });

    await emailInput.fill('user@monitorhub.com');
    await passwordInput.fill('UserPassword123!');
    await loginButton.click();

    // Try to access admin panel
    await page.goto('/admin');

    // Should be redirected or forbidden
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Access Denied')).toBeVisible();
  });

  test('admin can toggle system configuration', async ({ page }) => {
    await page.goto('/admin/config');

    const maintenanceModeToggle = page.getByRole('switch', { name: 'Maintenance Mode' });
    await maintenanceModeToggle.click();

    // Confirm dialog
    await expect(page.getByRole('dialog', { name: 'Confirm Configuration Change' })).toBeVisible();
    
    const confirmButton = page.getByRole('button', { name: 'Confirm' });
    await confirmButton.click();

    // Verify configuration update
    await expect(page.getByText('System Configuration Updated')).toBeVisible();
  });
});
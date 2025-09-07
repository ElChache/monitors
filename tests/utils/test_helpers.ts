import { Page } from '@playwright/test';

export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
  
  // Wait for dashboard or home page
  await page.waitForURL(/dashboard|home/);
}

export function generateTestEmail(): string {
  return `test_${Date.now()}@example.com`;
}

export function generateTestPassword(): string {
  return `Test${Math.random().toString(36).slice(-8)}!23`;
}

export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `./test-results/screenshots/${name}.png`,
    fullPage: true 
  });
}
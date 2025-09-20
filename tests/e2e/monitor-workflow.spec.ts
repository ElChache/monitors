import { test, expect } from '@playwright/test';

/**
 * MonitorHub E2E Tests - Complete Monitor Workflow
 * Tests the entire user journey from registration to monitor creation and management
 */

test.describe('MonitorHub - Complete Monitor Workflow', () => {
  const testUser = {
    email: 'qa.test@monitorhub.beta',
    password: 'SecureTestPassword123!',
    name: 'QA Test User'
  };

  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto('/');
  });

  test('should complete full user registration and monitor creation workflow', async ({ page }) => {
    // Step 1: User Registration
    await test.step('Register new user', async () => {
      await page.goto('/auth/register');
      
      // Fill registration form
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="name"]', testUser.name);
      
      // Submit registration
      await page.click('button[type="submit"]');
      
      // Verify registration success (should redirect to login or dashboard)
      await expect(page).toHaveURL(/\/auth\/login|\/app/);
    });

    // Step 2: User Login
    await test.step('Login with new credentials', async () => {
      // If redirected to login, perform login
      if (page.url().includes('/auth/login')) {
        await page.fill('input[name="email"]', testUser.email);
        await page.fill('input[name="password"]', testUser.password);
        await page.click('button[type="submit"]');
      }
      
      // Verify successful login - should be on dashboard
      await expect(page).toHaveURL(/\/app/);
      await expect(page.locator('h1')).toContainText('MonitorHub');
    });

    // Step 3: Dashboard Access
    await test.step('Access dashboard and verify layout', async () => {
      // Verify dashboard elements are present
      await expect(page.locator('.dashboard')).toBeVisible();
      await expect(page.getByText('Create New Monitor')).toBeVisible();
      
      // Take screenshot for visual verification
      await page.screenshot({ 
        path: 'tests/screenshots/dashboard-overview.png',
        fullPage: true 
      });
    });

    // Step 4: Monitor Creation
    await test.step('Create Tesla stock monitor', async () => {
      // Click create monitor button
      await page.click('text=Create New Monitor');
      
      // Verify monitor creation form
      await expect(page.locator('form[data-testid="monitor-form"]')).toBeVisible();
      
      // Fill monitor details
      await page.fill('input[name="name"]', 'Tesla Stock Price Alert');
      await page.fill('textarea[name="description"]', 'Monitor Tesla stock for investment decisions');
      await page.fill('textarea[name="naturalLanguagePrompt"]', 'Alert me when Tesla stock price drops below $200');
      
      // Select monitor type
      await page.selectOption('select[name="monitorType"]', 'CURRENT_STATE');
      
      // Set evaluation frequency
      await page.fill('input[name="evaluationFrequencyMins"]', '15');
      
      // Submit monitor creation
      await page.click('button[type="submit"]');
      
      // Verify AI processing indication
      await expect(page.getByText('Processing with AI')).toBeVisible();
      
      // Wait for AI processing to complete
      await page.waitForSelector('[data-testid="monitor-card"]', { timeout: 30000 });
    });

    // Step 5: Monitor Card Verification
    await test.step('Verify created monitor appears in dashboard', async () => {
      // Verify monitor card is displayed
      const monitorCard = page.locator('[data-testid="monitor-card"]').first();
      await expect(monitorCard).toBeVisible();
      
      // Verify monitor details
      await expect(monitorCard.locator('.monitor-title')).toContainText('Tesla Stock Price Alert');
      await expect(monitorCard.locator('.type-label')).toContainText('Current State');
      await expect(monitorCard.locator('.monitor-prompt')).toContainText('Alert me when Tesla stock price drops below $200');
      
      // Verify action buttons are present
      await expect(monitorCard.locator('button[title="Edit monitor"]')).toBeVisible();
      await expect(monitorCard.locator('button[title="Delete monitor"]')).toBeVisible();
      await expect(monitorCard.locator('button[title="Pause monitor"]')).toBeVisible();
      await expect(monitorCard.locator('button[title="Evaluate now"]')).toBeVisible();
    });

    // Step 6: Monitor Management Actions
    await test.step('Test monitor management actions', async () => {
      const monitorCard = page.locator('[data-testid="monitor-card"]').first();
      
      // Test evaluate now functionality
      await monitorCard.locator('button[title="Evaluate now"]').click();
      await expect(page.getByText('Evaluating monitor')).toBeVisible();
      
      // Wait for evaluation to complete
      await page.waitForSelector('.status-indicator', { timeout: 15000 });
      
      // Test pause/unpause functionality
      await monitorCard.locator('button[title="Pause monitor"]').click();
      await expect(monitorCard.locator('.status-indicator')).toHaveClass(/inactive/);
      await expect(monitorCard.locator('button[title="Activate monitor"]')).toBeVisible();
      
      // Reactivate monitor
      await monitorCard.locator('button[title="Activate monitor"]').click();
      await expect(monitorCard.locator('.status-indicator')).not.toHaveClass(/inactive/);
    });
  });

  test('should handle monitor creation with historical change type', async ({ page }) => {
    // Assume user is already logged in for this test
    await page.goto('/app');
    
    await test.step('Create historical change monitor', async () => {
      await page.click('text=Create New Monitor');
      
      // Fill form for historical change monitor
      await page.fill('input[name="name"]', 'Tesla Stock Drop Alert');
      await page.fill('textarea[name="naturalLanguagePrompt"]', 'Alert me when Tesla stock drops more than 10% in a day');
      await page.selectOption('select[name="monitorType"]', 'HISTORICAL_CHANGE');
      await page.fill('input[name="evaluationFrequencyMins"]', '5');
      
      await page.click('button[type="submit"]');
      
      // Wait for monitor creation
      await page.waitForSelector('[data-testid="monitor-card"]', { timeout: 30000 });
      
      // Verify historical change monitor
      const monitorCard = page.locator('[data-testid="monitor-card"]').last();
      await expect(monitorCard.locator('.type-label')).toContainText('Historical Change');
      await expect(monitorCard.locator('.meta-item')).toContainText('Every 5min');
    });
  });

  test('should handle monitor deletion workflow', async ({ page }) => {
    await page.goto('/app');
    
    await test.step('Delete monitor with confirmation', async () => {
      // Ensure at least one monitor exists
      await expect(page.locator('[data-testid="monitor-card"]')).toHaveCount.atLeast(1);
      
      const initialCount = await page.locator('[data-testid="monitor-card"]').count();
      
      // Click delete button on first monitor
      await page.locator('[data-testid="monitor-card"]').first().locator('button[title="Delete monitor"]').click();
      
      // Handle confirmation dialog
      page.on('dialog', async dialog => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain('Are you sure you want to delete');
        await dialog.accept();
      });
      
      // Verify monitor is deleted
      await expect(page.locator('[data-testid="monitor-card"]')).toHaveCount(initialCount - 1);
    });
  });

  test('should handle monitor editing workflow', async ({ page }) => {
    await page.goto('/app');
    
    await test.step('Edit existing monitor', async () => {
      // Click edit button on first monitor
      await page.locator('[data-testid="monitor-card"]').first().locator('button[title="Edit monitor"]').click();
      
      // Verify edit form opens
      await expect(page.locator('form[data-testid="monitor-edit-form"]')).toBeVisible();
      
      // Update monitor name
      await page.fill('input[name="name"]', 'Updated Tesla Monitor');
      await page.fill('input[name="evaluationFrequencyMins"]', '30');
      
      // Save changes
      await page.click('button[type="submit"]');
      
      // Verify changes are reflected
      await expect(page.locator('[data-testid="monitor-card"]').first().locator('.monitor-title')).toContainText('Updated Tesla Monitor');
      await expect(page.locator('[data-testid="monitor-card"]').first().locator('.meta-item')).toContainText('Every 30min');
    });
  });

  test('should handle dashboard filtering and search', async ({ page }) => {
    await page.goto('/app');
    
    await test.step('Test dashboard filters', async () => {
      // Test monitor type filter
      await page.selectOption('select[data-testid="type-filter"]', 'CURRENT_STATE');
      await expect(page.locator('[data-testid="monitor-card"] .type-label')).toContainText('Current State');
      
      // Test status filter
      await page.selectOption('select[data-testid="status-filter"]', 'ACTIVE');
      await expect(page.locator('[data-testid="monitor-card"] .status-indicator')).not.toHaveClass(/inactive/);
      
      // Test search functionality
      await page.fill('input[data-testid="search-input"]', 'Tesla');
      await expect(page.locator('[data-testid="monitor-card"] .monitor-title')).toContainText('Tesla');
      
      // Clear filters
      await page.selectOption('select[data-testid="type-filter"]', 'ALL');
      await page.selectOption('select[data-testid="status-filter"]', 'ALL');
      await page.fill('input[data-testid="search-input"]', '');
    });
  });

  test('should handle responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app');
    
    await test.step('Verify mobile responsiveness', async () => {
      // Verify dashboard is responsive
      await expect(page.locator('.dashboard')).toBeVisible();
      
      // Take mobile screenshot
      await page.screenshot({ 
        path: 'tests/screenshots/dashboard-mobile.png',
        fullPage: true 
      });
      
      // Verify monitor cards stack properly on mobile
      const monitorCards = page.locator('[data-testid="monitor-card"]');
      if (await monitorCards.count() > 0) {
        const firstCard = monitorCards.first();
        await expect(firstCard).toBeVisible();
        
        // Verify action buttons are accessible on mobile
        await expect(firstCard.locator('.action-buttons')).toBeVisible();
      }
    });
  });

  test('should handle error states gracefully', async ({ page }) => {
    await test.step('Test network error handling', async () => {
      // Simulate network offline
      await page.context().setOffline(true);
      
      await page.goto('/app');
      
      // Try to create monitor while offline
      await page.click('text=Create New Monitor');
      await page.fill('input[name="name"]', 'Offline Test Monitor');
      await page.click('button[type="submit"]');
      
      // Verify error message is displayed
      await expect(page.getByText('Network error')).toBeVisible();
      
      // Restore network
      await page.context().setOffline(false);
    });
  });

  test('should handle AI service errors gracefully', async ({ page }) => {
    await page.goto('/app');
    
    await test.step('Test AI processing error handling', async () => {
      // Create monitor with potentially problematic prompt
      await page.click('text=Create New Monitor');
      await page.fill('input[name="name"]', 'AI Error Test');
      await page.fill('textarea[name="naturalLanguagePrompt"]', 'Invalid prompt that should trigger AI error');
      await page.click('button[type="submit"]');
      
      // Verify error handling (should show error message or fallback behavior)
      const errorMessage = page.locator('.error-message');
      const successMessage = page.locator('.success-message');
      
      // Should show either error message or successful fallback
      await expect(errorMessage.or(successMessage)).toBeVisible({ timeout: 30000 });
    });
  });
});
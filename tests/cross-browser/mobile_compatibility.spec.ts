import { test, expect } from '@playwright/test';

test.describe('Mobile Browser Compatibility', () => {
  const mobileRoutes = [
    '/monitors/create',
    '/dashboard',
    '/settings'
  ];

  const deviceSizes = [
    { width: 375, height: 812, name: 'iPhone 12/13' },
    { width: 360, height: 800, name: 'Samsung Galaxy S21' },
    { width: 414, height: 896, name: 'iPhone 11 Pro Max' }
  ];

  deviceSizes.forEach(device => {
    test(`Responsive layout on ${device.name}`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });

      for (const route of mobileRoutes) {
        await page.goto(route);

        // Check responsive container
        const responsiveContainer = page.getByTestId('mobile-container');
        await expect(responsiveContainer).toBeVisible();

        // Verify mobile-specific layout
        const mobileElements = await page.$$('[data-mobile-layout]');
        expect(mobileElements.length).toBeGreaterThan(0);
      }
    });
  });

  test('Touch interactions on mobile routes', async ({ page }) => {
    await page.goto('/monitors/create');

    // Test touch-friendly input
    const promptInput = page.getByLabel('Monitor Description');
    await promptInput.tap();
    await promptInput.fill('Alert me when Tesla stock drops 5%');

    // Test swipe and scroll
    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="scrollable-area"]');
      if (container) {
        container.scrollTop = 100;
      }
    });

    // Verify scroll works
    const scrollPosition = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="scrollable-area"]');
      return container ? container.scrollTop : 0;
    });

    expect(scrollPosition).toBeGreaterThan(0);
  });

  test('Monitor creation on mobile', async ({ page }) => {
    await page.goto('/monitors/create');

    // Mobile-specific monitor creation
    const promptInput = page.getByLabel('Monitor Description');
    await promptInput.fill('Track SpaceX stock price');

    const createButton = page.getByRole('button', { name: 'Create Monitor' });
    await createButton.tap();

    // Verify success with mobile toast
    const mobileToast = page.getByTestId('mobile-toast');
    await expect(mobileToast).toBeVisible();
  });

  test('Performance metrics on mobile', async ({ page }) => {
    await page.goto('/dashboard');

    // Measure page load time
    const loadTime = await page.evaluate(() => {
      return performance.now();
    });

    expect(loadTime).toBeLessThan(3000); // Max 3 seconds

    // Check resource efficiency
    const resourceUsage = await page.evaluate(() => {
      const memory = performance.memory;
      return memory ? memory.usedJSHeapSize : null;
    });

    if (resourceUsage) {
      expect(resourceUsage).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    }
  });

  test('Offline mode handling', async ({ page, context }) => {
    await page.goto('/dashboard');

    // Simulate offline mode
    await context.setOffline(true);

    // Check offline UI
    const offlineIndicator = page.getByTestId('offline-mode');
    await expect(offlineIndicator).toBeVisible();

    // Re-enable online mode
    await context.setOffline(false);
  });
});
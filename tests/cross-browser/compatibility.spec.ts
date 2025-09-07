import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Compatibility Validation', () => {
  const testRoutes = [
    '/monitors/create',
    '/dashboard',
    '/settings',
    '/admin'
  ];

  testRoutes.forEach(route => {
    test(`Basic route rendering: ${route}`, async ({ page, browserName }) => {
      await page.goto(route);

      // Verify page load
      const pageTitle = await page.title();
      expect(pageTitle).toBeTruthy();

      // Check core page elements
      const mainHeading = await page.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeTruthy();

      // Verify responsive layout
      const viewportSize = page.viewportSize();
      expect(viewportSize?.width).toBeGreaterThan(0);
      expect(viewportSize?.height).toBeGreaterThan(0);
    });

    test(`Interactive elements: ${route}`, async ({ page }) => {
      await page.goto(route);

      // Test basic interactivity
      const interactiveElements = await page.$$('button, a, input, select');
      for (const element of interactiveElements) {
        await element.focus();
        const isFocused = await page.evaluate(el => document.activeElement === el, element);
        expect(isFocused).toBeTruthy();
      }
    });
  });

  test('Monitor Creation Workflow', async ({ page, browserName }) => {
    await page.goto('/monitors/create');

    // Test AI-powered prompt input
    const promptInput = page.getByLabel('Monitor Description');
    await promptInput.fill('Alert me when Tesla stock drops 5%');

    const createButton = page.getByRole('button', { name: 'Create Monitor' });
    await createButton.click();

    // Verify monitor creation feedback
    const successMessage = page.getByText('Monitor Created Successfully');
    await expect(successMessage).toBeVisible();
  });

  test('Dashboard Interaction', async ({ page }) => {
    await page.goto('/dashboard');

    // Test dashboard card interactions
    const monitorCards = await page.$$('[data-testid="monitor-card"]');
    expect(monitorCards.length).toBeGreaterThanOrEqual(0);

    if (monitorCards.length > 0) {
      const firstCard = monitorCards[0];
      await firstCard.click();

      // Verify card expansion or detail view
      const detailView = page.getByTestId('monitor-detail-view');
      await expect(detailView).toBeVisible();
    }
  });

  test('Responsive Design Check', async ({ page, browserName }) => {
    const viewports = [
      { width: 375, height: 812 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1280, height: 800 }   // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard');

      // Check responsive layout elements
      const responsiveContainer = page.getByTestId('responsive-container');
      await expect(responsiveContainer).toBeVisible();

      // Verify layout changes
      const columnCount = await page.evaluate(() => {
        const container = document.querySelector('[data-testid="responsive-container"]');
        const computedStyle = window.getComputedStyle(container);
        return computedStyle.getPropertyValue('grid-template-columns').split(' ').length;
      });

      expect(columnCount).toBeGreaterThan(0);
    }
  });
});
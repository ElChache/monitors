import { test, expect } from '@playwright/test';

test.describe('Accessibility Validation', () => {
  const routes = [
    '/monitors/create', 
    '/settings', 
    '/dashboard', 
    '/admin'
  ];

  routes.forEach(route => {
    test(`Accessibility check for ${route}`, async ({ page }) => {
      await page.goto(route);

      // Check color contrast
      const colorContrastResults = await page.evaluate(() => {
        // Define utility functions inside the browser context
        function calculateContrastRatio(rgb1, rgb2) {
          const getLuminance = (r, g, b) => {
            const [rs, gs, bs] = [r, g, b].map(c => {
              c /= 255;
              return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
          };
          
          const lum1 = getLuminance(...rgb1);
          const lum2 = getLuminance(...rgb2);
          
          return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
        }

        const elements = document.querySelectorAll('*');
        const contrastIssues = [];

        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const backgroundColor = style.backgroundColor;
          const color = style.color;

          // Convert color to RGB for contrast calculation
          const bgRGB = backgroundColor.match(/\d+/g)?.map(Number) || [255,255,255];
          const textRGB = color.match(/\d+/g)?.map(Number) || [0,0,0];

          const contrastRatio = calculateContrastRatio(bgRGB, textRGB);
          
          if (contrastRatio < 4.5) {
            contrastIssues.push({
              element: el.tagName,
              backgroundColor,
              color,
              contrastRatio
            });
          }
        });

        return contrastIssues;
      });

      expect(colorContrastResults.length).toBe(0, 
        `Color contrast issues found on ${route}: ${JSON.stringify(colorContrastResults, null, 2)}`
      );

      // Check for semantic HTML
      const semanticElementsCount = await page.evaluate(() => {
        return {
          mainElements: document.querySelectorAll('main, header, footer, nav, section, article').length,
          headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
          landmarks: document.querySelectorAll('[role="main"], [role="navigation"], [role="complementary"]').length
        };
      });

      expect(semanticElementsCount.mainElements).toBeGreaterThan(0);
      expect(semanticElementsCount.headings).toBeGreaterThan(0);

      // Keyboard navigation
      const focusableElements = await page.$$('a, button, input, select, textarea, [tabindex]');
      for (const element of focusableElements) {
        await element.focus();
        const isFocused = await page.evaluate(el => document.activeElement === el, element);
        expect(isFocused).toBeTruthy();
      }
    });
  });
});
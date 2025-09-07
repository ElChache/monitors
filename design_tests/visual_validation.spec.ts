import { test, expect } from '@playwright/test';

test.describe('Design System Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('Color Accessibility', async ({ page }) => {
    const colorCheck = await page.evaluate(() => {
      // Define utility functions inside the browser context
      function parseRgbColor(rgbString: string): [number, number, number] {
        const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!match) return [0, 0, 0];
        return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
      }

      function calculateContrastRatio(color1: string, color2: string): number {
        const getLuminance = (r: number, g: number, b: number): number => {
          const [rs, gs, bs] = [r, g, b].map(c => {
            c /= 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };
        
        const rgb1 = parseRgbColor(color1);
        const rgb2 = parseRgbColor(color2);
        
        const lum1 = getLuminance(...rgb1);
        const lum2 = getLuminance(...rgb2);
        
        return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
      }

      const colors = [
        'primary', 'secondary', 'accent', 
        'success', 'warning', 'error'
      ];
      
      return colors.map(color => {
        const element = document.createElement('div');
        element.style.backgroundColor = `var(--${color})`;
        element.style.color = 'white';
        element.style.width = '100px';
        element.style.height = '100px';
        document.body.appendChild(element);
        
        const bgColor = getComputedStyle(element).backgroundColor;
        const textColor = getComputedStyle(element).color;
        
        // Parse RGB values for contrast calculation
        const bgRGB = bgColor.match(/\d+/g)?.map(Number) || [255,255,255];
        const textRGB = textColor.match(/\d+/g)?.map(Number) || [0,0,0];
        
        const contrastRatio = calculateContrastRatio(bgColor, textColor);
        
        document.body.removeChild(element); // Clean up
        
        console.log(`Color: ${color}, BG: ${bgColor}, Text: ${textColor}, Contrast: ${contrastRatio}`);
        
        return {
          color,
          backgroundColor: bgColor,
          textColor: textColor,
          contrastRatio,
          meetsWCAG: contrastRatio >= 4.5
        };
      });
    });

    colorCheck.forEach(result => {
      expect(result.meetsWCAG, 
        `${result.color} color contrast (${result.contrastRatio}) should meet WCAG 2.1`
      ).toBeTruthy();
    });
  });

  test('Responsive Layout', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1440, height: 900 }   // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.screenshot({ 
        path: `screenshots/responsive_${viewport.width}x${viewport.height}.png` 
      });
    }
  });

  test('Typography Consistency', async ({ page }) => {
    const typographyCheck = await page.evaluate(() => {
      const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      return headings.map(heading => {
        const element = document.querySelector(heading);
        if (!element) return null;
        
        const style = getComputedStyle(element);
        return {
          tag: heading,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          color: style.color
        };
      }).filter(Boolean);
    });

    expect(typographyCheck.length).toBeGreaterThan(0);
    typographyCheck.forEach(heading => {
      expect(heading.fontSize).toBeTruthy();
      expect(parseInt(heading.fontWeight)).toBeGreaterThan(0);
    });
  });
});
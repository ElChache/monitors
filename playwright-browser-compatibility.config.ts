import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/cross-browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  
  projects: [
    // Desktop Browsers
    {
      name: 'chrome-stable',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'chrome-beta',
      use: { 
        ...devices['Desktop Chrome'], 
        channel: 'chrome-beta' 
      }
    },
    {
      name: 'firefox-stable',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'firefox-beta',
      use: { 
        ...devices['Desktop Firefox'], 
        channel: 'firefox-beta' 
      }
    },
    {
      name: 'safari-stable',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'edge-stable',
      use: { ...devices['Desktop Edge'] }
    },
    
    // Mobile Browsers
    {
      name: 'chrome-mobile',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'safari-mobile',
      use: { ...devices['iPhone 13'] }
    }
  ]
});
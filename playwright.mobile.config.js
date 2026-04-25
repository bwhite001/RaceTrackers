// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Mobile E2E config — runs all journey specs at iPhone 14 Pro viewport.
 * Run: npx playwright test --config=playwright.mobile.config.js --reporter=list
 */
export default defineConfig({
  testDir: './test/e2e/playwright',
  fullyParallel: false,
  forbidOnly: false,
  retries: 1,
  workers: 2,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/mobile', open: 'never' }],
  ],
  timeout: 90000,
  expect: { timeout: 20000 },
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 20000,
    navigationTimeout: 45000,
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14 Pro'] },
    },
  ],
  webServer: {
    command: 'npx serve dist -p 3000 --single',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 30000,
  },
});

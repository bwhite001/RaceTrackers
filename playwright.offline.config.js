// @ts-check
// Offline suite (A6): service workers ALLOWED, against a production preview,
// so offline start, precached fonts and reloads are tested for real.
// Run: npm run build && npm run test:e2e:offline
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e/playwright',
  testMatch: /25-offline\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120000,
  expect: { timeout: 15000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4175',
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx vite preview --port 4175 --strictPort',
    url: 'http://localhost:4175',
    reuseExistingServer: false,
    timeout: 60000,
  },
});

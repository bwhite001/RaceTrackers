import { defineConfig } from 'vitest/config';

/**
 * Vitest Configuration for E2E Tests
 * Scope: End-to-end workflow tests with Puppeteer
 * Files: test/e2e/**
 * Run with: npm run test:suite:e2e
 */
export default defineConfig({
  test: {
    name: 'e2e',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    include: [
      'test/e2e/**/*.test.{js,jsx}',
      'test/e2e/**/*.spec.{js,jsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'test/e2e/e2e-test-runner.js',
      'test/e2e/e2e-test-runner-fixed.js',
      'test/e2e/test-data-seeder.js'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/e2e',
      exclude: [
        'node_modules/',
        'test/setup.js',
      ],
    },
    deps: {
      inline: [
        '@testing-library/react',
        '@testing-library/user-event',
        '@testing-library/jest-dom'
      ]
    },
    isolate: true,
    testTimeout: 60000,
  }
});

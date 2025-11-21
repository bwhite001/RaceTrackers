import { defineConfig } from 'vitest/config';

/**
 * Vitest Configuration for E2E Tests
 * Scope: End-to-end workflow tests with Puppeteer
 * Files: src/test/e2e/**
 * Run with: npm run test:suite:e2e
 */
export default defineConfig({
  test: {
    name: 'e2e',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: [
      'src/test/e2e/**/*.test.{js,jsx}',
      'src/test/e2e/**/*.spec.{js,jsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/test/e2e/e2e-test-runner.js',
      'src/test/e2e/e2e-test-runner-fixed.js',
      'src/test/e2e/test-data-seeder.js'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/e2e',
      exclude: [
        'node_modules/',
        'src/test/setup.js',
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

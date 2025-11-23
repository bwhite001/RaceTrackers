import { defineConfig } from 'vitest/config';

/**
 * Vitest Configuration for Integration Tests
 * Scope: Cross-module workflows and data synchronization
 * Files: test/integration/**
 * Run with: npm run test:suite:integration
 */
export default defineConfig({
  test: {
    name: 'integration',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.js', './test/integration/setup.js'],
    include: [
      'test/integration/**/*.test.{js,jsx}',
      'test/integration/**/*.spec.{js,jsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/integration',
      exclude: [
        'node_modules/',
        'test/setup.js',
        'test/integration/setup.js',
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
    testTimeout: 30000,
  }
});

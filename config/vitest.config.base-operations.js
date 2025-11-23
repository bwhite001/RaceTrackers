import { defineConfig } from 'vitest/config';

/**
 * Vitest Configuration for Base Operations Tests
 * 
 * Scope: Base Station module components, dialogs, hooks, utils
 * Files: test/base-operations/**/*.test.{js,jsx}
 * 
 * Run with: npm run test:suite:base-operations
 */
export default defineConfig({
  test: {
    name: 'base-operations',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    include: [
      'test/base-operations/**/*.test.{js,jsx}',
      'test/base-operations/**/*.spec.{js,jsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/base-operations',
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
    // Isolate this suite
    isolate: true,
    // Timeout for component tests
    testTimeout: 15000,
  }
});

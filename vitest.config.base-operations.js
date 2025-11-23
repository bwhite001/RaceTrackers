import { defineConfig } from 'vitest/config';

/**
 * Vitest Configuration for Base Operations Tests
 * 
 * Scope: Base Station module components, dialogs, hooks, utils
 * Files: src/test/base-operations/**/*.test.{js,jsx}
 * 
 * Run with: npm run test:suite:base-operations
 */
export default defineConfig({
  test: {
    name: 'base-operations',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: [
      'src/test/base-operations/**/*.test.{js,jsx}',
      'src/test/base-operations/**/*.spec.{js,jsx}'
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
    // Isolate this suite
    isolate: true,
    // Timeout for component tests
    testTimeout: 15000,
  }
});

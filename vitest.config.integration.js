import { defineConfig } from 'vitest/config';

/**
 * Vitest Configuration for Integration Tests
 * Scope: Cross-module workflows and data synchronization
 * Files: src/test/integration/**
 * Run with: npm run test:suite:integration
 */
export default defineConfig({
  test: {
    name: 'integration',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js', './src/test/integration/setup.js'],
    include: [
      'src/test/integration/**/*.test.{js,jsx}',
      'src/test/integration/**/*.spec.{js,jsx}'
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
        'src/test/setup.js',
        'src/test/integration/setup.js',
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

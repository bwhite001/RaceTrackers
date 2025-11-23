import { defineConfig } from 'vitest/config';

/**
 * Vitest Configuration for Components Tests
 * Scope: Shared component tests
 * Files: test/components/**
 * Run with: npm run test:suite:components
 */
export default defineConfig({
  test: {
    name: 'components',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    include: [
      'test/components/**/*.test.{js,jsx}',
      'test/components/**/*.spec.{js,jsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/components',
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
    testTimeout: 15000,
  }
});

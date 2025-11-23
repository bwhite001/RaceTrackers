import { defineConfig } from 'vitest/config';

/**
 * Vitest Configuration for Services Tests
 * Scope: Service layer tests (import/export, validation)
 * Files: test/services/**
 * Run with: npm run test:suite:services
 */
export default defineConfig({
  test: {
    name: 'services',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    include: [
      'test/services/**/*.test.{js,jsx}',
      'test/services/**/*.spec.{js,jsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/services',
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

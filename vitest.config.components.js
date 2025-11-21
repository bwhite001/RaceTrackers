import { defineConfig } from 'vitest/config';

/**
 * Vitest Configuration for Components Tests
 * Scope: Shared component tests
 * Files: src/test/components/**
 * Run with: npm run test:suite:components
 */
export default defineConfig({
  test: {
    name: 'components',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: [
      'src/test/components/**/*.test.{js,jsx}',
      'src/test/components/**/*.spec.{js,jsx}'
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
    testTimeout: 15000,
  }
});

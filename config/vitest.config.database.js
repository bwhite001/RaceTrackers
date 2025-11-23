import { defineConfig } from 'vitest/config';

/**
 * Vitest Configuration for Database Tests
 * Scope: Database schema, migrations, and storage tests
 * Files: test/database/**
 * Run with: npm run test:suite:database
 */
export default defineConfig({
  test: {
    name: 'database',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    include: [
      'test/database/**/*.test.{js,jsx}',
      'test/database/**/*.spec.{js,jsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/database',
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
    testTimeout: 20000,
  }
});

import { defineConfig } from 'vitest/config';

/**
 * Vitest Configuration for Database Tests
 * Scope: Database schema, migrations, and storage tests
 * Files: src/test/database/**
 * Run with: npm run test:suite:database
 */
export default defineConfig({
  test: {
    name: 'database',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: [
      'src/test/database/**/*.test.{js,jsx}',
      'src/test/database/**/*.spec.{js,jsx}'
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
    testTimeout: 20000,
  }
});

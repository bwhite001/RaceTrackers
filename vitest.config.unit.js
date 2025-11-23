import { defineConfig } from 'vitest/config';

/**
 * Vitest Configuration for Unit Tests
 * 
 * Scope: Root-level component and store tests
 * Files: src/test/*.test.{js,jsx}
 * 
 * Run with: npm run test:suite:unit
 */
export default defineConfig({
  test: {
    name: 'unit',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: [
      'src/test/*.test.{js,jsx}',
      'src/test/*.spec.{js,jsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/integration/**',
      '**/base-operations/**',
      '**/database/**',
      '**/services/**',
      '**/components/**'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/unit',
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
    // Timeout for unit tests (shorter than integration/e2e)
    testTimeout: 10000,
  }
});

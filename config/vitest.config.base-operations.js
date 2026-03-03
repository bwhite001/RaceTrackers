import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

/**
 * Vitest Configuration for Base Operations Tests
 *
 * Scope: Base Station module components, dialogs, hooks, utils
 * Files: test/base-operations/ (test and spec files)
 *
 * Run with: npm run test:suite:base-operations
 */
export default defineConfig({
  resolve: {
    alias: {
      modules: path.resolve(rootDir, 'src/modules'),
      shared: path.resolve(rootDir, 'src/shared'),
      components: path.resolve(rootDir, 'src/components'),
      services: path.resolve(rootDir, 'src/services'),
      store: path.resolve(rootDir, 'src/store'),
      views: path.resolve(rootDir, 'src/views'),
      types: path.resolve(rootDir, 'src/types'),
    }
  },
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

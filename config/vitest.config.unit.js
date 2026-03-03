import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

/**
 * Vitest Configuration for Unit Tests
 *
 * Scope: Checkpoint, race-maintenance, and other non-suite tests
 * Files: test/ (checkpoint, race-maintenance, and other non-suite tests)
 *
 * Run with: npm run test:suite:unit
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
    name: 'unit',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    include: [
      'test/**/*.test.{js,jsx}',
      'test/**/*.spec.{js,jsx}'
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
    // Timeout for unit tests (shorter than integration/e2e)
    testTimeout: 10000,
  }
});

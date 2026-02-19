import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Allow test vi.mock() calls to use bare paths without 'src/' prefix.
      // Tests in test/base-operations/ use vi.mock('../../modules/...')
      // which resolves to /brandon/RaceTrackers/modules/ (doesn't exist).
      // These aliases map them to the actual src/ locations.
      modules: path.resolve(__dirname, 'src/modules'),
      shared: path.resolve(__dirname, 'src/shared'),
      components: path.resolve(__dirname, 'src/components'),
      services: path.resolve(__dirname, 'src/services'),
      store: path.resolve(__dirname, 'src/store'),
      views: path.resolve(__dirname, 'src/views'),
      types: path.resolve(__dirname, 'src/types'),
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.{test,spec}.{js,jsx}'],
    exclude: ['node_modules', 'test/e2e/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/setup.js',
      ],
    },
    server: {
      deps: {
        inline: [
          '@testing-library/react',
          '@testing-library/user-event',
          '@testing-library/jest-dom',
          '@headlessui/react',
        ]
      }
    }
  }
});

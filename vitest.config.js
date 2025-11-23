import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
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
    }
  }
});

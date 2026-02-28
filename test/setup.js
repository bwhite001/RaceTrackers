import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import 'fake-indexeddb/auto';

// Mock IntersectionObserver
class IntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
  }

  observe() {
    // Implementation
  }

  unobserve() {
    // Implementation
  }

  disconnect() {
    // Implementation
  }
}

// Mock ResizeObserver
class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {
    // Implementation
  }

  unobserve() {
    // Implementation
  }

  disconnect() {
    // Implementation
  }
}

// Setup globals
global.IntersectionObserver = IntersectionObserver;
global.ResizeObserver = ResizeObserver;

// scrollIntoView not implemented in jsdom — polyfill for focus-trap tests
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

// Mock window properties and methods commonly used in focus management
Object.defineProperties(window, {
  scrollTo: { value: vi.fn() },
  scrollBy: { value: vi.fn() },
  getComputedStyle: {
    value: (element) => ({
      getPropertyValue: (prop) => {
        return '';
      },
    }),
  },
});

// Setup jsdom focus handling
Object.defineProperties(HTMLElement.prototype, {
  offsetParent: {
    get() {
      return this.parentNode;
    },
  },
  offsetTop: {
    get() {
      return parseFloat(this.style.top) || 0;
    },
  },
  offsetLeft: {
    get() {
      return parseFloat(this.style.left) || 0;
    },
  },
  offsetWidth: {
    get() {
      return parseFloat(this.style.width) || 0;
    },
  },
  offsetHeight: {
    get() {
      return parseFloat(this.style.height) || 0;
    },
  },
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

// Console error/warning handling
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Not implemented') || args[0].includes('test was not wrapped'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Not implemented') || args[0].includes('test was not wrapped'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Add custom matchers
expect.extend({
  toHaveFocus(received) {
    const pass = received === document.activeElement;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to have focus`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to have focus`,
        pass: false,
      };
    }
  },
});

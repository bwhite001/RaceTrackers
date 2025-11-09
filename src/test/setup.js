import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.visualViewport
Object.defineProperty(window, 'visualViewport', {
  writable: true,
  value: {
    width: 1024,
    height: 768,
    scale: 1,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

// Mock touch detection
delete window.ontouchstart;
Object.defineProperty(window, 'ontouchstart', {
  configurable: true,
  value: undefined,
});

// Mock navigator
const mockNavigator = {
  maxTouchPoints: 0,
  userAgent: 'test',
};

Object.defineProperty(window, 'navigator', {
  configurable: true,
  value: mockNavigator,
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock requestAnimationFrame
global.requestAnimationFrame = callback => setTimeout(callback, 0);
global.cancelAnimationFrame = id => clearTimeout(id);

// Setup DOM testing environment
const portalRoot = document.createElement('div');
portalRoot.setAttribute('id', 'portal-root');
document.body.appendChild(portalRoot);

// Mock focus trap container
const createFocusTrapContainer = () => {
  const container = document.createElement('div');
  container.setAttribute('data-focus-trap', 'true');
  document.body.appendChild(container);
  return container;
};

// Mock live region
const createLiveRegion = () => {
  const region = document.createElement('div');
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  document.body.appendChild(region);
  return region;
};

// Make vi.fn() globally available like jest.fn()
global.jest = {
  fn: vi.fn,
  spyOn: vi.spyOn,
};

// Cleanup after each test
afterEach(() => {
  cleanup(); // Clean up React components
  vi.clearAllTimers();
  vi.clearAllMocks();
  window.matchMedia.mockClear();
  
  // Clear any DOM modifications
  document.body.innerHTML = '';
  const portal = document.getElementById('portal-root');
  if (portal) portal.innerHTML = '';
  
  // Reset any global overrides
  Element.prototype.scrollIntoView.mockClear();

  // Reset touch detection
  delete window.ontouchstart;
  Object.defineProperty(window, 'ontouchstart', {
    configurable: true,
    value: undefined,
  });
  Object.defineProperty(window.navigator, 'maxTouchPoints', {
    configurable: true,
    value: 0,
  });
});

// Export test utilities
export {
  createFocusTrapContainer,
  createLiveRegion,
  act,
};

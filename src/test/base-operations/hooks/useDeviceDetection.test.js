import { renderHook } from '@testing-library/react-hooks/dom';
import { useDeviceDetection, getDeviceType, isTouchDevice } from '../../../shared/hooks/useDeviceDetection';
import { beforeEach, describe, expect, test, vi } from 'vitest';

describe('Device Detection Hook - Critical Path Tests', () => {
  beforeEach(() => {
    // Reset window.matchMedia mock before each test
    window.matchMedia = vi.fn();
    
    // Reset window.innerWidth mock
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024 // Default to desktop
    });
  });

  describe('getDeviceType', () => {
    test('detects mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500 // Mobile width
      });
      
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('max-width: 640px'),
        media: query,
      }));
      
      expect(getDeviceType(500)).toBe('mobile');
    });

    test('detects tablet viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800 // Tablet width
      });
      
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('min-width: 641px') && query.includes('max-width: 1024px'),
        media: query,
      }));
      
      expect(getDeviceType(800)).toBe('tablet');
    });

    test('detects desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200 // Desktop width
      });
      
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('min-width: 1025px'),
        media: query,
      }));
      
      expect(getDeviceType(1200)).toBe('desktop');
    });
  });

  describe('useDeviceDetection hook', () => {
    test('returns correct initial state for desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });

      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('min-width: 1025px'),
        media: query,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }));

      const { result } = renderHook(() => useDeviceDetection());
      expect(result.current.deviceType).toBe('desktop');
    });

    test('returns correct initial state for mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });

      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('max-width: 640px'),
        media: query,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }));

      const { result } = renderHook(() => useDeviceDetection());
      expect(result.current.deviceType).toBe('mobile');
    });

    test('returns correct initial state for tablet', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      });

      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('min-width: 641px') && query.includes('max-width: 1024px'),
        media: query,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }));

      const { result } = renderHook(() => useDeviceDetection());
      expect(result.current.deviceType).toBe('tablet');
    });
  });

  describe('Breakpoint detection', () => {
    test('correctly identifies mobile breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });

      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('max-width: 640px'),
        media: query,
      }));

      const { result } = renderHook(() => useDeviceDetection());
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
    });

    test('correctly identifies tablet breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      });

      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('min-width: 641px') && query.includes('max-width: 1024px'),
        media: query,
      }));

      const { result } = renderHook(() => useDeviceDetection());
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });

    test('correctly identifies desktop breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });

      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('min-width: 1025px'),
        media: query,
      }));

      const { result } = renderHook(() => useDeviceDetection());
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
    });
  });

  describe('Touch detection', () => {
    beforeEach(() => {
      // Reset touch detection properties
      Object.defineProperty(window, 'ontouchstart', {
        configurable: true,
        value: undefined,
      });
      Object.defineProperty(window.navigator, 'maxTouchPoints', {
        configurable: true,
        value: 0,
      });
    });

    test('detects non-touch device by default in jsdom', () => {
      expect(isTouchDevice()).toBe(false);
    });

    test('detects touch device when touch points available', () => {
      Object.defineProperty(window.navigator, 'maxTouchPoints', {
        configurable: true,
        value: 5,
      });
      expect(isTouchDevice()).toBe(true);
    });
  });
});

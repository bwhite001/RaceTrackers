import { renderHook } from '@testing-library/react-hooks';
import {
  useDeviceDetection,
  isTouchDevice,
  getDeviceType,
  DEVICE_TYPES,
  BREAKPOINTS
} from '../../../shared/hooks/useDeviceDetection';

describe('Device Detection Hook - Critical Path Tests', () => {
  // Store original window properties
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  const originalMatchMedia = window.matchMedia;

  // Mock matchMedia
  const mockMatchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });

  beforeEach(() => {
    // Reset window properties before each test
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });

    window.matchMedia = mockMatchMedia;
  });

  afterEach(() => {
    // Restore original window properties
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });

    window.matchMedia = originalMatchMedia;
  });

  describe('getDeviceType', () => {
    test('detects mobile viewport', () => {
      expect(getDeviceType(500)).toBe(DEVICE_TYPES.MOBILE);
    });

    test('detects tablet viewport', () => {
      expect(getDeviceType(800)).toBe(DEVICE_TYPES.TABLET);
    });

    test('detects desktop viewport', () => {
      expect(getDeviceType(1200)).toBe(DEVICE_TYPES.DESKTOP);
    });
  });

  describe('useDeviceDetection hook', () => {
    test('returns correct initial state for desktop', () => {
      window.innerWidth = 1200;
      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current).toEqual(expect.objectContaining({
        deviceType: DEVICE_TYPES.DESKTOP,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1200,
        isPortrait: false,
        isLandscape: true
      }));
    });

    test('returns correct initial state for mobile', () => {
      window.innerWidth = 375;
      window.innerHeight = 667;
      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current).toEqual(expect.objectContaining({
        deviceType: DEVICE_TYPES.MOBILE,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        width: 375,
        isPortrait: true,
        isLandscape: false
      }));
    });

    test('returns correct initial state for tablet', () => {
      window.innerWidth = 800;
      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current).toEqual(expect.objectContaining({
        deviceType: DEVICE_TYPES.TABLET,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        width: 800
      }));
    });
  });

  describe('Breakpoint detection', () => {
    test('correctly identifies mobile breakpoint', () => {
      expect(BREAKPOINTS.mobile).toBe(768);
      expect(getDeviceType(767)).toBe(DEVICE_TYPES.MOBILE);
    });

    test('correctly identifies tablet breakpoint', () => {
      expect(BREAKPOINTS.tablet).toBe(1024);
      expect(getDeviceType(1023)).toBe(DEVICE_TYPES.TABLET);
    });

    test('correctly identifies desktop breakpoint', () => {
      expect(BREAKPOINTS.desktop).toBe(1024);
      expect(getDeviceType(1024)).toBe(DEVICE_TYPES.DESKTOP);
    });
  });

  describe('Touch detection', () => {
    test('detects non-touch device by default in jsdom', () => {
      expect(isTouchDevice()).toBe(false);
    });

    test('detects touch device when touch points available', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 5
      });

      expect(isTouchDevice()).toBe(true);

      // Reset
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 0
      });
    });
  });
});

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useDeviceDetection, { BREAKPOINTS, ORIENTATIONS } from '../../src/../shared/hooks/useDeviceDetection';

describe('useDeviceDetection Hook', () => {
  // Store original window dimensions
  let originalInnerWidth;
  let originalInnerHeight;

  beforeEach(() => {
    // Store original values
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;

    // Mock window resize method
    window.resizeTo = function(width, height) {
      Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
      window.dispatchEvent(new Event('resize'));
    };
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true });
    vi.clearAllMocks();
  });

  test('initializes with correct default values', () => {
    window.resizeTo(1024, 768);
    
    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
    expect(result.current.orientation).toBe(ORIENTATIONS.LANDSCAPE);
    expect(result.current.deviceType).toBe('desktop');
    expect(result.current.breakpoints).toEqual(BREAKPOINTS);
  });

  test('detects device type based on width', () => {
    const testCases = [
      { width: 400, expected: 'mobile' },
      { width: 700, expected: 'tablet' },
      { width: 1000, expected: 'desktop' },
      { width: 1200, expected: 'wide' },
      { width: 1400, expected: 'ultra-wide' }
    ];

    testCases.forEach(({ width, expected }) => {
      window.resizeTo(width, 768);
      const { result } = renderHook(() => useDeviceDetection());
      expect(result.current.deviceType).toBe(expected);
    });
  });

  test('handles orientation changes', () => {
    const { result } = renderHook(() => useDeviceDetection());

    // Test landscape
    act(() => {
      window.resizeTo(1024, 768);
    });
    expect(result.current.orientation).toBe(ORIENTATIONS.LANDSCAPE);
    expect(result.current.isLandscape).toBe(true);
    expect(result.current.isPortrait).toBe(false);

    // Test portrait
    act(() => {
      window.resizeTo(768, 1024);
    });
    expect(result.current.orientation).toBe(ORIENTATIONS.PORTRAIT);
    expect(result.current.isLandscape).toBe(false);
    expect(result.current.isPortrait).toBe(true);
  });

  test('supports custom breakpoints', () => {
    const customBreakpoints = {
      MOBILE: 500,
      TABLET: 800,
      DESKTOP: 1100,
      WIDE: 1400
    };

    const { result } = renderHook(() => 
      useDeviceDetection({ customBreakpoints })
    );

    expect(result.current.breakpoints).toEqual(customBreakpoints);

    // Test with custom breakpoint
    act(() => {
      window.resizeTo(600, 768);
    });
    expect(result.current.deviceType).toBe('tablet');
  });

  test('provides correct breakpoint checks', () => {
    const { result } = renderHook(() => useDeviceDetection());

    // Test mobile
    act(() => {
      window.resizeTo(400, 768);
    });
    expect(result.current.isMobile()).toBe(true);
    expect(result.current.isTablet()).toBe(false);
    expect(result.current.isDesktop()).toBe(false);

    // Test tablet
    act(() => {
      window.resizeTo(700, 768);
    });
    expect(result.current.isMobile()).toBe(false);
    expect(result.current.isTablet()).toBe(true);
    expect(result.current.isDesktop()).toBe(false);

    // Test desktop
    act(() => {
      window.resizeTo(1024, 768);
    });
    expect(result.current.isMobile()).toBe(false);
    expect(result.current.isTablet()).toBe(false);
    expect(result.current.isDesktop()).toBe(true);
  });

  test('responsive utility returns correct values', () => {
    const { result } = renderHook(() => useDeviceDetection());
    const config = {
      mobile: 'mobile-value',
      tablet: 'tablet-value',
      desktop: 'desktop-value',
      wide: 'wide-value',
      'ultra-wide': 'ultra-wide-value',
      default: 'default-value'
    };

    // Test different screen sizes
    act(() => {
      window.resizeTo(400, 768); // mobile
    });
    expect(result.current.responsive(config)).toBe('mobile-value');

    act(() => {
      window.resizeTo(700, 768); // tablet
    });
    expect(result.current.responsive(config)).toBe('tablet-value');

    act(() => {
      window.resizeTo(1024, 768); // desktop
    });
    expect(result.current.responsive(config)).toBe('desktop-value');
  });

  test('handles missing responsive values', () => {
    const { result } = renderHook(() => useDeviceDetection());
    const config = {
      default: 'default-value'
    };

    act(() => {
      window.resizeTo(400, 768);
    });
    expect(result.current.responsive(config)).toBe('default-value');
  });

  test('detects touch capability', () => {
    // Mock touch capability
    const originalMaxTouchPoints = navigator.maxTouchPoints;
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 1, configurable: true });

    const { result } = renderHook(() => useDeviceDetection());
    expect(result.current.hasTouch).toBe(true);

    // Restore original value
    Object.defineProperty(navigator, 'maxTouchPoints', { value: originalMaxTouchPoints, configurable: true });
  });

  test('handles window resize events', () => {
    const { result } = renderHook(() => useDeviceDetection());

    act(() => {
      window.resizeTo(800, 600);
    });
    expect(result.current.width).toBe(800);
    expect(result.current.height).toBe(600);

    act(() => {
      window.resizeTo(1200, 900);
    });
    expect(result.current.width).toBe(1200);
    expect(result.current.height).toBe(900);
  });

  test('cleans up resize listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useDeviceDetection());

    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});

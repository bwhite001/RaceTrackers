/**
 * Device Detection Hook
 * 
 * Detects device type, screen size, and capabilities
 * Used throughout the application for responsive behavior
 */

import { useState, useEffect } from 'react';

/**
 * Breakpoints (matches Tailwind defaults)
 */
export const BREAKPOINTS = {
  mobile: 768,    // < 768px
  tablet: 1024,   // 768px - 1024px
  desktop: 1024   // > 1024px
};

/**
 * Device types
 */
export const DEVICE_TYPES = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop'
};

/**
 * Check if device has touch capability
 */
export function isTouchDevice() {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get current device type based on screen width
 */
export function getDeviceType(width) {
  if (width < BREAKPOINTS.mobile) {
    return DEVICE_TYPES.MOBILE;
  } else if (width < BREAKPOINTS.desktop) {
    return DEVICE_TYPES.TABLET;
  } else {
    return DEVICE_TYPES.DESKTOP;
  }
}

/**
 * Get current orientation
 */
export function getOrientation() {
  if (typeof window === 'undefined') {
    return 'portrait';
  }

  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

/**
 * Check if device is iOS
 */
export function isIOS() {
  if (typeof window === 'undefined') {
    return false;
  }

  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

/**
 * Check if device is Android
 */
export function isAndroid() {
  if (typeof window === 'undefined') {
    return false;
  }

  return /Android/.test(navigator.userAgent);
}

/**
 * Check if device is mobile (phone)
 */
export function isMobile(width = null) {
  const w = width !== null ? width : (typeof window !== 'undefined' ? window.innerWidth : 1024);
  return w < BREAKPOINTS.mobile;
}

/**
 * Check if device is tablet
 */
export function isTablet(width = null) {
  const w = width !== null ? width : (typeof window !== 'undefined' ? window.innerWidth : 1024);
  return w >= BREAKPOINTS.mobile && w < BREAKPOINTS.desktop;
}

/**
 * Check if device is desktop
 */
export function isDesktop(width = null) {
  const w = width !== null ? width : (typeof window !== 'undefined' ? window.innerWidth : 1024);
  return w >= BREAKPOINTS.desktop;
}

/**
 * Check if device is in portrait orientation
 */
export function isPortrait() {
  if (typeof window === 'undefined') {
    return true;
  }

  return window.innerHeight > window.innerWidth;
}

/**
 * Check if device is in landscape orientation
 */
export function isLandscape() {
  return !isPortrait();
}

/**
 * Get viewport dimensions
 */
export function getViewportDimensions() {
  if (typeof window === 'undefined') {
    return { width: 1024, height: 768 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

/**
 * Check if virtual keyboard is likely open (iOS/Android)
 * This is a heuristic based on viewport height changes
 */
export function isVirtualKeyboardOpen() {
  if (typeof window === 'undefined') {
    return false;
  }

  // On mobile devices, when keyboard opens, visualViewport height < window.innerHeight
  if (window.visualViewport) {
    return window.visualViewport.height < window.innerHeight * 0.75;
  }

  return false;
}

/**
 * React Hook: useDeviceDetection
 * 
 * Provides reactive device detection that updates on window resize
 * 
 * @returns {Object} Device detection state
 * 
 * @example
 * const { isMobile, isTablet, isDesktop, isTouch, orientation } = useDeviceDetection();
 * 
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 */
export function useDeviceDetection() {
  const [deviceState, setDeviceState] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        deviceType: DEVICE_TYPES.DESKTOP,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        isIOS: false,
        isAndroid: false,
        orientation: 'landscape',
        isPortrait: false,
        isLandscape: true,
        isKeyboardOpen: false
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const deviceType = getDeviceType(width);
    const orientation = getOrientation();

    return {
      width,
      height,
      deviceType,
      isMobile: deviceType === DEVICE_TYPES.MOBILE,
      isTablet: deviceType === DEVICE_TYPES.TABLET,
      isDesktop: deviceType === DEVICE_TYPES.DESKTOP,
      isTouch: isTouchDevice(),
      isIOS: isIOS(),
      isAndroid: isAndroid(),
      orientation,
      isPortrait: orientation === 'portrait',
      isLandscape: orientation === 'landscape',
      isKeyboardOpen: isVirtualKeyboardOpen()
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateDeviceState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const deviceType = getDeviceType(width);
      const orientation = getOrientation();

      setDeviceState({
        width,
        height,
        deviceType,
        isMobile: deviceType === DEVICE_TYPES.MOBILE,
        isTablet: deviceType === DEVICE_TYPES.TABLET,
        isDesktop: deviceType === DEVICE_TYPES.DESKTOP,
        isTouch: isTouchDevice(),
        isIOS: isIOS(),
        isAndroid: isAndroid(),
        orientation,
        isPortrait: orientation === 'portrait',
        isLandscape: orientation === 'landscape',
        isKeyboardOpen: isVirtualKeyboardOpen()
      });
    };

    // Update on resize
    window.addEventListener('resize', updateDeviceState);

    // Update on orientation change
    window.addEventListener('orientationchange', updateDeviceState);

    // Update on visualViewport resize (keyboard open/close on mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateDeviceState);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateDeviceState);
      window.removeEventListener('orientationchange', updateDeviceState);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateDeviceState);
      }
    };
  }, []);

  return deviceState;
}

/**
 * React Hook: useMediaQuery
 * 
 * Provides reactive media query matching
 * 
 * @param {string} query - CSS media query string
 * @returns {boolean} Whether the media query matches
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
}

/**
 * React Hook: useBreakpoint
 * 
 * Provides current breakpoint name
 * 
 * @returns {string} Current breakpoint ('mobile', 'tablet', or 'desktop')
 * 
 * @example
 * const breakpoint = useBreakpoint();
 * 
 * if (breakpoint === 'mobile') {
 *   return <MobileNav />;
 * }
 */
export function useBreakpoint() {
  const { deviceType } = useDeviceDetection();
  return deviceType;
}

/**
 * React Hook: useOrientation
 * 
 * Provides current device orientation
 * 
 * @returns {string} Current orientation ('portrait' or 'landscape')
 * 
 * @example
 * const orientation = useOrientation();
 * 
 * if (orientation === 'portrait') {
 *   return <PortraitLayout />;
 * }
 */
export function useOrientation() {
  const { orientation } = useDeviceDetection();
  return orientation;
}

/**
 * React Hook: useViewportSize
 * 
 * Provides current viewport dimensions
 * 
 * @returns {Object} Viewport dimensions {width, height}
 * 
 * @example
 * const { width, height } = useViewportSize();
 */
export function useViewportSize() {
  const { width, height } = useDeviceDetection();
  return { width, height };
}

export default {
  // Constants
  BREAKPOINTS,
  DEVICE_TYPES,
  
  // Utility functions
  isTouchDevice,
  getDeviceType,
  getOrientation,
  isIOS,
  isAndroid,
  isMobile,
  isTablet,
  isDesktop,
  isPortrait,
  isLandscape,
  getViewportDimensions,
  isVirtualKeyboardOpen,
  
  // Hooks
  useDeviceDetection,
  useMediaQuery,
  useBreakpoint,
  useOrientation,
  useViewportSize
};

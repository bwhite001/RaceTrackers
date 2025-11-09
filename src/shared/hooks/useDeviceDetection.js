import { useState, useEffect, useCallback } from 'react';

/**
 * Device type breakpoints (in pixels)
 */
export const BREAKPOINTS = {
  MOBILE: 640,    // Matches Tailwind's 'sm'
  TABLET: 768,    // Matches Tailwind's 'md'
  DESKTOP: 1024,  // Matches Tailwind's 'lg'
  WIDE: 1280     // Matches Tailwind's 'xl'
};

/**
 * Device orientation types
 */
export const ORIENTATIONS = {
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape'
};

/**
 * Custom hook for device detection and responsive design
 * @param {Object} options - Configuration options
 * @param {Object} options.customBreakpoints - Custom breakpoint values
 * @param {boolean} options.watchOrientation - Whether to watch for orientation changes
 * @returns {Object} Device information and utility functions
 */
const useDeviceDetection = (options = {}) => {
  const {
    customBreakpoints = BREAKPOINTS,
    watchOrientation = true
  } = options;

  // State for device characteristics
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [height, setHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 0);
  const [orientation, setOrientation] = useState(
    typeof window !== 'undefined' 
      ? window.innerHeight > window.innerWidth 
        ? ORIENTATIONS.PORTRAIT 
        : ORIENTATIONS.LANDSCAPE
      : ORIENTATIONS.LANDSCAPE
  );

  // Determine device type based on width
  const getDeviceType = useCallback((w = width) => {
    if (w < customBreakpoints.MOBILE) return 'mobile';
    if (w < customBreakpoints.TABLET) return 'tablet';
    if (w < customBreakpoints.DESKTOP) return 'desktop';
    if (w < customBreakpoints.WIDE) return 'wide';
    return 'ultra-wide';
  }, [customBreakpoints, width]);

  // Handle window resize
  const handleResize = useCallback(() => {
    if (typeof window === 'undefined') return;

    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    setWidth(newWidth);
    setHeight(newHeight);

    if (watchOrientation) {
      setOrientation(
        newHeight > newWidth ? ORIENTATIONS.PORTRAIT : ORIENTATIONS.LANDSCAPE
      );
    }
  }, [watchOrientation]);

  // Set up resize listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  // Utility functions for breakpoint checks
  const isBreakpoint = useCallback((breakpoint) => {
    return width >= customBreakpoints[breakpoint];
  }, [width, customBreakpoints]);

  const isMobile = useCallback(() => width < customBreakpoints.MOBILE, [width, customBreakpoints]);
  const isTablet = useCallback(() => width >= customBreakpoints.MOBILE && width < customBreakpoints.TABLET, [width, customBreakpoints]);
  const isDesktop = useCallback(() => width >= customBreakpoints.DESKTOP, [width, customBreakpoints]);

  // Touch capability detection
  const hasTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return {
    // Device characteristics
    width,
    height,
    orientation,
    deviceType: getDeviceType(),
    hasTouch,

    // Breakpoint utilities
    isBreakpoint,
    isMobile,
    isTablet,
    isDesktop,

    // Raw breakpoint values
    breakpoints: customBreakpoints,

    // Orientation checks
    isPortrait: orientation === ORIENTATIONS.PORTRAIT,
    isLandscape: orientation === ORIENTATIONS.LANDSCAPE,

    // Utility for responsive values
    responsive: (config) => {
      const deviceType = getDeviceType();
      return config[deviceType] || config.default;
    }
  };
};

export default useDeviceDetection;

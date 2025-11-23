/**
 * DOM Manipulation Utilities for Settings
 * Handles applying settings changes to the document root
 */

/**
 * Apply dark mode theme to DOM
 * @param {boolean} darkMode - Enable dark mode
 */
export const applyThemeToDOM = (darkMode) => {
  document.documentElement.classList.toggle('dark', darkMode);
  
  // Update meta theme-color for PWA
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', darkMode ? '#1f2937' : '#ffffff');
  }
};

/**
 * Apply font size scaling to DOM
 * @param {number} fontSize - Font scale multiplier (0.8-1.5)
 */
export const applyFontSizeToDOM = (fontSize) => {
  document.documentElement.style.setProperty('--font-scale', fontSize.toString());
};

/**
 * Apply contrast mode to DOM
 * @param {string} mode - 'normal' or 'high'
 */
export const applyContrastToDOM = (mode) => {
  document.documentElement.classList.toggle('high-contrast', mode === 'high');
  document.documentElement.style.setProperty(
    '--high-contrast-multiplier',
    mode === 'high' ? '1.3' : '1'
  );
};

/**
 * Apply reduced motion preference to DOM
 * @param {boolean} enabled - Enable reduced motion
 */
export const applyReducedMotionToDOM = (enabled) => {
  document.documentElement.classList.toggle('reduce-motion', enabled);
};

/**
 * Apply touch optimization to DOM
 * @param {boolean} enabled - Enable touch optimization
 */
export const applyTouchOptimizedToDOM = (enabled) => {
  document.documentElement.classList.toggle('touch-optimized', enabled);
};

/**
 * Apply compact mode to DOM
 * @param {boolean} enabled - Enable compact mode
 */
export const applyCompactModeToDOM = (enabled) => {
  document.documentElement.classList.toggle('compact-mode', enabled);
};

/**
 * Apply status colors to DOM as CSS custom properties
 * @param {Object} statusColors - Object with status color mappings
 */
export const applyStatusColorsToDOM = (statusColors) => {
  Object.entries(statusColors).forEach(([status, color]) => {
    document.documentElement.style.setProperty(
      `--color-status-${status}`,
      color
    );
  });
};

/**
 * Initialize all settings on page load
 * @param {Object} settings - Complete settings object
 */
export const initializeSettings = (settings) => {
  applyThemeToDOM(settings.darkMode);
  applyFontSizeToDOM(settings.fontSize);
  applyContrastToDOM(settings.highContrastMode ? 'high' : 'normal');
  applyReducedMotionToDOM(settings.reducedMotion);
  applyTouchOptimizedToDOM(settings.touchOptimized);
  applyCompactModeToDOM(settings.compactMode);
  applyStatusColorsToDOM(settings.statusColors);
  
  // Respect system preferences as fallback
  if (!settings.reducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    applyReducedMotionToDOM(true);
  }
  
  if (!settings.darkMode && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // Only apply if user hasn't explicitly set dark mode
    // This is optional - you may want to respect user's explicit choice
  }
};

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
 * Apply sunlight mode to DOM (maximum contrast for outdoor use)
 * @param {boolean} enabled - Enable sunlight mode
 */
export const applySunlightModeToDOM = (enabled) => {
  document.documentElement.classList.toggle('sunlight-mode', enabled);
};

/**
 * Convert a hex color (#rrggbb or #rgb) to space-separated RGB channels ("r g b")
 * required by the CSS rgb(var(--x) / alpha) pattern used in index.css.
 * @param {string} hex
 * @returns {string} e.g. "34 197 94"
 */
const hexToChannels = (hex) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
};

/**
 * Apply status colors to DOM as CSS custom properties.
 * Converts hex values to space-separated RGB channels so that the
 * `rgb(var(--color-status-*) / alpha)` pattern in index.css works correctly.
 * @param {Object} statusColors - Object with status color mappings
 */
export const applyStatusColorsToDOM = (statusColors) => {
  Object.entries(statusColors).forEach(([status, color]) => {
    const value = typeof color === 'string' && color.startsWith('#')
      ? hexToChannels(color)
      : color;
    document.documentElement.style.setProperty(
      `--color-status-${status}`,
      value
    );
  });
};

/**
 * Initialize all settings on page load
 * @param {Object} settings - Complete settings object
 */
export const initializeSettings = (settings) => {
  applyThemeToDOM(settings.darkMode);
  applyContrastToDOM(settings.highContrastMode ? 'high' : 'normal');
  applyReducedMotionToDOM(settings.reducedMotion);
  applyTouchOptimizedToDOM(settings.touchOptimized);
  applyCompactModeToDOM(settings.compactMode);
  applySunlightModeToDOM(settings.sunlightMode ?? false);
  applyStatusColorsToDOM(settings.statusColors);

  // Touch devices: default to 1.1 font scale if user hasn't customised it
  const defaultFontScale = (settings.touchOptimized && settings.fontSize === 1.0) ? 1.1 : settings.fontSize;
  applyFontSizeToDOM(defaultFontScale);

  // Respect system preferences as fallback
  if (!settings.reducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    applyReducedMotionToDOM(true);
  }
};

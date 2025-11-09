/**
 * Accessibility Utilities
 * 
 * Utilities for managing focus, ARIA live regions, and screen reader announcements
 * Used throughout the application for accessible interactions
 */

/**
 * Create a focus trap for modal dialogs
 * Keeps focus within the specified element
 * 
 * @param {HTMLElement} element - The element to trap focus within
 * @returns {Object} Focus trap controller with activate/deactivate methods
 * 
 * @example
 * const trap = createFocusTrap(modalElement);
 * trap.activate();
 * // ... later
 * trap.deactivate();
 */
export function createFocusTrap(element) {
  if (!element) {
    console.warn('createFocusTrap: No element provided');
    return { activate: () => {}, deactivate: () => {} };
  }

  const focusableSelectors = [
    'a[href]',
    'area[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(',');

  let previouslyFocusedElement = null;
  let isActive = false;

  function getFocusableElements() {
    return Array.from(element.querySelectorAll(focusableSelectors))
      .filter(el => {
        // Filter out elements that are not visible
        return el.offsetParent !== null;
      });
  }

  function handleKeyDown(e) {
    if (!isActive || e.key !== 'Tab') {
      return;
    }

    const focusableElements = getFocusableElements();
    
    if (focusableElements.length === 0) {
      e.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  function activate() {
    if (isActive) {
      return;
    }

    // Store currently focused element
    previouslyFocusedElement = document.activeElement;

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Focus first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    isActive = true;
  }

  function deactivate() {
    if (!isActive) {
      return;
    }

    // Remove event listener
    document.removeEventListener('keydown', handleKeyDown);

    // Restore focus to previously focused element
    if (previouslyFocusedElement && previouslyFocusedElement.focus) {
      previouslyFocusedElement.focus();
    }

    isActive = false;
  }

  return {
    activate,
    deactivate,
    isActive: () => isActive
  };
}

/**
 * ARIA live region priorities
 */
export const LIVE_REGION_PRIORITIES = {
  POLITE: 'polite',
  ASSERTIVE: 'assertive',
  OFF: 'off'
};

/**
 * Create an ARIA live region for screen reader announcements
 * 
 * @param {string} priority - Priority level ('polite', 'assertive', or 'off')
 * @returns {HTMLElement} The live region element
 * 
 * @example
 * const liveRegion = createLiveRegion('polite');
 * document.body.appendChild(liveRegion);
 */
export function createLiveRegion(priority = LIVE_REGION_PRIORITIES.POLITE) {
  const liveRegion = document.createElement('div');
  
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', priority);
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only'; // Screen reader only
  
  // Position off-screen but still accessible to screen readers
  liveRegion.style.position = 'absolute';
  liveRegion.style.left = '-10000px';
  liveRegion.style.width = '1px';
  liveRegion.style.height = '1px';
  liveRegion.style.overflow = 'hidden';

  return liveRegion;
}

/**
 * Global live region manager
 */
let globalLiveRegion = null;

/**
 * Get or create the global live region
 * 
 * @returns {HTMLElement} The global live region element
 */
function getGlobalLiveRegion() {
  if (!globalLiveRegion) {
    globalLiveRegion = createLiveRegion(LIVE_REGION_PRIORITIES.POLITE);
    globalLiveRegion.id = 'global-live-region';
    
    if (typeof document !== 'undefined') {
      document.body.appendChild(globalLiveRegion);
    }
  }
  
  return globalLiveRegion;
}

/**
 * Announce a message to screen readers
 * 
 * @param {string} message - The message to announce
 * @param {string} priority - Priority level ('polite' or 'assertive')
 * @param {number} clearDelay - Delay before clearing the message (ms)
 * 
 * @example
 * announceToScreenReader('5 runners saved successfully', 'polite');
 * announceToScreenReader('Error: Invalid runner number', 'assertive');
 */
export function announceToScreenReader(message, priority = LIVE_REGION_PRIORITIES.POLITE, clearDelay = 1000) {
  if (!message || typeof document === 'undefined') {
    return;
  }

  const liveRegion = getGlobalLiveRegion();
  
  // Update priority if needed
  if (liveRegion.getAttribute('aria-live') !== priority) {
    liveRegion.setAttribute('aria-live', priority);
  }

  // Set the message
  liveRegion.textContent = message;

  // Clear after delay
  if (clearDelay > 0) {
    setTimeout(() => {
      if (liveRegion.textContent === message) {
        liveRegion.textContent = '';
      }
    }, clearDelay);
  }
}

/**
 * Manage focus for an element
 * Focuses the element and optionally scrolls it into view
 * 
 * @param {HTMLElement|string} elementOrSelector - Element or selector to focus
 * @param {Object} options - Focus options
 * @param {boolean} options.preventScroll - Prevent scrolling (default: false)
 * @param {boolean} options.scrollIntoView - Scroll into view (default: true)
 * @param {string} options.scrollBehavior - Scroll behavior ('auto' or 'smooth')
 * 
 * @example
 * manageFocus('#username-input');
 * manageFocus(buttonElement, { scrollBehavior: 'smooth' });
 */
export function manageFocus(elementOrSelector, options = {}) {
  const {
    preventScroll = false,
    scrollIntoView = true,
    scrollBehavior = 'smooth'
  } = options;

  let element;
  
  if (typeof elementOrSelector === 'string') {
    element = document.querySelector(elementOrSelector);
  } else {
    element = elementOrSelector;
  }

  if (!element) {
    console.warn('manageFocus: Element not found', elementOrSelector);
    return;
  }

  // Focus the element
  element.focus({ preventScroll });

  // Scroll into view if requested
  if (scrollIntoView && !preventScroll) {
    element.scrollIntoView({
      behavior: scrollBehavior,
      block: 'nearest',
      inline: 'nearest'
    });
  }
}

/**
 * Add skip link for keyboard navigation
 * Allows users to skip to main content
 * 
 * @param {string} targetId - ID of the main content element
 * @param {string} label - Label for the skip link
 * 
 * @example
 * addSkipLink('main-content', 'Skip to main content');
 */
export function addSkipLink(targetId, label = 'Skip to main content') {
  if (typeof document === 'undefined') {
    return;
  }

  // Check if skip link already exists
  if (document.getElementById('skip-link')) {
    return;
  }

  const skipLink = document.createElement('a');
  skipLink.id = 'skip-link';
  skipLink.href = `#${targetId}`;
  skipLink.textContent = label;
  skipLink.className = 'skip-link';

  // Style the skip link (hidden until focused)
  skipLink.style.position = 'absolute';
  skipLink.style.top = '-40px';
  skipLink.style.left = '0';
  skipLink.style.background = '#000';
  skipLink.style.color = '#fff';
  skipLink.style.padding = '8px';
  skipLink.style.textDecoration = 'none';
  skipLink.style.zIndex = '100';

  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });

  // Insert at the beginning of body
  document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * Check if an element is visible to screen readers
 * 
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} Whether the element is visible to screen readers
 */
export function isVisibleToScreenReader(element) {
  if (!element) {
    return false;
  }

  // Check aria-hidden
  if (element.getAttribute('aria-hidden') === 'true') {
    return false;
  }

  // Check if element or any parent has aria-hidden
  let parent = element.parentElement;
  while (parent) {
    if (parent.getAttribute('aria-hidden') === 'true') {
      return false;
    }
    parent = parent.parentElement;
  }

  return true;
}

/**
 * Get accessible name for an element
 * Follows ARIA naming computation
 * 
 * @param {HTMLElement} element - Element to get name for
 * @returns {string} Accessible name
 */
export function getAccessibleName(element) {
  if (!element) {
    return '';
  }

  // Check aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    return ariaLabel;
  }

  // Check aria-labelledby
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement) {
      return labelElement.textContent || '';
    }
  }

  // Check associated label
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) {
      return label.textContent || '';
    }
  }

  // Check title attribute
  const title = element.getAttribute('title');
  if (title) {
    return title;
  }

  // Check placeholder (for inputs)
  const placeholder = element.getAttribute('placeholder');
  if (placeholder) {
    return placeholder;
  }

  // Check text content
  return element.textContent || '';
}

/**
 * Announce a toast/notification to screen readers
 * 
 * @param {string} message - Message to announce
 * @param {string} type - Type of notification ('success', 'error', 'warning', 'info')
 */
export function announceNotification(message, type = 'info') {
  const priority = type === 'error' ? LIVE_REGION_PRIORITIES.ASSERTIVE : LIVE_REGION_PRIORITIES.POLITE;
  const prefix = {
    success: 'Success: ',
    error: 'Error: ',
    warning: 'Warning: ',
    info: ''
  }[type] || '';

  announceToScreenReader(prefix + message, priority);
}

/**
 * Create a visually hidden element (screen reader only)
 * 
 * @param {string} text - Text content
 * @returns {HTMLElement} Visually hidden element
 */
export function createScreenReaderOnly(text) {
  const element = document.createElement('span');
  element.className = 'sr-only';
  element.textContent = text;
  
  // Apply screen reader only styles
  element.style.position = 'absolute';
  element.style.width = '1px';
  element.style.height = '1px';
  element.style.padding = '0';
  element.style.margin = '-1px';
  element.style.overflow = 'hidden';
  element.style.clip = 'rect(0, 0, 0, 0)';
  element.style.whiteSpace = 'nowrap';
  element.style.border = '0';

  return element;
}

/**
 * Trap focus within a container when virtual keyboard is open
 * Useful for mobile devices
 * 
 * @param {HTMLElement} container - Container element
 * @param {HTMLElement} inputElement - Input element that triggered keyboard
 */
export function handleVirtualKeyboardFocus(container, inputElement) {
  if (!container || !inputElement) {
    return;
  }

  // Scroll input into view when keyboard opens
  const scrollIntoView = () => {
    setTimeout(() => {
      inputElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 300); // Delay to allow keyboard animation
  };

  inputElement.addEventListener('focus', scrollIntoView);

  return () => {
    inputElement.removeEventListener('focus', scrollIntoView);
  };
}

export default {
  // Focus management
  createFocusTrap,
  manageFocus,
  
  // Live regions
  LIVE_REGION_PRIORITIES,
  createLiveRegion,
  announceToScreenReader,
  announceNotification,
  
  // Utilities
  addSkipLink,
  isVisibleToScreenReader,
  getAccessibleName,
  createScreenReaderOnly,
  handleVirtualKeyboardFocus
};

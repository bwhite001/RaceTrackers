/**
 * Accessibility Utilities
 */

/**
 * Create a focus trap for modal dialogs
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
      .filter(el => el.offsetParent !== null);
  }

  function handleKeyDown(e) {
    if (!isActive || e.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) {
      e.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  function focusFirstElement() {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      try {
        // Ensure element is focusable
        focusableElements[0].setAttribute('tabindex', '0');
        
        // Focus the element
        focusableElements[0].focus();

        // Double-check focus was set
        if (document.activeElement !== focusableElements[0]) {
          // Try again with a delay
          setTimeout(() => {
            focusableElements[0].focus();
          }, 0);
        }
      } catch (e) {
        console.warn('Failed to set focus:', e);
      }
    }
  }

  return {
    activate() {
      if (isActive) return;

      // Store currently focused element
      previouslyFocusedElement = document.activeElement;

      // Add event listener
      document.addEventListener('keydown', handleKeyDown);

      // Focus first focusable element
      focusFirstElement();

      isActive = true;
    },

    deactivate() {
      if (!isActive) return;

      // Remove event listener
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus to previously focused element
      if (previouslyFocusedElement && previouslyFocusedElement.focus) {
        try {
          // Ensure element is focusable
          if (!previouslyFocusedElement.hasAttribute('tabindex')) {
            previouslyFocusedElement.setAttribute('tabindex', '0');
          }
          
          // Focus the element
          previouslyFocusedElement.focus();

          // Double-check focus was restored
          if (document.activeElement !== previouslyFocusedElement) {
            // Try again with a delay
            setTimeout(() => {
              previouslyFocusedElement.focus();
            }, 0);
          }
        } catch (e) {
          console.warn('Failed to restore focus:', e);
        }
      }

      isActive = false;
    },

    // For testing
    isActive: () => isActive,
    getPreviouslyFocusedElement: () => previouslyFocusedElement
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

// Global live region singleton
let globalLiveRegion = null;

/**
 * Create an ARIA live region
 */
export function createLiveRegion(priority = LIVE_REGION_PRIORITIES.POLITE) {
  const liveRegion = document.createElement('div');
  
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', priority);
  liveRegion.setAttribute('aria-atomic', 'true');
  
  // Position off-screen but accessible to screen readers
  Object.assign(liveRegion.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0'
  });

  document.body.appendChild(liveRegion);
  return liveRegion;
}

function getGlobalLiveRegion() {
  if (!globalLiveRegion || !document.body.contains(globalLiveRegion)) {
    globalLiveRegion = createLiveRegion(LIVE_REGION_PRIORITIES.POLITE);
  }
  return globalLiveRegion;
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message, priority = LIVE_REGION_PRIORITIES.POLITE, clearDelay = 1000) {
  if (!message || typeof document === 'undefined') return;

  const liveRegion = getGlobalLiveRegion();
  
  if (liveRegion.getAttribute('aria-live') !== priority) {
    liveRegion.setAttribute('aria-live', priority);
  }

  // Set message immediately
  liveRegion.textContent = message;

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
 */
export function manageFocus(elementOrSelector, options = {}) {
  const {
    preventScroll = false,
    scrollIntoView = true,
    scrollBehavior = 'smooth'
  } = options;

  const element = typeof elementOrSelector === 'string' 
    ? document.querySelector(elementOrSelector)
    : elementOrSelector;

  if (!element) {
    console.warn('manageFocus: Element not found', elementOrSelector);
    return;
  }

  try {
    // Ensure element is focusable
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
    
    // Focus immediately
    element.focus({ preventScroll });

    if (scrollIntoView && !preventScroll) {
      element.scrollIntoView({
        behavior: scrollBehavior,
        block: 'nearest',
        inline: 'nearest'
      });
    }
  } catch (e) {
    console.warn('Failed to set focus:', e);
  }
}

/**
 * Check if element is visible to screen readers
 */
export function isVisibleToScreenReader(element) {
  if (!element) return false;

  if (element.getAttribute('aria-hidden') === 'true') return false;

  let parent = element.parentElement;
  while (parent) {
    if (parent.getAttribute('aria-hidden') === 'true') return false;
    parent = parent.parentElement;
  }

  return true;
}

/**
 * Get accessible name for an element
 */
export function getAccessibleName(element) {
  if (!element) return '';

  // Check aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // Check aria-labelledby
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement) return labelElement.textContent || '';
  }

  // Check associated label
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent || '';
  }

  // Check text content
  return element.textContent || '';
}

/**
 * Announce notifications
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

export default {
  createFocusTrap,
  LIVE_REGION_PRIORITIES,
  createLiveRegion,
  announceToScreenReader,
  manageFocus,
  isVisibleToScreenReader,
  getAccessibleName,
  announceNotification
};

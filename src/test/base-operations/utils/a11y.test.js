import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
  createFocusTrap,
  createLiveRegion,
  announceToScreenReader,
  manageFocus,
  LIVE_REGION_PRIORITIES,
  isVisibleToScreenReader,
  getAccessibleName,
  announceNotification
} from '../../../utils/a11y';

// Helper to flush promises and timers
const flushPromisesAndTimers = async () => {
  await vi.runAllTimersAsync();
  await new Promise(resolve => setTimeout(resolve, 0));
};

describe('Accessibility Utilities - Critical Path Tests', () => {
  describe('Focus Trap', () => {
    let container;
    let button1;
    let button2;
    let button3;

    beforeEach(() => {
      vi.useFakeTimers();
      
      // Create a container with focusable elements
      container = document.createElement('div');
      container.setAttribute('data-testid', 'focus-trap-container');

      button1 = document.createElement('button');
      button2 = document.createElement('button');
      button3 = document.createElement('button');

      // Make buttons focusable in jsdom
      button1.setAttribute('tabindex', '0');
      button2.setAttribute('tabindex', '0');
      button3.setAttribute('tabindex', '0');

      // Add unique identifiers
      button1.setAttribute('data-testid', 'button-1');
      button2.setAttribute('data-testid', 'button-2');
      button3.setAttribute('data-testid', 'button-3');

      // Set text content separately
      const text1 = document.createTextNode('Button 1');
      const text2 = document.createTextNode('Button 2');
      const text3 = document.createTextNode('Button 3');

      button1.appendChild(text1);
      button2.appendChild(text2);
      button3.appendChild(text3);

      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(button3);

      document.body.appendChild(container);
    });

    afterEach(() => {
      vi.useRealTimers();
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    });

    test('traps focus within container', async () => {
      const trap = createFocusTrap(container);
      
      // Set initial focus state
      document.body.focus();
      expect(document.activeElement).toBe(document.body);
      
      // Activate trap
      trap.activate();
      await flushPromisesAndTimers();

      // Focus should be on first focusable element
      expect(document.activeElement).toBe(button1);
      expect(document.activeElement.getAttribute('data-testid')).toBe('button-1');

      // Simulate Tab key on last button
      button3.focus();
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true
      });
      button3.dispatchEvent(tabEvent);
      await flushPromisesAndTimers();

      // Focus should wrap to first element
      expect(document.activeElement).toBe(button1);
      expect(document.activeElement.getAttribute('data-testid')).toBe('button-1');
    });

    test('deactivates and restores focus', async () => {
      const outsideButton = document.createElement('button');
      outsideButton.setAttribute('tabindex', '0');
      outsideButton.setAttribute('data-testid', 'outside-button');
      outsideButton.textContent = 'Outside Button';
      document.body.appendChild(outsideButton);
      outsideButton.focus();

      const trap = createFocusTrap(container);

      // Verify initial focus
      expect(document.activeElement).toBe(outsideButton);
      expect(document.activeElement.getAttribute('data-testid')).toBe('outside-button');

      // Activate trap
      trap.activate();
      await flushPromisesAndTimers();

      // Focus should move into container
      expect(document.activeElement).toBe(button1);
      expect(document.activeElement.getAttribute('data-testid')).toBe('button-1');

      // Deactivate trap
      trap.deactivate();
      await flushPromisesAndTimers();

      // Focus should return to previous element
      expect(document.activeElement).toBe(outsideButton);
      expect(document.activeElement.getAttribute('data-testid')).toBe('outside-button');

      document.body.removeChild(outsideButton);
    });
  });

  describe('Live Region', () => {
    test('creates live region with correct attributes', () => {
      const liveRegion = createLiveRegion(LIVE_REGION_PRIORITIES.POLITE);

      expect(liveRegion.getAttribute('role')).toBe('status');
      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
    });

    test('creates assertive live region', () => {
      const liveRegion = createLiveRegion(LIVE_REGION_PRIORITIES.ASSERTIVE);
      expect(liveRegion.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('Screen Reader Announcements', () => {
    beforeEach(() => {
      // Clear any existing live regions
      document.querySelectorAll('[role="status"]').forEach(el => el.remove());
    });

    test('announces message to screen reader', () => {
      const message = 'Test announcement';
      announceToScreenReader(message);

      // Get the global live region
      const liveRegion = document.querySelector('[role="status"]');
      
      expect(liveRegion).toBeTruthy();
      expect(liveRegion.textContent).toBe(message);
    });

    test('clears announcement after delay', async () => {
      vi.useFakeTimers();
      
      const message = 'Test announcement';
      announceToScreenReader(message, LIVE_REGION_PRIORITIES.POLITE, 100);

      const liveRegion = document.querySelector('[role="status"]');
      
      // Message should be present initially
      expect(liveRegion.textContent).toBe(message);

      // Advance timers
      await vi.advanceTimersByTimeAsync(150);

      // Message should be cleared
      expect(liveRegion.textContent).toBe('');

      vi.useRealTimers();
    });
  });

  describe('Focus Management', () => {
    let element;

    beforeEach(() => {
      element = document.createElement('button');
      element.setAttribute('tabindex', '0');
      element.setAttribute('data-testid', 'test-button');
      element.textContent = 'Test Button';
      document.body.appendChild(element);
    });

    afterEach(() => {
      if (document.body.contains(element)) {
        document.body.removeChild(element);
      }
    });

    test('manages focus on element', async () => {
      document.body.focus();
      expect(document.activeElement).toBe(document.body);

      manageFocus(element);
      await flushPromisesAndTimers();

      expect(document.activeElement).toBe(element);
      expect(document.activeElement.getAttribute('data-testid')).toBe('test-button');
    });

    test('manages focus by selector', async () => {
      element.id = 'test-button';
      document.body.focus();
      expect(document.activeElement).toBe(document.body);

      manageFocus('#test-button');
      await flushPromisesAndTimers();

      expect(document.activeElement).toBe(element);
      expect(document.activeElement.getAttribute('data-testid')).toBe('test-button');
    });
  });

  describe('Screen Reader Visibility', () => {
    test('detects aria-hidden elements', () => {
      const element = document.createElement('div');
      element.setAttribute('aria-hidden', 'true');
      
      expect(isVisibleToScreenReader(element)).toBe(false);
    });

    test('detects visible elements', () => {
      const element = document.createElement('div');
      expect(isVisibleToScreenReader(element)).toBe(true);
    });

    test('checks parent aria-hidden', () => {
      const parent = document.createElement('div');
      const child = document.createElement('div');
      parent.appendChild(child);
      parent.setAttribute('aria-hidden', 'true');

      expect(isVisibleToScreenReader(child)).toBe(false);
    });
  });

  describe('Accessible Name Computation', () => {
    test('gets name from aria-label', () => {
      const element = document.createElement('button');
      element.setAttribute('aria-label', 'Test Label');
      
      expect(getAccessibleName(element)).toBe('Test Label');
    });

    test('gets name from text content', () => {
      const element = document.createElement('button');
      element.textContent = 'Test Button';
      
      expect(getAccessibleName(element)).toBe('Test Button');
    });

    test('gets name from associated label', () => {
      const input = document.createElement('input');
      const label = document.createElement('label');
      input.id = 'test-input';
      label.setAttribute('for', 'test-input');
      label.textContent = 'Test Label';
      
      document.body.appendChild(label);
      document.body.appendChild(input);

      expect(getAccessibleName(input)).toBe('Test Label');

      document.body.removeChild(label);
      document.body.removeChild(input);
    });
  });

  describe('Notifications', () => {
    beforeEach(() => {
      // Clear any existing live regions
      document.querySelectorAll('[role="status"]').forEach(el => el.remove());
    });

    test('announces different notification types', () => {
      // Success notification
      announceNotification('Operation successful', 'success');
      let liveRegion = document.querySelector('[role="status"]');
      expect(liveRegion.textContent).toBe('Success: Operation successful');

      // Error notification
      announceNotification('Something went wrong', 'error');
      expect(liveRegion.textContent).toBe('Error: Something went wrong');

      // Warning notification
      announceNotification('Please check your input', 'warning');
      expect(liveRegion.textContent).toBe('Warning: Please check your input');

      // Info notification
      announceNotification('System update available', 'info');
      expect(liveRegion.textContent).toBe('System update available');
    });
  });
});

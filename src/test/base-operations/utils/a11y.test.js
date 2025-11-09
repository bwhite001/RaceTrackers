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

describe('Accessibility Utilities - Critical Path Tests', () => {
  describe('Focus Trap', () => {
    let container;
    let button1;
    let button2;
    let button3;

    beforeEach(() => {
      // Create a container with focusable elements
      container = document.createElement('div');
      button1 = document.createElement('button');
      button2 = document.createElement('button');
      button3 = document.createElement('button');

      button1.textContent = 'Button 1';
      button2.textContent = 'Button 2';
      button3.textContent = 'Button 3';

      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(button3);

      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    test('traps focus within container', () => {
      const trap = createFocusTrap(container);
      trap.activate();

      // Focus should start on first focusable element
      expect(document.activeElement).toBe(button1);

      // Simulate Tab key
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true
      });

      button3.dispatchEvent(tabEvent);
      
      // Focus should wrap to first element
      expect(document.activeElement).toBe(button1);

      trap.deactivate();
    });

    test('deactivates and restores focus', () => {
      const outsideButton = document.createElement('button');
      document.body.appendChild(outsideButton);
      outsideButton.focus();

      const trap = createFocusTrap(container);
      trap.activate();

      // Focus should move into container
      expect(document.activeElement).not.toBe(outsideButton);

      trap.deactivate();

      // Focus should return to previous element
      expect(document.activeElement).toBe(outsideButton);

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
    let liveRegion;

    beforeEach(() => {
      // Clear any existing live regions
      document.querySelectorAll('[role="status"]').forEach(el => el.remove());
    });

    test('announces message to screen reader', () => {
      const message = 'Test announcement';
      announceToScreenReader(message);

      // Get the global live region
      liveRegion = document.querySelector('[role="status"]');
      
      expect(liveRegion).toBeTruthy();
      expect(liveRegion.textContent).toBe(message);
    });

    test('clears announcement after delay', async () => {
      const message = 'Test announcement';
      announceToScreenReader(message, LIVE_REGION_PRIORITIES.POLITE, 100);

      liveRegion = document.querySelector('[role="status"]');
      
      // Message should be present initially
      expect(liveRegion.textContent).toBe(message);

      // Wait for clear delay
      await new Promise(resolve => setTimeout(resolve, 150));

      // Message should be cleared
      expect(liveRegion.textContent).toBe('');
    });
  });

  describe('Focus Management', () => {
    let element;

    beforeEach(() => {
      element = document.createElement('button');
      document.body.appendChild(element);
    });

    afterEach(() => {
      document.body.removeChild(element);
    });

    test('manages focus on element', () => {
      manageFocus(element);
      expect(document.activeElement).toBe(element);
    });

    test('manages focus by selector', () => {
      element.id = 'test-button';
      manageFocus('#test-button');
      expect(document.activeElement).toBe(element);
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

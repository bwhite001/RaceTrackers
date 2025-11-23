import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import NetworkStatusIndicator from '../shared/components/NetworkStatusIndicator';
import { useRaceStore } from '../store/useRaceStore';

// Mock the race store
vi.mock('../store/useRaceStore', () => ({
  useRaceStore: vi.fn()
}));

describe('NetworkStatusIndicator', () => {
  let mockSetNetworkStatus;

  beforeEach(() => {
    // Reset mocks
    mockSetNetworkStatus = vi.fn();
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    // Mock useRaceStore
    useRaceStore.mockReturnValue(mockSetNetworkStatus);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not show banner on initial mount', () => {
    const { container } = render(<NetworkStatusIndicator />);
    expect(container.querySelector('.network-banner')).not.toBeInTheDocument();
  });

  it('should show offline message when navigator.onLine becomes false', async () => {
    const { rerender } = render(<NetworkStatusIndicator />);
    
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    window.dispatchEvent(new Event('offline'));
    
    rerender(<NetworkStatusIndicator />);
    
    await waitFor(() => {
      expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
    });
  });

  it('should show online message when connection is restored', async () => {
    // Start offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    const { rerender } = render(<NetworkStatusIndicator />);
    
    // Trigger offline event
    window.dispatchEvent(new Event('offline'));
    rerender(<NetworkStatusIndicator />);
    
    // Go back online
    Object.defineProperty(navigator, 'onLine', { value: true });
    window.dispatchEvent(new Event('online'));
    rerender(<NetworkStatusIndicator />);
    
    await waitFor(() => {
      expect(screen.getByText(/you're back online/i)).toBeInTheDocument();
    });
  });

  it('should hide online message after 3 seconds', async () => {
    vi.useFakeTimers();
    
    // Start offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    const { rerender } = render(<NetworkStatusIndicator />);
    
    // Trigger offline event
    window.dispatchEvent(new Event('offline'));
    rerender(<NetworkStatusIndicator />);
    
    // Go back online
    Object.defineProperty(navigator, 'onLine', { value: true });
    window.dispatchEvent(new Event('online'));
    rerender(<NetworkStatusIndicator />);
    
    await waitFor(() => {
      expect(screen.getByText(/you're back online/i)).toBeInTheDocument();
    });
    
    // Fast-forward time by 3 seconds
    vi.advanceTimersByTime(3000);
    rerender(<NetworkStatusIndicator />);
    
    await waitFor(() => {
      expect(screen.queryByText(/you're back online/i)).not.toBeInTheDocument();
    });
    
    vi.useRealTimers();
  });

  it('should keep offline message visible until reconnection', async () => {
    vi.useFakeTimers();
    
    const { rerender } = render(<NetworkStatusIndicator />);
    
    // Go offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    window.dispatchEvent(new Event('offline'));
    rerender(<NetworkStatusIndicator />);
    
    await waitFor(() => {
      expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
    });
    
    // Wait 5 seconds - message should still be visible
    vi.advanceTimersByTime(5000);
    rerender(<NetworkStatusIndicator />);
    
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
    
    vi.useRealTimers();
  });

  it('should have correct CSS classes for offline state', async () => {
    const { rerender } = render(<NetworkStatusIndicator />);
    
    // Go offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    window.dispatchEvent(new Event('offline'));
    rerender(<NetworkStatusIndicator />);
    
    await waitFor(() => {
      const banner = screen.getByRole('status');
      expect(banner).toHaveClass('network-banner', 'offline');
    });
  });

  it('should have correct CSS classes for online state', async () => {
    // Start offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    const { rerender } = render(<NetworkStatusIndicator />);
    
    window.dispatchEvent(new Event('offline'));
    rerender(<NetworkStatusIndicator />);
    
    // Go online
    Object.defineProperty(navigator, 'onLine', { value: true });
    window.dispatchEvent(new Event('online'));
    rerender(<NetworkStatusIndicator />);
    
    await waitFor(() => {
      const banner = screen.getByRole('status');
      expect(banner).toHaveClass('network-banner', 'online');
    });
  });

  it('should have proper ARIA attributes for accessibility', async () => {
    const { rerender } = render(<NetworkStatusIndicator />);
    
    // Go offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    window.dispatchEvent(new Event('offline'));
    rerender(<NetworkStatusIndicator />);
    
    await waitFor(() => {
      const banner = screen.getByRole('status');
      expect(banner).toHaveAttribute('aria-live', 'polite');
      expect(banner).toHaveAttribute('aria-atomic', 'true');
    });
  });

  it('should display warning icon when offline', async () => {
    const { rerender } = render(<NetworkStatusIndicator />);
    
    // Go offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    window.dispatchEvent(new Event('offline'));
    rerender(<NetworkStatusIndicator />);
    
    await waitFor(() => {
      expect(screen.getByText('⚠')).toBeInTheDocument();
    });
  });

  it('should display checkmark icon when online', async () => {
    // Start offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    const { rerender } = render(<NetworkStatusIndicator />);
    
    window.dispatchEvent(new Event('offline'));
    rerender(<NetworkStatusIndicator />);
    
    // Go online
    Object.defineProperty(navigator, 'onLine', { value: true });
    window.dispatchEvent(new Event('online'));
    rerender(<NetworkStatusIndicator />);
    
    await waitFor(() => {
      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });

  it('should call setNetworkStatus when status changes', async () => {
    render(<NetworkStatusIndicator />);
    
    // Verify initial call
    expect(mockSetNetworkStatus).toHaveBeenCalledWith(true);
    
    // Go offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    window.dispatchEvent(new Event('offline'));
    
    await waitFor(() => {
      expect(mockSetNetworkStatus).toHaveBeenCalledWith(false);
    });
  });
});

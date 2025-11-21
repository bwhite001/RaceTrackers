import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useNetworkStatus from '../shared/hooks/useNetworkStatus';
import { useRaceStore } from '../store/useRaceStore';

// Mock the race store
vi.mock('../store/useRaceStore', () => ({
  useRaceStore: vi.fn()
}));

describe('useNetworkStatus', () => {
  let mockSetNetworkStatus;
  let consoleLogSpy;

  beforeEach(() => {
    // Mock setNetworkStatus function
    mockSetNetworkStatus = vi.fn();
    useRaceStore.mockReturnValue(mockSetNetworkStatus);

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    // Spy on console.log
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleLogSpy.mockRestore();
  });

  it('should return initial online status', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
  });

  it('should return initial offline status when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(false);
  });

  it('should call setNetworkStatus with initial status on mount', () => {
    renderHook(() => useNetworkStatus());
    expect(mockSetNetworkStatus).toHaveBeenCalledWith(true);
  });

  it('should update status when going offline', () => {
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.isOnline).toBe(true);
    
    // Simulate going offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });
    
    expect(result.current.isOnline).toBe(false);
    expect(mockSetNetworkStatus).toHaveBeenCalledWith(false);
  });

  it('should update status when coming back online', () => {
    // Start offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.isOnline).toBe(false);
    
    // Go back online
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
    });
    
    expect(result.current.isOnline).toBe(true);
    expect(mockSetNetworkStatus).toHaveBeenCalledWith(true);
  });

  it('should log network status changes', () => {
    renderHook(() => useNetworkStatus());
    
    // Go offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });
    
    expect(consoleLogSpy).toHaveBeenCalledWith('🔴 Network: OFFLINE');
    
    // Go back online
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
    });
    
    expect(consoleLogSpy).toHaveBeenCalledWith('🟢 Network: ONLINE');
  });

  it('should handle multiple status changes', () => {
    const { result } = renderHook(() => useNetworkStatus());
    
    // Go offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);
    
    // Go online
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.isOnline).toBe(true);
    
    // Go offline again
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);
    
    // Verify all calls to setNetworkStatus
    expect(mockSetNetworkStatus).toHaveBeenCalledTimes(4); // Initial + 3 changes
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderHook(() => useNetworkStatus());
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    
    removeEventListenerSpy.mockRestore();
  });

  it('should not update after unmount', () => {
    const { result, unmount } = renderHook(() => useNetworkStatus());
    
    const initialCallCount = mockSetNetworkStatus.mock.calls.length;
    
    unmount();
    
    // Try to trigger events after unmount
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });
    
    // Should not have called setNetworkStatus again
    expect(mockSetNetworkStatus).toHaveBeenCalledTimes(initialCallCount);
  });

  it('should sync with race store on every status change', () => {
    renderHook(() => useNetworkStatus());
    
    // Clear initial call
    mockSetNetworkStatus.mockClear();
    
    // Go offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });
    
    expect(mockSetNetworkStatus).toHaveBeenCalledWith(false);
    expect(mockSetNetworkStatus).toHaveBeenCalledTimes(1);
    
    mockSetNetworkStatus.mockClear();
    
    // Go online
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
    });
    
    expect(mockSetNetworkStatus).toHaveBeenCalledWith(true);
    expect(mockSetNetworkStatus).toHaveBeenCalledTimes(1);
  });

  it('should handle rapid status changes', () => {
    const { result } = renderHook(() => useNetworkStatus());
    
    // Rapid changes
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
      
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
      
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });
    
    // Should end up offline
    expect(result.current.isOnline).toBe(false);
    
    // Should have called setNetworkStatus for each change
    expect(mockSetNetworkStatus).toHaveBeenCalledTimes(4); // Initial + 3 changes
  });
});

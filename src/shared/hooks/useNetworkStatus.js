import { useState, useEffect } from 'react';
import { useRaceStore } from '../../store/useRaceStore';

/**
 * Custom hook for monitoring network status
 * Tracks online/offline state and syncs with the race store
 * 
 * @returns {Object} Network status object
 * @returns {boolean} isOnline - Current network status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const setNetworkStatus = useRaceStore(state => state.setNetworkStatus);

  useEffect(() => {
    const handleOnline = () => {
      console.log('🟢 Network: ONLINE');
      setIsOnline(true);
      setNetworkStatus(true);
    };

    const handleOffline = () => {
      console.log('🔴 Network: OFFLINE');
      setIsOnline(false);
      setNetworkStatus(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial status in store
    setNetworkStatus(navigator.onLine);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setNetworkStatus]);

  return { isOnline };
}

export default useNetworkStatus;

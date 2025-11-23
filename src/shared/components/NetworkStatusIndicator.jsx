import React, { useEffect, useState } from 'react';
import useNetworkStatus from '../hooks/useNetworkStatus';
import './NetworkStatusIndicator.css';

/**
 * NetworkStatusIndicator Component
 * Displays a banner notification when the user goes offline or comes back online
 * 
 * Features:
 * - Shows "You're offline" message when connection is lost (persistent)
 * - Shows "You're back online" message when connection is restored (auto-dismisses after 3s)
 * - Smooth slide-down animation
 * - Accessible with ARIA live regions
 * - Mobile responsive
 */
const NetworkStatusIndicator = () => {
  const { isOnline } = useNetworkStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [lastStatus, setLastStatus] = useState(isOnline);

  useEffect(() => {
    // Only show banner when status changes (not on initial mount)
    if (isOnline !== lastStatus) {
      setShowBanner(true);
      setLastStatus(isOnline);

      if (isOnline) {
        // Hide "Back online" message after 3 seconds
        const timer = setTimeout(() => setShowBanner(false), 3000);
        return () => clearTimeout(timer);
      }
      // Keep "You're offline" visible until reconnect
    }
  }, [isOnline, lastStatus]);

  if (!showBanner) return null;

  return (
    <div 
      className={`network-banner ${isOnline ? 'online' : 'offline'}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="network-banner__content">
        {isOnline ? (
          <>
            <span className="network-banner__icon" aria-hidden="true">✓</span>
            <span className="network-banner__text">You're back online</span>
          </>
        ) : (
          <>
            <span className="network-banner__icon" aria-hidden="true">⚠</span>
            <span className="network-banner__text">
              You're offline — Changes will sync when reconnected
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkStatusIndicator;

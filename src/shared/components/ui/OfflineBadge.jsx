import React, { useState, useEffect } from 'react';
import { SignalSlashIcon } from '@heroicons/react/24/solid';

/**
 * OfflineBadge — renders a gold pill badge only when the browser is offline.
 * Listens to the window online/offline events so it updates automatically.
 *
 * @example
 * <OfflineBadge />
 * <OfflineBadge className="ml-3" />
 */
const OfflineBadge = ({ className = '' }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <span
      role="status"
      aria-label="Application is offline"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                  bg-accent-gold-100 dark:bg-accent-gold-900/30
                  text-accent-gold-800 dark:text-accent-gold-300
                  text-xs font-semibold ${className}`}
    >
      <SignalSlashIcon className="w-3.5 h-3.5" aria-hidden="true" />
      Offline
    </span>
  );
};

export default OfflineBadge;

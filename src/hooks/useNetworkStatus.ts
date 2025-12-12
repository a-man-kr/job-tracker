/**
 * Network Status Hook
 * Detects online/offline status and provides notifications
 * Requirements: 4.2, 4.3
 */

import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean; // True if was offline and just came back online
}

/**
 * Hook to monitor network connectivity status
 * Requirements: 4.2, 4.3
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  const handleOnline = useCallback(() => {
    setWasOffline(!isOnline); // Mark as "was offline" if we were offline
    setIsOnline(true);
  }, [isOnline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(false);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Reset wasOffline after a short delay
  useEffect(() => {
    if (wasOffline) {
      const timer = setTimeout(() => setWasOffline(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [wasOffline]);

  return { isOnline, wasOffline };
}

export default useNetworkStatus;

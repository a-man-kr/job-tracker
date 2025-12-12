/**
 * Network Status Component
 * Shows notification when offline or when connection is restored
 * Requirements: 4.2, 4.3
 */

import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function NetworkStatus() {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) {
    return null;
  }

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 flex items-center gap-3">
          <svg
            className="h-5 w-5 text-yellow-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800">
              You're offline
            </p>
            <p className="text-xs text-yellow-600">
              Changes won't sync until you're back online
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Just came back online
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 animate-fade-in">
      <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 flex items-center gap-3">
        <svg
          className="h-5 w-5 text-green-600 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <p className="text-sm font-medium text-green-800">
          Back online - syncing changes
        </p>
      </div>
    </div>
  );
}

export default NetworkStatus;

/**
 * StorageWarning Component - Displays warning when localStorage is unavailable
 * Requirements: 8.3 - Display user-friendly error message when storage operations fail
 */

interface StorageWarningProps {
  onDismiss?: () => void;
}

/**
 * Warning banner displayed when localStorage is not available
 * This can happen in private browsing mode or when quota is exceeded
 */
export function StorageWarning({ onDismiss }: StorageWarningProps) {
  return (
    <div
      className="bg-yellow-50 border-b border-yellow-200"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-yellow-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
                Storage unavailable
              </p>
              <p className="text-sm text-yellow-700">
                Your data will not be saved. This may be due to private browsing mode or storage quota limits.
              </p>
            </div>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="flex-shrink-0 text-yellow-600 hover:text-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 rounded p-1"
              aria-label="Dismiss warning"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default StorageWarning;

/**
 * DeleteConfirmation Component - Modal dialog for confirming job deletion
 * Requirements: 9.1, 9.2, 9.3
 */

import { useEffect, useRef, useCallback } from 'react';

interface DeleteConfirmationProps {
  isOpen: boolean;
  jobTitle: string;
  company: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * DeleteConfirmation component - displays a confirmation dialog before deleting a job
 * Requirements: 9.1 - prompt for confirmation before deletion
 * Requirements: 9.2 - deletion confirmed removes job and associated contacts
 * Requirements: 9.3 - update list view immediately after deletion
 */
export function DeleteConfirmation({
  isOpen,
  jobTitle,
  company,
  onConfirm,
  onCancel,
}: DeleteConfirmationProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button when modal opens (safer default)
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => cancelButtonRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onCancel();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onCancel]);

  // Handle escape key to close
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onCancel]);

  // Handle confirm with keyboard
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && event.target === cancelButtonRef.current) {
        // If focused on cancel, don't trigger delete
        return;
      }
    },
    []
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className="relative w-full max-w-md bg-white rounded-xl shadow-xl transform transition-all"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
          onKeyDown={handleKeyDown}
        >
          {/* Content */}
          <div className="p-6">
            {/* Warning icon */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
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
            </div>

            {/* Title and description */}
            <div className="mt-4 text-center">
              <h3
                id="delete-dialog-title"
                className="text-lg font-semibold text-gray-900"
              >
                Delete Job Application
              </h3>
              <p
                id="delete-dialog-description"
                className="mt-2 text-sm text-gray-600"
              >
                Are you sure you want to delete{' '}
                <span className="font-medium text-gray-900">{jobTitle}</span>
                {company && (
                  <>
                    {' '}at{' '}
                    <span className="font-medium text-gray-900">{company}</span>
                  </>
                )}
                ? This will also remove all associated referral contacts. This action cannot be undone.
              </p>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmation;

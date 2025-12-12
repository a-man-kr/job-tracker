/**
 * useToast Hook - Manages toast notification state
 * Requirements: 1.7, 8.3, 12.4 - Display clear, actionable error messages
 */

import { useState, useCallback } from 'react';
import type { ToastMessage, ToastType } from '../components/Toast';
import { generateToastId } from '../components/Toast';

interface UseToastReturn {
  toasts: ToastMessage[];
  addToast: (type: ToastType, message: string, options?: { onRetry?: () => void; duration?: number }) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  showError: (message: string, onRetry?: () => void) => string;
  showWarning: (message: string) => string;
  showSuccess: (message: string) => string;
  showInfo: (message: string) => string;
}

/**
 * Custom hook for managing toast notifications
 */
export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (
      type: ToastType,
      message: string,
      options?: { onRetry?: () => void; duration?: number }
    ): string => {
      const id = generateToastId();
      const newToast: ToastMessage = {
        id,
        type,
        message,
        onRetry: options?.onRetry,
        duration: options?.duration,
      };

      setToasts((prev) => [...prev, newToast]);
      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods for common toast types
  const showError = useCallback(
    (message: string, onRetry?: () => void): string => {
      return addToast('error', message, { onRetry, duration: 0 }); // Errors don't auto-dismiss
    },
    [addToast]
  );

  const showWarning = useCallback(
    (message: string): string => {
      return addToast('warning', message, { duration: 7000 });
    },
    [addToast]
  );

  const showSuccess = useCallback(
    (message: string): string => {
      return addToast('success', message, { duration: 3000 });
    },
    [addToast]
  );

  const showInfo = useCallback(
    (message: string): string => {
      return addToast('info', message, { duration: 5000 });
    },
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    showError,
    showWarning,
    showSuccess,
    showInfo,
  };
}

export default useToast;

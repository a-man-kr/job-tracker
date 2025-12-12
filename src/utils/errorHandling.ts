/**
 * Error Handling Utilities
 * Provides user-friendly error messages and retry logic
 * Requirements: 4.1, 4.2, 4.3
 */

/**
 * Error types for categorization
 */
export type ErrorType = 
  | 'network'
  | 'auth'
  | 'storage'
  | 'validation'
  | 'unknown';

/**
 * Structured error with user-friendly message
 */
export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  retryable: boolean;
}

/**
 * Map error to user-friendly message
 * Requirements: 4.1
 */
export function mapErrorToMessage(error: unknown): AppError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('failed to fetch') ||
      message.includes('connection')
    ) {
      return {
        type: 'network',
        message: 'Unable to connect. Please check your internet connection.',
        originalError: error,
        retryable: true,
      };
    }
    
    // Auth errors
    if (
      message.includes('unauthorized') ||
      message.includes('unauthenticated') ||
      message.includes('session expired') ||
      message.includes('jwt')
    ) {
      return {
        type: 'auth',
        message: 'Your session has expired. Please sign in again.',
        originalError: error,
        retryable: false,
      };
    }
    
    // Storage/database errors
    if (
      message.includes('storage') ||
      message.includes('database') ||
      message.includes('quota')
    ) {
      return {
        type: 'storage',
        message: 'Unable to save data. Please try again.',
        originalError: error,
        retryable: true,
      };
    }
    
    // Validation errors
    if (
      message.includes('invalid') ||
      message.includes('required') ||
      message.includes('validation')
    ) {
      return {
        type: 'validation',
        message: error.message,
        originalError: error,
        retryable: false,
      };
    }
    
    // Unknown error with original message
    return {
      type: 'unknown',
      message: error.message || 'An unexpected error occurred. Please try again.',
      originalError: error,
      retryable: true,
    };
  }
  
  // Non-Error thrown
  return {
    type: 'unknown',
    message: 'An unexpected error occurred. Please try again.',
    retryable: true,
  };
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

/**
 * Execute an async operation with retry logic
 * Requirements: 4.1
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxAttempts, delayMs, backoffMultiplier } = {
    ...defaultRetryConfig,
    ...config,
  };
  
  let lastError: Error | undefined;
  let currentDelay = delayMs;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is retryable
      const appError = mapErrorToMessage(error);
      if (!appError.retryable || attempt === maxAttempts) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= backoffMultiplier;
    }
  }
  
  throw lastError;
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return mapErrorToMessage(error).type === 'network';
}

/**
 * Check if an error is an auth error
 */
export function isAuthError(error: unknown): boolean {
  return mapErrorToMessage(error).type === 'auth';
}

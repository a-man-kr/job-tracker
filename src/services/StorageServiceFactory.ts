/**
 * Storage Service Factory
 * Creates the appropriate storage service based on authentication state
 * Requirements: 6.3
 */

import { LocalStorageServiceAsync, type IAsyncStorageService } from './StorageService';
import { SupabaseStorageService } from './SupabaseStorageService';

/**
 * Create a storage service based on authentication state
 * Returns SupabaseStorageService when authenticated, LocalStorageServiceAsync otherwise
 * Requirements: 6.3
 */
export function createStorageService(userId: string | null): IAsyncStorageService {
  if (userId) {
    return new SupabaseStorageService(userId);
  }
  return new LocalStorageServiceAsync();
}

/**
 * Storage Service Factory class for more complex scenarios
 */
export class StorageServiceFactory {
  private currentService: IAsyncStorageService | null = null;
  private currentUserId: string | null = null;

  /**
   * Get or create a storage service for the given user
   * Caches the service instance for the same user
   */
  getService(userId: string | null): IAsyncStorageService {
    // Return cached service if user hasn't changed
    if (this.currentService && this.currentUserId === userId) {
      return this.currentService;
    }

    // Create new service for the user
    this.currentUserId = userId;
    this.currentService = createStorageService(userId);
    return this.currentService;
  }

  /**
   * Clear the cached service (useful on logout)
   */
  clearCache(): void {
    this.currentService = null;
    this.currentUserId = null;
  }
}

// Singleton factory instance
export const storageServiceFactory = new StorageServiceFactory();

export default storageServiceFactory;

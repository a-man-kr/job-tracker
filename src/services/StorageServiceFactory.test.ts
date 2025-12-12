/**
 * Property-Based Tests for Storage Service Factory
 * **Feature: supabase-cloud-storage, Property 7: Storage Interface Contract**
 * **Validates: Requirements 6.2**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createStorageService, StorageServiceFactory } from './StorageServiceFactory';
import { LocalStorageServiceAsync } from './StorageService';
import { SupabaseStorageService } from './SupabaseStorageService';

describe('StorageServiceFactory', () => {
  /**
   * **Feature: supabase-cloud-storage, Property 7: Storage Interface Contract**
   * For any storage operation (save, get, getAll, update, delete), both
   * LocalStorageService and SupabaseStorageService implementations SHALL
   * accept the same input types and return the same output types.
   * **Validates: Requirements 6.2**
   */
  describe('Property 7: Storage Interface Contract', () => {
    it('createStorageService returns LocalStorageServiceAsync when userId is null', () => {
      fc.assert(
        fc.property(fc.constant(null), (userId) => {
          const service = createStorageService(userId);
          expect(service).toBeInstanceOf(LocalStorageServiceAsync);
        }),
        { numRuns: 10 }
      );
    });

    it('createStorageService returns SupabaseStorageService when userId is provided', () => {
      fc.assert(
        fc.property(fc.uuid(), (userId) => {
          const service = createStorageService(userId);
          expect(service).toBeInstanceOf(SupabaseStorageService);
        }),
        { numRuns: 100 }
      );
    });

    it('both implementations have the same interface methods', () => {
      const localService = createStorageService(null);
      const supabaseService = createStorageService('test-user-id');

      // Verify both have the same methods
      const requiredMethods = ['saveJob', 'getJob', 'getAllJobs', 'updateJob', 'deleteJob', 'isAvailable'];
      
      for (const method of requiredMethods) {
        expect(typeof (localService as any)[method]).toBe('function');
        expect(typeof (supabaseService as any)[method]).toBe('function');
      }
    });

    it('isAvailable returns boolean for both implementations', () => {
      fc.assert(
        fc.property(fc.option(fc.uuid(), { nil: null }), (userId) => {
          const service = createStorageService(userId);
          const result = service.isAvailable();
          expect(typeof result).toBe('boolean');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('StorageServiceFactory caching', () => {
    let factory: StorageServiceFactory;

    beforeEach(() => {
      factory = new StorageServiceFactory();
    });

    afterEach(() => {
      factory.clearCache();
    });

    it('returns same instance for same userId', () => {
      const userId = 'test-user-123';
      const service1 = factory.getService(userId);
      const service2 = factory.getService(userId);
      
      expect(service1).toBe(service2);
    });

    it('returns different instance when userId changes', () => {
      const service1 = factory.getService('user-1');
      const service2 = factory.getService('user-2');
      
      expect(service1).not.toBe(service2);
    });

    it('returns LocalStorageServiceAsync after clearCache with null userId', () => {
      factory.getService('some-user');
      factory.clearCache();
      const service = factory.getService(null);
      
      expect(service).toBeInstanceOf(LocalStorageServiceAsync);
    });
  });
});

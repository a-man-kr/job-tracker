/**
 * Property-Based Tests for MigrationService
 * **Feature: supabase-cloud-storage, Property 6: Migration Completeness**
 * **Validates: Requirements 5.2**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { hasLocalData, getLocalJobCount, clearLocalData } from './MigrationService';
import { saveJob, STORAGE_KEY } from './StorageService';
import type { JobPosting, ApplicationStatus, ReferralOutreachStatus, ReferralContact } from '../types';

// Arbitraries for generating test data
const applicationStatusArb = fc.constantFrom<ApplicationStatus>(
  'Saved', 'Applied', 'Interview', 'Offer', 'Rejected'
);

const referralOutreachStatusArb = fc.constantFrom<ReferralOutreachStatus>(
  'Have to Find', 'Found Contact', 'Messaged', 'Got Referral', 'No Response', 'Declined'
);

const referralStatusArb = fc.constantFrom(
  'Not Contacted', 'Contacted', 'Referral Received', 'No Response'
);

// Use integer timestamps to avoid invalid date issues
const validDateArb = fc.integer({ min: 1577836800000, max: 1924991999000 }).map(ts => new Date(ts));

const referralContactArb: fc.Arbitrary<ReferralContact> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  contactMethod: fc.string({ minLength: 1, maxLength: 50 }),
  dateContacted: fc.option(validDateArb.map(d => d.toISOString()), { nil: null }),
  status: referralStatusArb,
}) as fc.Arbitrary<ReferralContact>;

const jobPostingInputArb: fc.Arbitrary<Omit<JobPosting, 'id' | 'dateAdded' | 'lastUpdated'>> = fc.record({
  jobId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  jobTitle: fc.string({ minLength: 1, maxLength: 200 }),
  company: fc.string({ minLength: 1, maxLength: 200 }),
  location: fc.string({ minLength: 1, maxLength: 200 }),
  description: fc.string({ minLength: 1, maxLength: 5000 }),
  linkedInUrl: fc.option(fc.webUrl(), { nil: null }),
  applicationLink: fc.option(fc.webUrl(), { nil: null }),
  applicationRequirements: fc.option(fc.string({ maxLength: 300 }), { nil: null }),
  applicationDeadline: fc.option(validDateArb.map(d => d.toISOString().split('T')[0]), { nil: null }),
  referralMessage: fc.string({ maxLength: 2000 }),
  referralOutreachStatus: referralOutreachStatusArb,
  notes: fc.string({ maxLength: 2000 }),
  status: applicationStatusArb,
  referralContacts: fc.array(referralContactArb, { maxLength: 3 }),
  dateApplied: fc.option(validDateArb.map(d => d.toISOString()), { nil: null }),
});

// Helper to clear localStorage
const clearStorage = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
  }
};

describe('MigrationService', () => {
  beforeEach(() => {
    clearStorage();
  });

  afterEach(() => {
    clearStorage();
  });

  describe('hasLocalData', () => {
    it('returns false when localStorage is empty', () => {
      expect(hasLocalData()).toBe(false);
    });

    it('returns true when localStorage has jobs', () => {
      saveJob({
        jobId: null,
        jobTitle: 'Test Job',
        company: 'Test Company',
        location: 'Test Location',
        description: 'Test Description',
        linkedInUrl: null,
        applicationLink: null,
        applicationRequirements: null,
        applicationDeadline: null,
        referralMessage: '',
        referralOutreachStatus: 'Have to Find',
        notes: '',
        status: 'Saved',
        referralContacts: [],
        dateApplied: null,
      });

      expect(hasLocalData()).toBe(true);
    });
  });

  describe('getLocalJobCount', () => {
    it('returns 0 when localStorage is empty', () => {
      expect(getLocalJobCount()).toBe(0);
    });

    /**
     * **Feature: supabase-cloud-storage, Property 6: Migration Completeness**
     * For any set of job postings in localStorage, getLocalJobCount SHALL
     * return the exact count of jobs stored.
     * **Validates: Requirements 5.2**
     */
    it('Property 6: getLocalJobCount returns exact count of stored jobs', () => {
      fc.assert(
        fc.property(
          fc.array(jobPostingInputArb, { minLength: 0, maxLength: 10 }),
          (jobsData) => {
            clearStorage();
            
            // Save all jobs to localStorage
            for (const jobData of jobsData) {
              saveJob(jobData);
            }
            
            // Verify count matches
            expect(getLocalJobCount()).toBe(jobsData.length);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('clearLocalData', () => {
    it('removes all job data from localStorage', () => {
      // Add some jobs
      saveJob({
        jobId: null,
        jobTitle: 'Test Job',
        company: 'Test Company',
        location: 'Test Location',
        description: 'Test Description',
        linkedInUrl: null,
        applicationLink: null,
        applicationRequirements: null,
        applicationDeadline: null,
        referralMessage: '',
        referralOutreachStatus: 'Have to Find',
        notes: '',
        status: 'Saved',
        referralContacts: [],
        dateApplied: null,
      });

      expect(hasLocalData()).toBe(true);

      // Clear data
      clearLocalData();

      expect(hasLocalData()).toBe(false);
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
});

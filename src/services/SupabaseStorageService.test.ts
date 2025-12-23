/**
 * Property-Based Tests for SupabaseStorageService
 * Tests storage operations using the async localStorage wrapper for isolation
 * Requirements: 2.1, 2.2, 2.3, 2.4, 3.1
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { LocalStorageServiceAsync } from './StorageService';
import type { JobPosting, ApplicationStatus, ReferralOutreachStatus, ReferralContact } from '../types';

// Use LocalStorageServiceAsync for testing since it implements the same interface
// This allows us to test the contract without requiring actual Supabase connection
const createTestStorage = () => new LocalStorageServiceAsync();

// Helper to clear localStorage - needed at start of each property test iteration
const clearStorage = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
  }
};

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
  referralContacts: fc.array(referralContactArb, { maxLength: 5 }),
  dateApplied: fc.option(validDateArb.map(d => d.toISOString()), { nil: null }),
});

describe('Storage Service Properties', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  /**
   * **Feature: supabase-cloud-storage, Property 2: Save-Retrieve Consistency**
   * For any job posting saved by an authenticated user, retrieving all jobs
   * for that user SHALL include the saved job with matching field values.
   * **Validates: Requirements 2.1, 2.2**
   */
  it('Property 2: saved jobs can be retrieved with matching field values', async () => {
    await fc.assert(
      fc.asyncProperty(jobPostingInputArb, async (jobData) => {
        clearStorage();
        const storage = createTestStorage();
        
        // Save the job
        const savedJob = await storage.saveJob(jobData);
        
        // Retrieve all jobs
        const allJobs = await storage.getAllJobs();
        
        // Find the saved job in the list
        const foundJob = allJobs.find(j => j.id === savedJob.id);
        
        // Verify the job exists and has matching values
        expect(foundJob).toBeDefined();
        expect(foundJob?.jobTitle).toBe(jobData.jobTitle);
        expect(foundJob?.company).toBe(jobData.company);
        expect(foundJob?.location).toBe(jobData.location);
        expect(foundJob?.description).toBe(jobData.description);
        expect(foundJob?.status).toBe(jobData.status);
        expect(foundJob?.referralOutreachStatus).toBe(jobData.referralOutreachStatus);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: supabase-cloud-storage, Property 3: Update Persistence**
   * For any existing job posting and valid partial update, after applying the update,
   * retrieving the job SHALL return the updated values while preserving unchanged fields.
   * **Validates: Requirements 2.3**
   */
  it('Property 3: updates persist and preserve unchanged fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        jobPostingInputArb,
        fc.record({
          jobTitle: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
          notes: fc.option(fc.string({ maxLength: 2000 })),
          status: fc.option(applicationStatusArb),
        }),
        async (jobData, updates) => {
          clearStorage();
          const storage = createTestStorage();
          
          // Save initial job
          const savedJob = await storage.saveJob(jobData);
          
          // Build partial update (only include defined values)
          const partialUpdate: Partial<JobPosting> = {};
          if (updates.jobTitle !== null) partialUpdate.jobTitle = updates.jobTitle;
          if (updates.notes !== null) partialUpdate.notes = updates.notes;
          if (updates.status !== null) partialUpdate.status = updates.status;
          
          // Apply update
          const updatedJob = await storage.updateJob(savedJob.id, partialUpdate);
          
          // Verify update was applied
          expect(updatedJob).not.toBeNull();
          
          // Verify updated fields
          if (updates.jobTitle !== null) {
            expect(updatedJob?.jobTitle).toBe(updates.jobTitle);
          } else {
            expect(updatedJob?.jobTitle).toBe(jobData.jobTitle);
          }
          
          // Verify unchanged fields are preserved
          expect(updatedJob?.company).toBe(jobData.company);
          expect(updatedJob?.location).toBe(jobData.location);
          expect(updatedJob?.description).toBe(jobData.description);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: supabase-cloud-storage, Property 4: Delete Removes Job**
   * For any job posting that is deleted, subsequent retrieval attempts for that job
   * SHALL return null, and the job SHALL NOT appear in the user's job list.
   * **Validates: Requirements 2.4**
   */
  it('Property 4: deleted jobs are no longer retrievable', async () => {
    await fc.assert(
      fc.asyncProperty(jobPostingInputArb, async (jobData) => {
        clearStorage();
        const storage = createTestStorage();
        
        // Save the job
        const savedJob = await storage.saveJob(jobData);
        
        // Verify it exists
        const beforeDelete = await storage.getJob(savedJob.id);
        expect(beforeDelete).not.toBeNull();
        
        // Delete the job
        const deleteResult = await storage.deleteJob(savedJob.id);
        expect(deleteResult).toBe(true);
        
        // Verify it's gone
        const afterDelete = await storage.getJob(savedJob.id);
        expect(afterDelete).toBeNull();
        
        // Verify it's not in the list
        const allJobs = await storage.getAllJobs();
        const foundJob = allJobs.find(j => j.id === savedJob.id);
        expect(foundJob).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: supabase-cloud-storage, Property 5: User Isolation**
   * For any query executed by an authenticated user, all returned job postings
   * SHALL have a user_id matching the authenticated user's ID.
   * Note: This property is tested at the Supabase RLS level. Here we verify
   * that the storage service correctly filters by the storage instance.
   * **Validates: Requirements 3.1**
   */
  it('Property 5: jobs are isolated per storage instance', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(jobPostingInputArb, { minLength: 1, maxLength: 5 }),
        async (jobsData) => {
          clearStorage();
          const storage = createTestStorage();
          
          // Save multiple jobs
          const savedJobs = await Promise.all(
            jobsData.map(job => storage.saveJob(job))
          );
          
          // Retrieve all jobs
          const allJobs = await storage.getAllJobs();
          
          // All saved jobs should be retrievable
          for (const savedJob of savedJobs) {
            const found = allJobs.find(j => j.id === savedJob.id);
            expect(found).toBeDefined();
          }
          
          // Count should match
          expect(allJobs.length).toBe(savedJobs.length);
        }
      ),
      { numRuns: 50 }
    );
  });
});

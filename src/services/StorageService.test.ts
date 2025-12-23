/**
 * Property-based tests for StorageService
 * Uses fast-check for property-based testing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { StorageService } from './StorageService';
import type { ApplicationStatus, ReferralStatus, ReferralContact } from '../types';

// Clear localStorage before each test
beforeEach(() => {
  window.localStorage.clear();
});

// Arbitrary generators for test data
const applicationStatusArb = fc.constantFrom<ApplicationStatus>(
  'Saved', 'Applied', 'Interview', 'Offer', 'Rejected'
);

const referralStatusArb = fc.constantFrom<ReferralStatus>(
  'Not Contacted', 'Contacted', 'Referral Received', 'No Response'
);

// Use integer timestamps to generate valid ISO date strings
// Range: 2000-01-01 to 2100-01-01 in milliseconds
const minTimestamp = new Date('2000-01-01').getTime();
const maxTimestamp = new Date('2100-01-01').getTime();

const validIsoDateArb = fc.integer({ min: minTimestamp, max: maxTimestamp })
  .map(ts => new Date(ts).toISOString());

const referralContactArb: fc.Arbitrary<Omit<ReferralContact, 'id'>> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  contactMethod: fc.string({ minLength: 1, maxLength: 100 }),
  dateContacted: fc.option(validIsoDateArb, { nil: null }),
  status: referralStatusArb,
});

const referralOutreachStatusArb = fc.constantFrom(
  'Have to Find', 'Found Contact', 'Messaged', 'Got Referral', 'No Response', 'Declined'
);

// Generator for job posting data (without auto-generated fields)
const jobPostingDataArb = fc.record({
  jobTitle: fc.string({ minLength: 1, maxLength: 200 }),
  company: fc.string({ minLength: 1, maxLength: 100 }),
  location: fc.string({ maxLength: 100 }),
  description: fc.string({ maxLength: 5000 }),
  linkedInUrl: fc.option(fc.webUrl(), { nil: null }),
  applicationLink: fc.option(fc.webUrl(), { nil: null }),
  applicationRequirements: fc.option(fc.string({ maxLength: 300 }), { nil: null }),
  applicationDeadline: fc.option(validIsoDateArb.map(d => d.split('T')[0]), { nil: null }),
  jobId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  referralMessage: fc.string({ maxLength: 2000 }),
  referralOutreachStatus: referralOutreachStatusArb,
  notes: fc.string({ maxLength: 2000 }),
  status: applicationStatusArb,
  referralContacts: fc.array(
    referralContactArb.map(contact => ({
      ...contact,
      id: crypto.randomUUID(),
    })),
    { maxLength: 10 }
  ),
  dateApplied: fc.option(validIsoDateArb, { nil: null }),
});

describe('StorageService Property Tests', () => {
  /**
   * **Feature: linkedin-job-tracker, Property 1: Storage Round Trip**
   * 
   * *For any* valid JobPosting object, saving it to storage and then retrieving 
   * it by ID should return an equivalent object with all fields preserved 
   * (job title, company, location, description, URL, referral message, notes, 
   * status, contacts, and timestamps).
   * 
   * **Validates: Requirements 3.1, 3.2, 3.4, 5.2, 5.4, 8.2**
   */
  it('Property 1: Storage Round Trip - saved jobs can be retrieved with all fields preserved', () => {
    fc.assert(
      fc.property(jobPostingDataArb, (jobData) => {
        // Save the job
        const savedJob = StorageService.saveJob(jobData);
        
        // Retrieve the job by ID
        const retrievedJob = StorageService.getJob(savedJob.id);
        
        // Job should be retrievable
        expect(retrievedJob).not.toBeNull();
        
        if (retrievedJob) {
          // All original fields should be preserved
          expect(retrievedJob.jobTitle).toBe(jobData.jobTitle);
          expect(retrievedJob.company).toBe(jobData.company);
          expect(retrievedJob.location).toBe(jobData.location);
          expect(retrievedJob.description).toBe(jobData.description);
          expect(retrievedJob.linkedInUrl).toBe(jobData.linkedInUrl);
          expect(retrievedJob.applicationLink).toBe(jobData.applicationLink);
          expect(retrievedJob.jobId).toBe(jobData.jobId);
          expect(retrievedJob.referralMessage).toBe(jobData.referralMessage);
          expect(retrievedJob.referralOutreachStatus).toBe(jobData.referralOutreachStatus);
          expect(retrievedJob.notes).toBe(jobData.notes);
          expect(retrievedJob.status).toBe(jobData.status);
          expect(retrievedJob.dateApplied).toBe(jobData.dateApplied);
          
          // Referral contacts should be preserved
          expect(retrievedJob.referralContacts).toHaveLength(jobData.referralContacts.length);
          for (let i = 0; i < jobData.referralContacts.length; i++) {
            expect(retrievedJob.referralContacts[i].name).toBe(jobData.referralContacts[i].name);
            expect(retrievedJob.referralContacts[i].contactMethod).toBe(jobData.referralContacts[i].contactMethod);
            expect(retrievedJob.referralContacts[i].dateContacted).toBe(jobData.referralContacts[i].dateContacted);
            expect(retrievedJob.referralContacts[i].status).toBe(jobData.referralContacts[i].status);
          }
          
          // Auto-generated fields should exist
          expect(retrievedJob.id).toBeDefined();
          expect(retrievedJob.dateAdded).toBeDefined();
          expect(retrievedJob.lastUpdated).toBeDefined();
          
          // Timestamps should be valid ISO strings
          expect(() => new Date(retrievedJob.dateAdded)).not.toThrow();
          expect(() => new Date(retrievedJob.lastUpdated)).not.toThrow();
        }
        
        // Clean up for next iteration
        StorageService.deleteJob(savedJob.id);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: linkedin-job-tracker, Property 2: Unique Job Identifiers**
   * 
   * *For any* two JobPosting objects saved to storage, their assigned IDs 
   * should be different.
   * 
   * **Validates: Requirements 3.3**
   */
  it('Property 2: Unique Job Identifiers - saved jobs have different IDs', () => {
    fc.assert(
      fc.property(jobPostingDataArb, jobPostingDataArb, (jobData1, jobData2) => {
        // Save two jobs
        const savedJob1 = StorageService.saveJob(jobData1);
        const savedJob2 = StorageService.saveJob(jobData2);
        
        // Their IDs should be different
        expect(savedJob1.id).not.toBe(savedJob2.id);
        
        // Both IDs should be valid UUIDs (non-empty strings)
        expect(savedJob1.id).toBeDefined();
        expect(savedJob1.id.length).toBeGreaterThan(0);
        expect(savedJob2.id).toBeDefined();
        expect(savedJob2.id.length).toBeGreaterThan(0);
        
        // Clean up for next iteration
        StorageService.deleteJob(savedJob1.id);
        StorageService.deleteJob(savedJob2.id);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

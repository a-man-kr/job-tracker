/**
 * Property-Based Tests for Job Posting Transformers
 * **Feature: supabase-cloud-storage, Property 1: Job Posting Round-Trip Consistency**
 * **Validates: Requirements 2.5, 2.6**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { dbRowToJobPosting, jobPostingToDbInsert } from './jobTransformers';
import type { JobPosting, ReferralContact, ApplicationStatus, ReferralOutreachStatus } from '../types';
import type { DbJobPostingRow } from '../types/supabase';

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

const jobPostingArb: fc.Arbitrary<Omit<JobPosting, 'id' | 'dateAdded' | 'lastUpdated'>> = fc.record({
  jobId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  jobTitle: fc.string({ minLength: 1, maxLength: 200 }),
  company: fc.string({ minLength: 1, maxLength: 200 }),
  location: fc.string({ minLength: 1, maxLength: 200 }),
  description: fc.string({ minLength: 1, maxLength: 5000 }),
  linkedInUrl: fc.option(fc.webUrl(), { nil: null }),
  applicationLink: fc.option(fc.webUrl(), { nil: null }),
  referralMessage: fc.string({ maxLength: 2000 }),
  referralOutreachStatus: referralOutreachStatusArb,
  notes: fc.string({ maxLength: 2000 }),
  status: applicationStatusArb,
  referralContacts: fc.array(referralContactArb, { maxLength: 10 }),
  dateApplied: fc.option(validDateArb.map(d => d.toISOString()), { nil: null }),
});

describe('Job Posting Transformers', () => {
  /**
   * **Feature: supabase-cloud-storage, Property 1: Job Posting Round-Trip Consistency**
   * For any valid JobPosting object, serializing it to database format and then
   * deserializing it back SHALL produce an equivalent JobPosting with all original
   * field values preserved.
   * **Validates: Requirements 2.5, 2.6**
   */
  it('Property 1: round-trip transformation preserves all field values', () => {
    fc.assert(
      fc.property(jobPostingArb, fc.uuid(), (jobData, userId) => {
        // Serialize to DB format
        const dbInsert = jobPostingToDbInsert(jobData, userId);
        
        // Create a mock DB row (simulating what DB would return)
        const dbRow: DbJobPostingRow = {
          id: crypto.randomUUID(),
          user_id: dbInsert.user_id,
          job_id: dbInsert.job_id ?? null,
          job_title: dbInsert.job_title,
          company: dbInsert.company,
          location: dbInsert.location,
          description: dbInsert.description,
          linkedin_url: dbInsert.linkedin_url ?? null,
          application_link: dbInsert.application_link ?? null,
          referral_message: dbInsert.referral_message ?? '',
          referral_outreach_status: dbInsert.referral_outreach_status ?? 'Have to Find',
          notes: dbInsert.notes ?? '',
          status: dbInsert.status ?? 'Saved',
          referral_contacts: dbInsert.referral_contacts ?? [],
          date_added: new Date().toISOString(),
          date_applied: dbInsert.date_applied ?? null,
          last_updated: new Date().toISOString(),
        };
        
        // Deserialize back to JobPosting
        const result = dbRowToJobPosting(dbRow);
        
        // Verify all original fields are preserved
        expect(result.jobId).toBe(jobData.jobId);
        expect(result.jobTitle).toBe(jobData.jobTitle);
        expect(result.company).toBe(jobData.company);
        expect(result.location).toBe(jobData.location);
        expect(result.description).toBe(jobData.description);
        expect(result.linkedInUrl).toBe(jobData.linkedInUrl);
        expect(result.applicationLink).toBe(jobData.applicationLink);
        expect(result.referralMessage).toBe(jobData.referralMessage);
        expect(result.referralOutreachStatus).toBe(jobData.referralOutreachStatus);
        expect(result.notes).toBe(jobData.notes);
        expect(result.status).toBe(jobData.status);
        expect(result.referralContacts).toEqual(jobData.referralContacts);
        expect(result.dateApplied).toBe(jobData.dateApplied);
      }),
      { numRuns: 100 }
    );
  });

  it('dbRowToJobPosting handles invalid status values gracefully', () => {
    const invalidRow: DbJobPostingRow = {
      id: 'test-id',
      user_id: 'user-id',
      job_id: null,
      job_title: 'Test Job',
      company: 'Test Company',
      location: 'Test Location',
      description: 'Test Description',
      linkedin_url: null,
      application_link: null,
      referral_message: '',
      referral_outreach_status: 'InvalidStatus',
      notes: '',
      status: 'InvalidStatus',
      referral_contacts: [],
      date_added: new Date().toISOString(),
      date_applied: null,
      last_updated: new Date().toISOString(),
    };

    const result = dbRowToJobPosting(invalidRow);
    
    // Should default to valid values
    expect(result.status).toBe('Saved');
    expect(result.referralOutreachStatus).toBe('Have to Find');
  });
});

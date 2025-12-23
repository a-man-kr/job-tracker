/**
 * Property-based tests for ExportService
 * Uses fast-check for property-based testing
 * 
 * **Feature: linkedin-job-tracker**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateCSV,
  generateCSVFilename,
} from './ExportService';
import type { ApplicationStatus, ReferralStatus, ReferralContact, JobPosting } from '../types';

// Arbitrary generators for test data
const applicationStatusArb = fc.constantFrom<ApplicationStatus>(
  'Saved', 'Applied', 'Interview', 'Offer', 'Rejected'
);

const referralStatusArb = fc.constantFrom<ReferralStatus>(
  'Not Contacted', 'Contacted', 'Referral Received', 'No Response'
);

// Safe ISO date string generator (avoids invalid dates)
const isoDateStringArb = fc.tuple(
  fc.integer({ min: 2000, max: 2099 }),
  fc.integer({ min: 1, max: 12 }),
  fc.integer({ min: 1, max: 28 }),
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 }),
  fc.integer({ min: 0, max: 59 })
).map(([year, month, day, hour, min, sec]) => {
  const d = new Date(year, month - 1, day, hour, min, sec);
  return d.toISOString();
});

const referralContactArb: fc.Arbitrary<ReferralContact> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  contactMethod: fc.string({ minLength: 1, maxLength: 100 }),
  dateContacted: fc.option(isoDateStringArb, { nil: null }),
  status: referralStatusArb,
});

const referralOutreachStatusArb = fc.constantFrom(
  'Have to Find', 'Found Contact', 'Messaged', 'Got Referral', 'No Response', 'Declined'
);

// Full JobPosting generator
const jobPostingArb: fc.Arbitrary<JobPosting> = fc.record({
  id: fc.uuid(),
  jobTitle: fc.string({ minLength: 1, maxLength: 200 }),
  company: fc.string({ minLength: 1, maxLength: 100 }),
  location: fc.string({ maxLength: 100 }),
  description: fc.string({ maxLength: 500 }),
  linkedInUrl: fc.option(fc.webUrl(), { nil: null }),
  applicationLink: fc.option(fc.webUrl(), { nil: null }),
  applicationRequirements: fc.option(fc.string({ maxLength: 300 }), { nil: null }),
  applicationDeadline: fc.option(fc.date().map(d => d.toISOString().split('T')[0]), { nil: null }),
  jobId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  referralMessage: fc.string({ maxLength: 500 }),
  referralOutreachStatus: referralOutreachStatusArb,
  notes: fc.string({ maxLength: 500 }),
  status: applicationStatusArb,
  referralContacts: fc.array(referralContactArb, { maxLength: 5 }),
  dateAdded: isoDateStringArb,
  dateApplied: fc.option(isoDateStringArb, { nil: null }),
  lastUpdated: isoDateStringArb,
});

// Expected CSV headers in exact order per Requirement 7.2
const EXPECTED_HEADERS = [
  'Job Title',
  'Company',
  'Location',
  'Status',
  'LinkedIn URL',
  'Application Link',
  'Contact Person',
  'Contact Info',
  'AI Referral Message',
  'Personal Notes',
  'Date Added',
  'Date Applied',
  'Last Updated',
];

/**
 * Helper function to parse a CSV string back into rows
 * Handles RFC 4180 compliant CSV parsing including quoted fields with newlines
 */
function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < csv.length) {
    const char = csv[i];
    
    if (inQuotes) {
      if (char === '"') {
        // Check if it's an escaped quote
        if (i + 1 < csv.length && csv[i + 1] === '"') {
          currentField += '"';
          i += 2;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
        }
      } else {
        currentField += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
        i++;
      } else if (char === '\r' && i + 1 < csv.length && csv[i + 1] === '\n') {
        // End of row (CRLF)
        currentRow.push(currentField);
        if (currentRow.length > 0 && currentRow.some(f => f.length > 0 || currentRow.length > 1)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        i += 2;
      } else if (char === '\n') {
        // End of row (LF only - shouldn't happen in RFC 4180 but handle it)
        currentRow.push(currentField);
        if (currentRow.length > 0) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        i++;
      } else {
        currentField += char;
        i++;
      }
    }
  }
  
  // Push the last field and row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  
  return rows;
}

describe('ExportService Property Tests', () => {
  /**
   * **Feature: linkedin-job-tracker, Property 8: CSV Completeness**
   * 
   * *For any* set of N JobPostings with their associated ReferralContacts, 
   * the generated CSV should contain exactly N data rows (plus header), 
   * and each row should include all contact information for that job.
   * 
   * **Validates: Requirements 7.1, 7.4**
   */
  it('Property 8: CSV Completeness - CSV contains correct number of rows with all contact info', () => {
    fc.assert(
      fc.property(fc.array(jobPostingArb, { minLength: 0, maxLength: 20 }), (jobs) => {
        const csv = generateCSV(jobs);
        const rows = parseCSV(csv);
        
        // Should have header row + N data rows
        expect(rows.length).toBe(jobs.length + 1);
        
        // Each job's contacts should be included in the CSV
        for (let i = 0; i < jobs.length; i++) {
          const job = jobs[i];
          const dataRow = rows[i + 1]; // +1 to skip header
          
          // Contact Person column (index 6) should contain all contacts
          const contactPersonField = dataRow[6];
          
          for (const contact of job.referralContacts) {
            // Each contact should appear as "Name [Method]"
            const expectedFormat = `${contact.name} [${contact.contactMethod}]`;
            expect(contactPersonField).toContain(expectedFormat);
          }
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: linkedin-job-tracker, Property 9: CSV Column Order**
   * 
   * *For any* generated CSV, the header row should contain columns in this 
   * exact order: Job Title, Company, Location, Status, LinkedIn URL, 
   * Contact Person, Contact Info, AI Referral Message, Personal Notes, 
   * Date Added, Date Applied, Last Updated.
   * 
   * **Validates: Requirements 7.2**
   */
  it('Property 9: CSV Column Order - header columns are in correct order', () => {
    fc.assert(
      fc.property(fc.array(jobPostingArb, { minLength: 0, maxLength: 10 }), (jobs) => {
        const csv = generateCSV(jobs);
        const rows = parseCSV(csv);
        
        // Should have at least the header row
        expect(rows.length).toBeGreaterThanOrEqual(1);
        
        const headerRow = rows[0];
        
        // Header should have exactly 13 columns
        expect(headerRow.length).toBe(EXPECTED_HEADERS.length);
        
        // Each header should match the expected order exactly
        for (let i = 0; i < EXPECTED_HEADERS.length; i++) {
          expect(headerRow[i]).toBe(EXPECTED_HEADERS[i]);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: linkedin-job-tracker, Property 10: CSV Special Character Escaping**
   * 
   * *For any* JobPosting containing special characters (commas, quotes, newlines) 
   * in any text field, the generated CSV should properly escape these characters 
   * such that parsing the CSV produces the original values.
   * 
   * **Validates: Requirements 7.5**
   */
  it('Property 10: CSV Special Character Escaping - special characters are properly escaped and recoverable', () => {
    // Generator for strings with special characters
    const specialCharsStringArb = fc.array(
      fc.oneof(
        fc.constant(','),
        fc.constant('"'),
        fc.constant('\n'),
        fc.constant('\r'),
        fc.constant('a'),
        fc.constant('b'),
        fc.constant('1'),
        fc.constant(' ')
      ),
      { minLength: 0, maxLength: 50 }
    ).map(chars => chars.join(''));
    
    // JobPosting with special characters in text fields
    const jobWithSpecialCharsArb: fc.Arbitrary<JobPosting> = fc.record({
      id: fc.uuid(),
      jobTitle: specialCharsStringArb.filter(s => s.length > 0),
      company: specialCharsStringArb.filter(s => s.length > 0),
      location: specialCharsStringArb,
      description: specialCharsStringArb,
      linkedInUrl: fc.option(fc.webUrl(), { nil: null }),
      applicationLink: fc.option(fc.webUrl(), { nil: null }),
      applicationRequirements: fc.option(specialCharsStringArb, { nil: null }),
      applicationDeadline: fc.option(fc.date().map(d => d.toISOString().split('T')[0]), { nil: null }),
      jobId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
      referralMessage: specialCharsStringArb,
      referralOutreachStatus: referralOutreachStatusArb,
      notes: specialCharsStringArb,
      status: applicationStatusArb,
      referralContacts: fc.constant([]), // Empty contacts to simplify test
      dateAdded: isoDateStringArb,
      dateApplied: fc.option(isoDateStringArb, { nil: null }),
      lastUpdated: isoDateStringArb,
    });
    
    fc.assert(
      fc.property(jobWithSpecialCharsArb, (job) => {
        const csv = generateCSV([job]);
        const rows = parseCSV(csv);
        
        // Should have header + 1 data row
        expect(rows.length).toBe(2);
        
        const dataRow = rows[1];
        
        // Verify that parsed values match original values
        expect(dataRow[0]).toBe(job.jobTitle);
        expect(dataRow[1]).toBe(job.company);
        expect(dataRow[2]).toBe(job.location);
        expect(dataRow[3]).toBe(job.status);
        expect(dataRow[4]).toBe(job.linkedInUrl || '');
        expect(dataRow[5]).toBe(job.applicationLink || '');
        // Skip contact fields (6, 7) as they're empty
        expect(dataRow[8]).toBe(job.referralMessage);
        expect(dataRow[9]).toBe(job.notes);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: linkedin-job-tracker, Property 11: CSV Filename Format**
   * 
   * *For any* date, the generated CSV filename should match the pattern 
   * "job-applications-YYYY-MM-DD.csv" where YYYY-MM-DD is the current date.
   * 
   * **Validates: Requirements 7.6**
   */
  it('Property 11: CSV Filename Format - filename matches expected pattern', () => {
    // Use the same safe date generator approach as other tests
    const validDateArb = fc.tuple(
      fc.integer({ min: 2000, max: 2099 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 })
    ).map(([year, month, day]) => new Date(year, month - 1, day));
    
    fc.assert(
      fc.property(validDateArb, (date) => {
        const filename = generateCSVFilename(date);
        
        // Filename should match the pattern
        const pattern = /^job-applications-\d{4}-\d{2}-\d{2}\.csv$/;
        expect(filename).toMatch(pattern);
        
        // Extract date parts from filename
        const match = filename.match(/job-applications-(\d{4})-(\d{2})-(\d{2})\.csv/);
        expect(match).not.toBeNull();
        
        if (match) {
          const [, year, month, day] = match;
          
          // Verify date components match the input date
          expect(parseInt(year, 10)).toBe(date.getFullYear());
          expect(parseInt(month, 10)).toBe(date.getMonth() + 1);
          expect(parseInt(day, 10)).toBe(date.getDate());
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

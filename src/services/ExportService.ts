/**
 * CSV Export Service for LinkedIn Job Application Tracker
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import type { JobPosting, ReferralContact } from '../types';

/**
 * CSV column headers in the required order
 * Requirement 7.2: Include columns in this exact order
 */
const CSV_HEADERS = [
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
] as const;

/**
 * Escapes a field value according to RFC 4180 CSV specification
 * Requirement 7.5: Properly escape special characters (commas, quotes, newlines)
 * 
 * RFC 4180 rules:
 * - Fields containing commas, double quotes, or newlines must be enclosed in double quotes
 * - Double quotes within a field must be escaped by doubling them
 */
export function escapeCSVField(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  
  // Check if the field contains special characters that require quoting
  const needsQuoting = /[,"\r\n]/.test(stringValue);
  
  if (needsQuoting) {
    // Escape double quotes by doubling them, then wrap in double quotes
    const escaped = stringValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  return stringValue;
}

/**
 * Formats referral contacts as "Name [Method]" joined by semicolons
 * Requirement 7.4: Join multiple contacts with semicolon, format as "Name [Method]"
 */
export function formatReferralContacts(contacts: ReferralContact[]): string {
  if (!contacts || contacts.length === 0) {
    return '';
  }
  
  return contacts
    .map(contact => `${contact.name} [${contact.contactMethod}]`)
    .join('; ');
}

/**
 * Generates a CSV filename with the current date
 * Requirement 7.6: Use format "job-applications-YYYY-MM-DD.csv"
 */
export function generateCSVFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `job-applications-${year}-${month}-${day}.csv`;
}

/**
 * Converts a JobPosting to a CSV row array
 */
function jobToCSVRow(job: JobPosting): string[] {
  const contactPerson = formatReferralContacts(job.referralContacts);
  // Contact Info is the same as Contact Person per the design
  const contactInfo = contactPerson;
  
  return [
    job.jobTitle,
    job.company,
    job.location,
    job.status,
    job.linkedInUrl || '',
    job.applicationLink || '',
    contactPerson,
    contactInfo,
    job.referralMessage,
    job.notes,
    job.dateAdded,
    job.dateApplied || '',
    job.lastUpdated,
  ];
}

/**
 * Generates a CSV string from an array of JobPostings
 * Requirement 7.1: Generate CSV file containing all JobPosting records
 * Requirement 7.2: Include columns in the specified order
 * Requirement 7.5: Properly escape special characters per RFC 4180
 */
export function generateCSV(jobs: JobPosting[]): string {
  // Create header row
  const headerRow = CSV_HEADERS.map(header => escapeCSVField(header)).join(',');
  
  // Create data rows
  const dataRows = jobs.map(job => {
    const row = jobToCSVRow(job);
    return row.map(field => escapeCSVField(field)).join(',');
  });
  
  // Combine header and data rows with CRLF line endings (RFC 4180)
  return [headerRow, ...dataRows].join('\r\n');
}

/**
 * Triggers a browser download of the CSV file
 * Requirement 7.3: Trigger a browser download of the file
 * Requirement 7.6: Use filename format "job-applications-YYYY-MM-DD.csv"
 */
export function downloadCSV(jobs: JobPosting[], date: Date = new Date()): void {
  const csvContent = generateCSV(jobs);
  const filename = generateCSVFilename(date);
  
  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a download link and trigger the download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Export Service object implementing the ExportService interface from design.md
 */
export const ExportService = {
  generateCSV,
  downloadCSV,
  // Expose helper functions for testing
  escapeCSVField,
  formatReferralContacts,
  generateCSVFilename,
};

export default ExportService;

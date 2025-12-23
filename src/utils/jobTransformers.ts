/**
 * Job Posting Transformer Functions
 * Converts between application JobPosting type and database row format
 * Requirements: 2.5, 2.6
 */

import type { JobPosting } from '../types';
import type { DbJobPostingRow, DbJobPostingInsert, DbJobPostingUpdate } from '../types/supabase';
import { isValidApplicationStatus, isValidReferralOutreachStatus } from '../types/supabase';

/**
 * Convert a database row to a JobPosting object
 * Handles snake_case to camelCase conversion and type validation
 * Requirements: 2.6
 */
export function dbRowToJobPosting(row: DbJobPostingRow): JobPosting {
  // Validate and default status values
  const status = isValidApplicationStatus(row.status) ? row.status : 'Saved';
  const referralOutreachStatus = isValidReferralOutreachStatus(row.referral_outreach_status) 
    ? row.referral_outreach_status 
    : 'Have to Find';

  return {
    id: row.id,
    jobId: row.job_id,
    jobTitle: row.job_title,
    company: row.company,
    location: row.location,
    description: row.description,
    linkedInUrl: row.linkedin_url,
    applicationLink: row.application_link,
    applicationRequirements: row.application_requirements,
    applicationDeadline: row.application_deadline,
    referralMessage: row.referral_message,
    referralOutreachStatus,
    notes: row.notes,
    status,
    referralContacts: row.referral_contacts || [],
    dateAdded: row.date_added,
    dateApplied: row.date_applied,
    lastUpdated: row.last_updated,
  };
}

/**
 * Convert a JobPosting (without id/dates) to database insert format
 * Handles camelCase to snake_case conversion
 * Requirements: 2.5
 */
export function jobPostingToDbInsert(
  job: Omit<JobPosting, 'id' | 'dateAdded' | 'lastUpdated'>,
  userId: string
): DbJobPostingInsert {
  return {
    user_id: userId,
    job_id: job.jobId,
    job_title: job.jobTitle,
    company: job.company,
    location: job.location,
    description: job.description,
    linkedin_url: job.linkedInUrl,
    application_link: job.applicationLink,
    application_requirements: job.applicationRequirements,
    application_deadline: job.applicationDeadline,
    referral_message: job.referralMessage,
    referral_outreach_status: job.referralOutreachStatus,
    notes: job.notes,
    status: job.status,
    referral_contacts: job.referralContacts,
    date_applied: job.dateApplied,
  };
}

/**
 * Convert partial JobPosting updates to database update format
 * Only includes fields that are present in the updates object
 * Requirements: 2.5
 */
export function jobUpdatesToDbUpdate(updates: Partial<JobPosting>): DbJobPostingUpdate {
  const dbUpdate: DbJobPostingUpdate = {};

  if (updates.jobId !== undefined) dbUpdate.job_id = updates.jobId;
  if (updates.jobTitle !== undefined) dbUpdate.job_title = updates.jobTitle;
  if (updates.company !== undefined) dbUpdate.company = updates.company;
  if (updates.location !== undefined) dbUpdate.location = updates.location;
  if (updates.description !== undefined) dbUpdate.description = updates.description;
  if (updates.linkedInUrl !== undefined) dbUpdate.linkedin_url = updates.linkedInUrl;
  if (updates.applicationLink !== undefined) dbUpdate.application_link = updates.applicationLink;
  if (updates.applicationRequirements !== undefined) dbUpdate.application_requirements = updates.applicationRequirements;
  if (updates.applicationDeadline !== undefined) dbUpdate.application_deadline = updates.applicationDeadline;
  if (updates.referralMessage !== undefined) dbUpdate.referral_message = updates.referralMessage;
  if (updates.referralOutreachStatus !== undefined) dbUpdate.referral_outreach_status = updates.referralOutreachStatus;
  if (updates.notes !== undefined) dbUpdate.notes = updates.notes;
  if (updates.status !== undefined) dbUpdate.status = updates.status;
  if (updates.referralContacts !== undefined) dbUpdate.referral_contacts = updates.referralContacts;
  if (updates.dateApplied !== undefined) dbUpdate.date_applied = updates.dateApplied;

  // Always update last_updated timestamp
  dbUpdate.last_updated = new Date().toISOString();

  return dbUpdate;
}

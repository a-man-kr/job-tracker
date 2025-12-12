/**
 * Supabase Database Types
 * Type definitions for the Supabase PostgreSQL database schema
 * Requirements: 2.5, 2.6
 */

import type { ReferralContact, ApplicationStatus, ReferralOutreachStatus } from './index';

/**
 * Database row type for job_postings table
 * Represents the exact structure stored in PostgreSQL
 */
export interface DbJobPostingRow {
  id: string;
  user_id: string;
  job_id: string | null;
  job_title: string;
  company: string;
  location: string;
  description: string;
  linkedin_url: string | null;
  application_link: string | null;
  referral_message: string;
  referral_outreach_status: string;
  notes: string;
  status: string;
  referral_contacts: ReferralContact[];
  date_added: string;
  date_applied: string | null;
  last_updated: string;
}

/**
 * Database insert type for job_postings table
 * Omits auto-generated fields (id, date_added, last_updated)
 */
export interface DbJobPostingInsert {
  user_id: string;
  job_id?: string | null;
  job_title: string;
  company: string;
  location: string;
  description: string;
  linkedin_url?: string | null;
  application_link?: string | null;
  referral_message?: string;
  referral_outreach_status?: string;
  notes?: string;
  status?: string;
  referral_contacts?: ReferralContact[];
  date_applied?: string | null;
}

/**
 * Database update type for job_postings table
 * All fields optional for partial updates
 */
export interface DbJobPostingUpdate {
  job_id?: string | null;
  job_title?: string;
  company?: string;
  location?: string;
  description?: string;
  linkedin_url?: string | null;
  application_link?: string | null;
  referral_message?: string;
  referral_outreach_status?: string;
  notes?: string;
  status?: string;
  referral_contacts?: ReferralContact[];
  date_applied?: string | null;
  last_updated?: string;
}

/**
 * Supabase Database schema type
 * Used for typed Supabase client queries
 */
export interface Database {
  public: {
    Tables: {
      job_postings: {
        Row: DbJobPostingRow;
        Insert: DbJobPostingInsert;
        Update: DbJobPostingUpdate;
      };
    };
  };
}

/**
 * Type guards for validating database values
 */
export function isValidApplicationStatus(status: string): status is ApplicationStatus {
  return ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'].includes(status);
}

export function isValidReferralOutreachStatus(status: string): status is ReferralOutreachStatus {
  return ['Have to Find', 'Found Contact', 'Messaged', 'Got Referral', 'No Response', 'Declined'].includes(status);
}

/**
 * Type definitions for LinkedIn Job Application Tracker
 * Requirements: 3.2, 4.1, 5.1, 5.2
 */

// Application Status enum - tracks the current state of a job application
export type ApplicationStatus = 'Saved' | 'Applied' | 'Interview' | 'Offer' | 'Rejected';

// Referral Status enum - tracks the state of a referral request (for individual contacts)
export type ReferralStatus = 'Not Contacted' | 'Contacted' | 'Referral Received' | 'No Response';

// Referral Outreach Status - tracks overall referral outreach status for a job
export type ReferralOutreachStatus =
  | 'Have to Find' // Need to find someone to reach out to
  | 'Found Contact' // Found someone but haven't messaged yet
  | 'Messaged' // Sent the referral request
  | 'Got Referral' // Successfully received a referral
  | 'No Response' // Messaged but didn't get a response
  | 'Declined'; // Contact declined to refer

// Referral Contact model - a person associated with a job application who may provide a referral
export interface ReferralContact {
  id: string;
  name: string;
  contactMethod: string; // email, LinkedIn, phone, etc.
  dateContacted: string | null; // ISO date string
  status: ReferralStatus;
}

// Job Posting model - a structured record containing extracted job details
export interface JobPosting {
  id: string;
  jobId: string | null; // External job ID from the posting (e.g., LinkedIn job ID)
  jobTitle: string;
  company: string;
  location: string;
  description: string;
  linkedInUrl: string | null;
  applicationLink: string | null;
  referralMessage: string;
  referralOutreachStatus: ReferralOutreachStatus;
  notes: string;
  status: ApplicationStatus;
  referralContacts: ReferralContact[];
  dateAdded: string; // ISO date string
  dateApplied: string | null; // ISO date string
  lastUpdated: string; // ISO date string
}

// App State model - global application state
export interface AppState {
  jobs: JobPosting[];
  searchQuery: string;
  statusFilter: ApplicationStatus | 'All';
  selectedJobId: string | null;
  isAddModalOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

// App Action types - all possible state mutations
export type AppAction =
  | { type: 'SET_JOBS'; payload: JobPosting[] }
  | { type: 'ADD_JOB'; payload: JobPosting }
  | { type: 'UPDATE_JOB'; payload: { id: string; updates: Partial<JobPosting> } }
  | { type: 'DELETE_JOB'; payload: string }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_FILTER'; payload: ApplicationStatus | 'All' }
  | { type: 'SELECT_JOB'; payload: string | null }
  | { type: 'TOGGLE_ADD_MODAL'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

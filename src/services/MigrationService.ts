/**
 * Migration Service
 * Handles migration of job postings from localStorage to Supabase cloud storage
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { getAllJobs, STORAGE_KEY } from './StorageService';
import { SupabaseStorageService } from './SupabaseStorageService';
import type { JobPosting } from '../types';

/**
 * Migration result type
 */
export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  totalCount: number;
  errors: string[];
}

/**
 * Migration Service Interface
 */
export interface IMigrationService {
  hasLocalData(): boolean;
  getLocalJobCount(): number;
  migrateToCloud(userId: string): Promise<MigrationResult>;
  clearLocalData(): void;
}

/**
 * Check if there is data in localStorage
 * Requirements: 5.1
 */
export function hasLocalData(): boolean {
  try {
    const jobs = getAllJobs();
    return jobs.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get the count of jobs in localStorage
 */
export function getLocalJobCount(): number {
  try {
    const jobs = getAllJobs();
    return jobs.length;
  } catch {
    return 0;
  }
}

/**
 * Migrate all jobs from localStorage to Supabase
 * Requirements: 5.2
 */
export async function migrateToCloud(userId: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedCount: 0,
    totalCount: 0,
    errors: [],
  };

  try {
    const localJobs = getAllJobs();
    result.totalCount = localJobs.length;

    if (localJobs.length === 0) {
      result.success = true;
      return result;
    }

    const supabaseStorage = new SupabaseStorageService(userId);

    // Migrate each job
    for (const job of localJobs) {
      try {
        // Extract job data without id, dateAdded, lastUpdated (they'll be regenerated)
        const jobData: Omit<JobPosting, 'id' | 'dateAdded' | 'lastUpdated'> = {
          jobId: job.jobId,
          jobTitle: job.jobTitle,
          company: job.company,
          location: job.location,
          description: job.description,
          linkedInUrl: job.linkedInUrl,
          applicationLink: job.applicationLink,
          applicationRequirements: (job as any).applicationRequirements || null,
          applicationDeadline: (job as any).applicationDeadline || null,
          referralMessage: job.referralMessage,
          referralOutreachStatus: job.referralOutreachStatus,
          notes: job.notes,
          status: job.status,
          referralContacts: job.referralContacts,
          dateApplied: job.dateApplied,
        };

        await supabaseStorage.saveJob(jobData);
        result.migratedCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to migrate job "${job.jobTitle}" at ${job.company}: ${errorMessage}`);
      }
    }

    // Consider migration successful if all jobs were migrated
    result.success = result.migratedCount === result.totalCount;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Migration failed: ${errorMessage}`);
  }

  return result;
}

/**
 * Clear localStorage data after successful migration
 * Requirements: 5.3
 */
export function clearLocalData(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors when clearing
  }
}

/**
 * Migration Service object implementing IMigrationService interface
 */
export const MigrationService: IMigrationService = {
  hasLocalData,
  getLocalJobCount,
  migrateToCloud,
  clearLocalData,
};

export default MigrationService;

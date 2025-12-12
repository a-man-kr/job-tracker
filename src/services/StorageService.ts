/**
 * Storage Service for LinkedIn Job Application Tracker
 * Handles persistence of job postings to localStorage
 * Requirements: 3.1, 3.3, 8.1, 8.2, 8.3
 */

import type { JobPosting } from '../types';

const STORAGE_KEY = 'linkedin-job-tracker-jobs';

/**
 * Storage Service Interface (Synchronous - for localStorage)
 */
export interface IStorageService {
  saveJob(job: Omit<JobPosting, 'id' | 'dateAdded' | 'lastUpdated'>): JobPosting;
  getJob(id: string): JobPosting | null;
  getAllJobs(): JobPosting[];
  updateJob(id: string, updates: Partial<JobPosting>): JobPosting | null;
  deleteJob(id: string): boolean;
  isAvailable(): boolean;
}

/**
 * Async Storage Service Interface (for Supabase and unified API)
 * Requirements: 6.2
 */
export interface IAsyncStorageService {
  saveJob(job: Omit<JobPosting, 'id' | 'dateAdded' | 'lastUpdated'>): Promise<JobPosting>;
  getJob(id: string): Promise<JobPosting | null>;
  getAllJobs(): Promise<JobPosting[]>;
  updateJob(id: string, updates: Partial<JobPosting>): Promise<JobPosting | null>;
  deleteJob(id: string): Promise<boolean>;
  isAvailable(): boolean;
}

/**
 * Check if localStorage is available
 * Handles private browsing mode and quota exceeded scenarios
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a unique identifier for job postings
 * Uses crypto.randomUUID() for guaranteed uniqueness
 * Requirements: 3.3
 */
export function generateUniqueId(): string {
  return crypto.randomUUID();
}

/**
 * Get all jobs from localStorage
 * Requirements: 8.2
 */
export function getAllJobs(): JobPosting[] {
  if (!isStorageAvailable()) {
    return [];
  }

  try {
    const data = window.localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const jobs = JSON.parse(data) as JobPosting[];
    // Sort by dateAdded descending (newest first) - Requirements: 6.4
    return jobs.sort((a, b) => 
      new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    );
  } catch {
    // Parse error - return empty array
    // Requirements: 8.3 - handle storage errors gracefully
    return [];
  }
}


/**
 * Save all jobs to localStorage
 * Internal helper function
 */
function saveAllJobs(jobs: JobPosting[]): boolean {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    return true;
  } catch {
    // Storage quota exceeded or other error
    // Requirements: 8.3 - handle storage errors gracefully
    return false;
  }
}

/**
 * Save a new job posting to localStorage
 * Requirements: 3.1, 3.3, 8.1
 */
export function saveJob(
  jobData: Omit<JobPosting, 'id' | 'dateAdded' | 'lastUpdated'>
): JobPosting {
  const now = new Date().toISOString();
  const newJob: JobPosting = {
    ...jobData,
    id: generateUniqueId(),
    dateAdded: now,
    lastUpdated: now,
  };

  const jobs = getAllJobs();
  jobs.push(newJob);
  saveAllJobs(jobs);

  return newJob;
}

/**
 * Get a single job posting by ID
 * Requirements: 8.2
 */
export function getJob(id: string): JobPosting | null {
  const jobs = getAllJobs();
  return jobs.find(job => job.id === id) ?? null;
}

/**
 * Update an existing job posting
 * Requirements: 8.1
 */
export function updateJob(
  id: string,
  updates: Partial<JobPosting>
): JobPosting | null {
  const jobs = getAllJobs();
  const index = jobs.findIndex(job => job.id === id);

  if (index === -1) {
    return null;
  }

  const updatedJob: JobPosting = {
    ...jobs[index],
    ...updates,
    id: jobs[index].id, // Prevent ID from being changed
    dateAdded: jobs[index].dateAdded, // Prevent dateAdded from being changed
    lastUpdated: new Date().toISOString(),
  };

  jobs[index] = updatedJob;
  saveAllJobs(jobs);

  return updatedJob;
}

/**
 * Delete a job posting by ID
 * Requirements: 9.2
 */
export function deleteJob(id: string): boolean {
  const jobs = getAllJobs();
  const filteredJobs = jobs.filter(job => job.id !== id);

  if (filteredJobs.length === jobs.length) {
    // Job not found
    return false;
  }

  return saveAllJobs(filteredJobs);
}

/**
 * Storage Service object implementing IStorageService interface
 * Provides a unified interface for all storage operations
 */
export const StorageService: IStorageService = {
  saveJob,
  getJob,
  getAllJobs,
  updateJob,
  deleteJob,
  isAvailable: isStorageAvailable,
};

/**
 * Async wrapper for LocalStorage operations
 * Implements IAsyncStorageService for unified API
 * Requirements: 6.2
 */
export class LocalStorageServiceAsync implements IAsyncStorageService {
  async saveJob(jobData: Omit<JobPosting, 'id' | 'dateAdded' | 'lastUpdated'>): Promise<JobPosting> {
    return saveJob(jobData);
  }

  async getJob(id: string): Promise<JobPosting | null> {
    return getJob(id);
  }

  async getAllJobs(): Promise<JobPosting[]> {
    return getAllJobs();
  }

  async updateJob(id: string, updates: Partial<JobPosting>): Promise<JobPosting | null> {
    return updateJob(id, updates);
  }

  async deleteJob(id: string): Promise<boolean> {
    return deleteJob(id);
  }

  isAvailable(): boolean {
    return isStorageAvailable();
  }
}

/**
 * Export storage key for migration service
 */
export { STORAGE_KEY };

export default StorageService;

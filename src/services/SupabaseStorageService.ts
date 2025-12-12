/**
 * Supabase Storage Service
 * Implements cloud storage operations using Supabase PostgreSQL
 * Requirements: 2.1, 2.2, 2.3, 2.4, 3.1
 */

import { supabase } from '../lib/supabase';
import type { JobPosting } from '../types';
import type { IAsyncStorageService } from './StorageService';
import { dbRowToJobPosting, jobPostingToDbInsert, jobUpdatesToDbUpdate } from '../utils/jobTransformers';

/**
 * Supabase Storage Service Class
 * Provides cloud-based CRUD operations for job postings
 */
export class SupabaseStorageService implements IAsyncStorageService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Check if Supabase storage is available
   */
  isAvailable(): boolean {
    return !!this.userId;
  }

  /**
   * Save a new job posting to Supabase
   * Requirements: 2.1
   */
  async saveJob(
    jobData: Omit<JobPosting, 'id' | 'dateAdded' | 'lastUpdated'>
  ): Promise<JobPosting> {
    const dbInsert = jobPostingToDbInsert(jobData, this.userId);
    
    const { data, error } = await supabase
      .from('job_postings')
      .insert(dbInsert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save job: ${error.message}`);
    }
    return dbRowToJobPosting(data);
  }

  /**
   * Get a single job posting by ID
   * Requirements: 2.2, 3.1
   */
  async getJob(id: string): Promise<JobPosting | null> {
    const { data, error } = await supabase
      .from('job_postings')
      .select()
      .eq('id', id)
      .eq('user_id', this.userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to get job: ${error.message}`);
    }

    return dbRowToJobPosting(data);
  }

  /**
   * Get all job postings for the current user
   * Requirements: 2.2, 3.1
   */
  async getAllJobs(): Promise<JobPosting[]> {
    const { data, error } = await supabase
      .from('job_postings')
      .select()
      .eq('user_id', this.userId)
      .order('date_added', { ascending: false });

    if (error) {
      throw new Error(`Failed to get jobs: ${error.message}`);
    }

    return (data || []).map(dbRowToJobPosting);
  }

  /**
   * Update an existing job posting
   * Requirements: 2.3
   */
  async updateJob(
    id: string,
    updates: Partial<JobPosting>
  ): Promise<JobPosting | null> {
    const dbUpdate = jobUpdatesToDbUpdate(updates);

    const { data, error } = await supabase
      .from('job_postings')
      .update(dbUpdate)
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - job not found or not owned by user
        return null;
      }
      throw new Error(`Failed to update job: ${error.message}`);
    }

    return dbRowToJobPosting(data);
  }

  /**
   * Delete a job posting by ID
   * Requirements: 2.4
   */
  async deleteJob(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('job_postings')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId);

    if (error) {
      throw new Error(`Failed to delete job: ${error.message}`);
    }

    return true;
  }
}

/**
 * Factory function to create a SupabaseStorageService instance
 */
export function createSupabaseStorageService(userId: string): SupabaseStorageService {
  return new SupabaseStorageService(userId);
}

export default SupabaseStorageService;

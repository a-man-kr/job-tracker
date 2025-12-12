/**
 * useJobs Hook - Provides filtered and sorted job list with CRUD operations
 * Requirements: 6.1, 6.4, 10.1, 10.2, 10.4
 */

import { useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { applyFiltersAndSort } from '../utils/filterUtils';
import type { JobPosting, ApplicationStatus, ReferralStatus } from '../types';
import type { AddContactInput } from '../services/ContactService';

/**
 * Return type for the useJobs hook
 */
export interface UseJobsReturn {
  // Filtered and sorted job list
  jobs: JobPosting[];
  // All jobs without filters
  allJobs: JobPosting[];
  // Currently selected job
  selectedJob: JobPosting | null;
  // Loading state
  isLoading: boolean;
  // Error state
  error: string | null;
  // Current search query
  searchQuery: string;
  // Current status filter
  statusFilter: ApplicationStatus | 'All';
  // CRUD operations
  addJob: (job: Omit<JobPosting, 'id' | 'dateAdded' | 'lastUpdated'>) => Promise<JobPosting | null>;
  updateJob: (id: string, updates: Partial<JobPosting>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  updateJobStatus: (id: string, status: ApplicationStatus) => void;
  // Filter operations
  setSearch: (query: string) => void;
  setFilter: (filter: ApplicationStatus | 'All') => void;
  clearFilters: () => void;
  // Selection operations
  selectJob: (id: string | null) => void;
  // Modal operations
  isAddModalOpen: boolean;
  toggleAddModal: (open: boolean) => void;
  // Contact management operations - Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
  addContact: (jobId: string, contact: AddContactInput) => void;
  updateContactStatus: (jobId: string, contactId: string, status: ReferralStatus) => void;
  removeContact: (jobId: string, contactId: string) => void;
}

/**
 * Custom hook for managing jobs with filtering, sorting, and CRUD operations
 * Requirements: 6.1, 6.4, 10.1, 10.2, 10.4
 */
export function useJobs(): UseJobsReturn {
  const {
    state,
    addJob,
    updateJob,
    deleteJob,
    updateJobStatus,
    setSearch,
    setFilter,
    selectJob,
    toggleAddModal,
    addContact,
    updateContactStatus,
    removeContact,
  } = useAppContext();

  const { jobs: allJobs, searchQuery, statusFilter, selectedJobId, isLoading, error, isAddModalOpen } = state;

  // Apply filters and sorting to job list
  // Requirements: 6.4, 10.1, 10.2
  const filteredJobs = useMemo(() => {
    return applyFiltersAndSort(allJobs, searchQuery, statusFilter);
  }, [allJobs, searchQuery, statusFilter]);

  // Get currently selected job
  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    return allJobs.find(job => job.id === selectedJobId) ?? null;
  }, [allJobs, selectedJobId]);

  // Clear all filters
  // Requirements: 10.4
  const clearFilters = useCallback(() => {
    setSearch('');
    setFilter('All');
  }, [setSearch, setFilter]);

  return {
    // Filtered and sorted job list
    jobs: filteredJobs,
    // All jobs without filters
    allJobs,
    // Currently selected job
    selectedJob,
    // Loading state
    isLoading,
    // Error state
    error,
    // Current filters
    searchQuery,
    statusFilter,
    // CRUD operations
    addJob,
    updateJob,
    deleteJob,
    updateJobStatus,
    // Filter operations
    setSearch,
    setFilter,
    clearFilters,
    // Selection operations
    selectJob,
    // Modal operations
    isAddModalOpen,
    toggleAddModal,
    // Contact management operations
    addContact,
    updateContactStatus,
    removeContact,
  };
}

export default useJobs;

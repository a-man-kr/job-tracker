/**
 * Filter and search utilities for job list
 * Requirements: 6.4, 10.1, 10.2, 10.4
 */

import type { JobPosting, ApplicationStatus } from '../types';

/**
 * Filters jobs by search query matching job title or company name (case-insensitive)
 * Requirements: 10.1
 * 
 * @param jobs - Array of job postings to filter
 * @param query - Search query string
 * @returns Filtered array of jobs where title or company contains the query
 */
export function searchFilter(jobs: JobPosting[], query: string): JobPosting[] {
  if (!query || query.trim() === '') {
    return jobs;
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return jobs.filter(job => {
    const titleMatch = job.jobTitle.toLowerCase().includes(normalizedQuery);
    const companyMatch = job.company.toLowerCase().includes(normalizedQuery);
    return titleMatch || companyMatch;
  });
}

/**
 * Filters jobs by application status
 * Requirements: 10.2
 * 
 * @param jobs - Array of job postings to filter
 * @param status - ApplicationStatus to filter by, or 'All' to return all jobs
 * @returns Filtered array of jobs matching the specified status
 */
export function statusFilter(jobs: JobPosting[], status: ApplicationStatus | 'All'): JobPosting[] {
  if (status === 'All') {
    return jobs;
  }
  
  return jobs.filter(job => job.status === status);
}

/**
 * Sorts jobs by dateAdded in descending order (newest first)
 * Requirements: 6.4
 * 
 * @param jobs - Array of job postings to sort
 * @returns New array sorted by dateAdded descending
 */
export function sortByDateAdded(jobs: JobPosting[]): JobPosting[] {
  return [...jobs].sort((a, b) => {
    const dateA = new Date(a.dateAdded).getTime();
    const dateB = new Date(b.dateAdded).getTime();
    return dateB - dateA; // Descending order (newest first)
  });
}

/**
 * Applies all filters and sorting to a job list
 * Requirements: 6.4, 10.1, 10.2, 10.4
 * 
 * @param jobs - Array of job postings
 * @param searchQuery - Search query string
 * @param statusFilterValue - ApplicationStatus or 'All'
 * @returns Filtered and sorted array of jobs
 */
export function applyFiltersAndSort(
  jobs: JobPosting[],
  searchQuery: string,
  statusFilterValue: ApplicationStatus | 'All'
): JobPosting[] {
  let result = jobs;
  
  // Apply search filter
  result = searchFilter(result, searchQuery);
  
  // Apply status filter
  result = statusFilter(result, statusFilterValue);
  
  // Sort by date added (newest first)
  result = sortByDateAdded(result);
  
  return result;
}

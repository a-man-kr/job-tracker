/**
 * JobList Component - Displays all job postings in a scrollable list
 * Requirements: 6.1, 6.2, 6.3, 6.4, 12.1
 */

import { JobCard } from './JobCard';
import type { JobPosting } from '../types';

interface JobListProps {
  jobs: JobPosting[];
  selectedJobId: string | null;
  onSelectJob: (id: string | null) => void;
}

/**
 * JobList component - displays all saved JobPostings in a list view
 * Jobs are already sorted by dateAdded (newest first) from the useJobs hook
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export function JobList({ jobs, selectedJobId, onSelectJob }: JobListProps) {
  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-100">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            isSelected={job.id === selectedJobId}
            onClick={() => onSelectJob(job.id === selectedJobId ? null : job.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default JobList;

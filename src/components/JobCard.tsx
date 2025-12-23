/**
 * JobCard Component - Displays a single job posting in the list
 * Requirements: 6.2, 6.3, 12.2
 */

import type { JobPosting, ApplicationStatus, ReferralOutreachStatus } from '../types';

interface JobCardProps {
  job: JobPosting;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Status badge color mapping
 * Requirements: 12.2 - color-coded badges for visual clarity
 */
const statusColors: Record<ApplicationStatus, { bg: string; text: string }> = {
  Saved: { bg: 'bg-gray-100', text: 'text-gray-700' },
  Applied: { bg: 'bg-blue-100', text: 'text-blue-700' },
  Interview: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  Offer: { bg: 'bg-green-100', text: 'text-green-700' },
  Rejected: { bg: 'bg-red-100', text: 'text-red-700' },
};

/**
 * Referral outreach status colors and labels
 */
const referralStatusConfig: Record<ReferralOutreachStatus, { label: string; bg: string; text: string }> = {
  'Have to Find': { label: '🔍', bg: 'bg-gray-100', text: 'text-gray-600' },
  'Found Contact': { label: '👤', bg: 'bg-blue-100', text: 'text-blue-600' },
  'Messaged': { label: '✉️', bg: 'bg-yellow-100', text: 'text-yellow-600' },
  'Got Referral': { label: '✅', bg: 'bg-green-100', text: 'text-green-600' },
  'No Response': { label: '😐', bg: 'bg-orange-100', text: 'text-orange-600' },
  'Declined': { label: '❌', bg: 'bg-red-100', text: 'text-red-600' },
};

/**
 * Format date for display
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * JobCard component - displays job title, company, status badge, and date added
 * Requirements: 6.2, 6.3, 12.2
 */
export function JobCard({ job, isSelected, onClick }: JobCardProps) {
  const { bg, text } = statusColors[job.status];
  
  // Handle legacy jobs that don't have referralOutreachStatus
  const referralStatus = job.referralOutreachStatus || 'Have to Find';
  const referralConfig = referralStatusConfig[referralStatus] || referralStatusConfig['Have to Find'];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 focus:outline-none focus:bg-blue-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
      }`}
      aria-selected={isSelected}
      aria-label={`${job.jobTitle} at ${job.company}, status: ${job.status}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Job Title */}
          <h3 className="font-medium text-gray-900 truncate">{job.jobTitle}</h3>
          {/* Company Name */}
          <p className="text-sm text-gray-600 truncate mt-0.5">{job.company}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {/* Status Badge - Requirements: 12.2 */}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text} whitespace-nowrap`}
          >
            {job.status}
          </span>
          {/* Referral Status Badge */}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${referralConfig.bg} ${referralConfig.text}`}
            title={`Referral: ${referralStatus}`}
          >
            {referralConfig.label}
          </span>
        </div>
      </div>
      {/* Date Added and Special Indicators */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-400">
          Added {formatDate(job.dateAdded)}
        </p>
        <div className="flex items-center gap-1">
          {/* Application Requirements Indicator */}
          {job.applicationRequirements && (
            <span 
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700"
              title="Has special application requirements"
            >
              ⚠️
            </span>
          )}
          {/* Application Deadline Indicator */}
          {job.applicationDeadline && (
            <span 
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700"
              title={`Deadline: ${new Date(job.applicationDeadline).toLocaleDateString()}`}
            >
              ⏰
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default JobCard;

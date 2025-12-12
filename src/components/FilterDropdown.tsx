/**
 * FilterDropdown Component - Status filter for job applications
 * Requirements: 10.2 - Filter JobPostings by ApplicationStatus
 */

import type { ApplicationStatus } from '../types';

interface FilterDropdownProps {
  value: ApplicationStatus | 'All';
  onChange: (value: ApplicationStatus | 'All') => void;
}

const STATUS_OPTIONS: Array<ApplicationStatus | 'All'> = [
  'All',
  'Saved',
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
];

/**
 * Status color mapping for visual clarity
 * Requirements: 12.2 - Color-coded badges for visual clarity
 */
const STATUS_COLORS: Record<ApplicationStatus | 'All', string> = {
  All: 'bg-gray-100 text-gray-800',
  Saved: 'bg-blue-100 text-blue-800',
  Applied: 'bg-yellow-100 text-yellow-800',
  Interview: 'bg-purple-100 text-purple-800',
  Offer: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

/**
 * FilterDropdown for filtering jobs by application status
 * Requirements: 10.2, 10.3 - Real-time status filtering
 */
export function FilterDropdown({ value, onChange }: FilterDropdownProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as ApplicationStatus | 'All');
  };

  return (
    <div className="relative">
      <select
        value={value}
        onChange={handleChange}
        className={`appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-colors ${STATUS_COLORS[value]}`}
        aria-label="Filter by status"
      >
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {status === 'All' ? 'All Statuses' : status}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}

export default FilterDropdown;

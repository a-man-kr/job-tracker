/**
 * ExportButton Component - Triggers CSV export of job applications
 * Requirements: 7.1, 7.3 - Generate and download CSV file
 */

import { useState } from 'react';
import type { JobPosting } from '../types';
import { ExportService } from '../services/ExportService';

interface ExportButtonProps {
  jobs: JobPosting[];
  disabled?: boolean;
}

/**
 * ExportButton triggers CSV download of all job applications
 * Requirements: 7.1, 7.3 - Generate CSV and trigger browser download
 */
export function ExportButton({ jobs, disabled = false }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (jobs.length === 0) {
      return;
    }

    setIsExporting(true);
    try {
      // Small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 100));
      ExportService.downloadCSV(jobs);
    } finally {
      setIsExporting(false);
    }
  };

  const isDisabled = disabled || jobs.length === 0 || isExporting;

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isDisabled}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isDisabled
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
      }`}
      aria-label="Export jobs to CSV"
    >
      {isExporting ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>Export CSV</span>
        </>
      )}
    </button>
  );
}

export default ExportButton;

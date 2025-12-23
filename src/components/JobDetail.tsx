/**
 * JobDetail Component - Displays full details of a selected job posting
 * Requirements: 4.1, 4.5, 6.3, 12.1
 */

import { useState, useEffect, useCallback } from 'react';
import type { JobPosting, ApplicationStatus } from '../types';

interface JobDetailProps {
  job: JobPosting;
  onUpdateJob: (id: string, updates: Partial<JobPosting>) => void;
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onDeleteRequest?: (id: string) => void;
}

/**
 * Status badge color mapping
 * Requirements: 12.2 - color-coded badges for visual clarity
 */
const statusColors: Record<ApplicationStatus, { bg: string; text: string; border: string }> = {
  Saved: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  Applied: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  Interview: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  Offer: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  Rejected: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

const allStatuses: ApplicationStatus[] = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];

/**
 * Format date for display
 */
function formatDate(isoDate: string | null): string {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * StatusSelector component - dropdown for changing application status
 * Requirements: 4.2 - update status with immediate persistence
 */
function StatusSelector({
  status,
  onChange,
}: {
  status: ApplicationStatus;
  onChange: (status: ApplicationStatus) => void;
}) {
  const { bg, text, border } = statusColors[status];

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="status-select" className="text-sm font-medium text-gray-700">
        Status:
      </label>
      <select
        id="status-select"
        value={status}
        onChange={(e) => onChange(e.target.value as ApplicationStatus)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${bg} ${text} border ${border} focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
      >
        {allStatuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}


/**
 * NotesSection component - editable notes with auto-save
 * Requirements: 3.4 - persist notes with the record
 */
function NotesSection({
  notes,
  onSave,
}: {
  notes: string;
  onSave: (notes: string) => void;
}) {
  const [localNotes, setLocalNotes] = useState(notes);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state when prop changes (e.g., different job selected)
  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  // Auto-save with debounce
  useEffect(() => {
    if (localNotes === notes) return;

    setIsSaving(true);
    const timer = setTimeout(() => {
      onSave(localNotes);
      setIsSaving(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [localNotes, notes, onSave]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="notes" className="text-sm font-medium text-gray-700">
          Personal Notes
        </label>
        {isSaving && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
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
            Saving...
          </span>
        )}
      </div>
      <textarea
        id="notes"
        value={localNotes}
        onChange={(e) => setLocalNotes(e.target.value)}
        placeholder="Add your personal notes about this job..."
        className="w-full h-32 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />
    </div>
  );
}

/**
 * EditableField component - inline editable text field with auto-save
 */
function EditableField({
  value,
  onSave,
  className,
  placeholder,
}: {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Auto-save with debounce
  useEffect(() => {
    if (localValue === value || !isEditing) return;

    setIsSaving(true);
    const timer = setTimeout(() => {
      onSave(localValue);
      setIsSaving(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [localValue, value, isEditing, onSave]);

  if (isEditing) {
    return (
      <div className="relative">
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setIsEditing(false);
            if (e.key === 'Escape') {
              setLocalValue(value);
              setIsEditing(false);
            }
          }}
          autoFocus
          placeholder={placeholder}
          className={`${className} border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
        {isSaving && (
          <span className="absolute -right-6 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`${className} cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1 transition-colors group`}
      title="Click to edit"
    >
      {localValue || placeholder}
      <svg
        className="inline-block ml-2 h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </div>
  );
}

/**
 * JobDetail component - displays all job fields and allows editing
 * Requirements: 4.1, 4.5, 6.3, 12.1
 */
export function JobDetail({ job, onUpdateJob, onUpdateStatus, onDeleteRequest }: JobDetailProps) {
  // Handle status change with immediate persistence
  const handleStatusChange = useCallback(
    (newStatus: ApplicationStatus) => {
      onUpdateStatus(job.id, newStatus);
    },
    [job.id, onUpdateStatus]
  );

  // Handle notes save
  const handleNotesSave = useCallback(
    (notes: string) => {
      onUpdateJob(job.id, { notes });
    },
    [job.id, onUpdateJob]
  );

  // Handle job title save
  const handleJobTitleSave = useCallback(
    (jobTitle: string) => {
      onUpdateJob(job.id, { jobTitle });
    },
    [job.id, onUpdateJob]
  );

  // Handle company save
  const handleCompanySave = useCallback(
    (company: string) => {
      onUpdateJob(job.id, { company });
    },
    [job.id, onUpdateJob]
  );

  // Handle delete request - Requirements: 9.1
  const handleDeleteRequest = useCallback(() => {
    if (onDeleteRequest) {
      onDeleteRequest(job.id);
    }
  }, [job.id, onDeleteRequest]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Header with title and status */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <EditableField
            value={job.jobTitle}
            onSave={handleJobTitleSave}
            className="text-xl font-semibold text-gray-900 w-full"
            placeholder="Job Title"
          />
          <EditableField
            value={job.company}
            onSave={handleCompanySave}
            className="text-lg text-gray-600 mt-1 w-full"
            placeholder="Company Name"
          />
        </div>
        <div className="flex items-center gap-3">
          <StatusSelector status={job.status} onChange={handleStatusChange} />
          {/* Delete button - Requirements: 9.1 */}
          {onDeleteRequest && (
            <button
              type="button"
              onClick={handleDeleteRequest}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              aria-label="Delete job"
              title="Delete job"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Location */}
      {job.location && (
        <div className="flex items-center gap-2 text-gray-600">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{job.location}</span>
        </div>
      )}

      {/* LinkedIn URL */}
      {job.linkedInUrl && (
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <a
            href={job.linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline truncate"
          >
            View on LinkedIn
          </a>
        </div>
      )}

      {/* Application Link - Requirements: 6.3 */}
      {job.applicationLink && (
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          <a
            href={job.applicationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline truncate"
          >
            Apply Here
          </a>
        </div>
      )}

      {/* Application Requirements - Critical Info */}
      {job.applicationRequirements && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div className="flex-1">
              <h4 className="font-medium text-orange-800 mb-1">Application Requirements</h4>
              <p className="text-sm text-orange-700 whitespace-pre-wrap">{job.applicationRequirements}</p>
            </div>
          </div>
        </div>
      )}

      {/* Application Deadline */}
      {job.applicationDeadline && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <span className="font-medium text-red-800">Application Deadline:</span>
            <span className="text-red-700 ml-2">
              {new Date(job.applicationDeadline).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      )}

      {/* Job ID */}
      {job.jobId && (
        <div className="flex items-center gap-2 text-gray-600">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
            />
          </svg>
          <span className="text-sm">
            <span className="font-medium">Job ID:</span> {job.jobId}
          </span>
        </div>
      )}

      {/* Timestamps - Requirements: 4.5 */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 border-t border-gray-100 pt-4">
        <div>
          <span className="font-medium">Date Added:</span> {formatDate(job.dateAdded)}
        </div>
        <div>
          <span className="font-medium">Date Applied:</span> {formatDate(job.dateApplied)}
        </div>
        <div>
          <span className="font-medium">Last Updated:</span> {formatDate(job.lastUpdated)}
        </div>
      </div>

      {/* Job Description */}
      {job.description && (
        <div className="space-y-2 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-medium text-gray-700">Job Description</h3>
          <div className="text-sm text-gray-600 whitespace-pre-wrap max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-4">
            {job.description}
          </div>
        </div>
      )}

      {/* Notes Section - Requirements: 3.4 */}
      <div className="border-t border-gray-100 pt-4">
        <NotesSection notes={job.notes} onSave={handleNotesSave} />
      </div>
    </div>
  );
}

export default JobDetail;

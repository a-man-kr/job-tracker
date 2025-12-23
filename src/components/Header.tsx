/**
 * Header Component - Main navigation and controls for the Job Tracker
 * Requirements: 6.1, 10.1, 10.2, 12.1, 12.5, 1.4
 */

import { useState } from 'react';
import { SearchBar } from './SearchBar';
import { FilterDropdown } from './FilterDropdown';
import { ExportButton } from './ExportButton';
import { ResumeUpload, ResumeStatusButton } from './ResumeUpload';
import { SettingsModal } from './SettingsModal';
import { useAuth } from '../context/AuthContext';
import type { JobPosting, ApplicationStatus } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: ApplicationStatus | 'All';
  onFilterChange: (filter: ApplicationStatus | 'All') => void;
  jobs: JobPosting[];
  onAddJob: () => void;
}

/**
 * Header component with search, filter, export, and add job controls
 * Requirements: 6.1, 10.1, 10.2, 12.1, 12.5 - Responsive layout with controls
 */
export function Header({
  searchQuery,
  onSearchChange,
  statusFilter,
  onFilterChange,
  jobs,
  onAddJob,
}: HeaderProps) {
  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user, signOut, isAuthenticated } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top row: Logo and Add Job button */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <svg
              className="h-8 w-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h1 className="text-xl font-semibold text-gray-900">
              Job Tracker
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* User info and sign out - Requirements: 1.4 */}
            {isAuthenticated && user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={signOut}
                  className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
            {/* Resume Upload Button */}
            <ResumeStatusButton onClick={() => setShowResumeUpload(!showResumeUpload)} />
            
            {/* Settings Button */}
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-label="Settings"
              title="Settings"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            <button
              type="button"
              onClick={onAddJob}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              aria-label="Add new job"
            >
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="hidden sm:inline">Add Job</span>
            </button>
          </div>
        </div>

        {/* Resume Upload Panel - slides down when open */}
        {showResumeUpload && (
          <div className="pb-4">
            <ResumeUpload onClose={() => setShowResumeUpload(false)} />
          </div>
        )}

        {/* Bottom row: Search, Filter, Export - responsive layout */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pb-4">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search by job title or company..."
          />
          <div className="flex items-center gap-3">
            <FilterDropdown value={statusFilter} onChange={onFilterChange} />
            <ExportButton jobs={jobs} />
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </header>
  );
}

export default Header;

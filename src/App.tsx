/**
 * Main App Component - LinkedIn Job Application Tracker
 * Requirements: 1.7, 6.1, 8.3, 10.1, 10.2, 11.1, 11.2, 11.3, 12.1, 12.3, 12.4, 12.5
 * Supabase Requirements: 1.1, 5.1
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  Header,
  JobList,
  JobDetail,
  ReferralMessage,
  ReferralContacts,
  AddJobModal,
  DeleteConfirmation,
  ErrorBoundary,
  ToastContainer,
  StorageWarning,
} from './components';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { MigrationPrompt } from './components/MigrationPrompt';
import { NetworkStatus } from './components/NetworkStatus';
import type { AddJobModalHandle } from './components';
import { useJobs, useToast, useKeyboardShortcuts } from './hooks';
import { StorageService } from './services/StorageService';
import { MigrationService } from './services/MigrationService';
import './App.css';

/**
 * Main content component that uses the app context
 */
function AppContent() {
  const {
    jobs,
    allJobs,
    searchQuery,
    statusFilter,
    setSearch,
    setFilter,
    toggleAddModal,
    isAddModalOpen,
    isLoading,
    error,
    selectedJob,
    selectJob,
    addJob,
    updateJob,
    updateJobStatus,
    deleteJob,
    addContact,
    updateContactStatus,
    removeContact,
  } = useJobs();

  // Toast notification state - Requirements: 1.7, 8.3, 12.4
  const { toasts, removeToast, showError } = useToast();

  // Ref for AddJobModal to trigger save - Requirements: 11.3
  const addJobModalRef = useRef<AddJobModalHandle>(null);

  // Keyboard shortcuts - Requirements: 11.1, 11.2, 11.3
  useKeyboardShortcuts({
    // Shift+N opens the Add Job form (when no input focused) - Requirements: 11.1
    onOpenAddForm: useCallback(() => {
      toggleAddModal(true);
    }, [toggleAddModal]),
    // Esc closes the modal - Requirements: 11.2
    onCloseModal: useCallback(() => {
      if (isAddModalOpen) {
        toggleAddModal(false);
      }
    }, [isAddModalOpen, toggleAddModal]),
    // Cmd+Enter (Mac) / Ctrl+Enter (Windows) saves the job - Requirements: 11.3
    onSave: useCallback(() => {
      if (isAddModalOpen) {
        addJobModalRef.current?.triggerSave();
      }
    }, [isAddModalOpen]),
  });

  // Storage warning state - Requirements: 8.3
  const [showStorageWarning, setShowStorageWarning] = useState(false);
  const [storageWarningDismissed, setStorageWarningDismissed] = useState(false);

  // Check storage availability on mount - Requirements: 8.3
  useEffect(() => {
    if (!StorageService.isAvailable() && !storageWarningDismissed) {
      setShowStorageWarning(true);
    }
  }, [storageWarningDismissed]);

  // Show toast when error state changes - Requirements: 12.4
  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  // Handle storage warning dismiss
  const handleDismissStorageWarning = useCallback(() => {
    setShowStorageWarning(false);
    setStorageWarningDismissed(true);
  }, []);

  // State for delete confirmation dialog - Requirements: 9.1
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    jobId: string | null;
    jobTitle: string;
    company: string;
  }>({
    isOpen: false,
    jobId: null,
    jobTitle: '',
    company: '',
  });

  // Handle delete request - opens confirmation dialog
  // Requirements: 9.1 - prompt for confirmation before deletion
  const handleDeleteRequest = useCallback((jobId: string) => {
    const job = allJobs.find((j) => j.id === jobId);
    if (job) {
      setDeleteConfirmation({
        isOpen: true,
        jobId: job.id,
        jobTitle: job.jobTitle,
        company: job.company,
      });
    }
  }, [allJobs]);

  // Handle delete confirmation
  // Requirements: 9.2 - remove job and associated contacts from storage
  // Requirements: 9.3 - update list view immediately
  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirmation.jobId) {
      deleteJob(deleteConfirmation.jobId);
    }
    setDeleteConfirmation({
      isOpen: false,
      jobId: null,
      jobTitle: '',
      company: '',
    });
  }, [deleteConfirmation.jobId, deleteJob]);

  // Handle delete cancel
  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmation({
      isOpen: false,
      jobId: null,
      jobTitle: '',
      company: '',
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Storage Warning Banner - Requirements: 8.3 */}
      {showStorageWarning && (
        <StorageWarning onDismiss={handleDismissStorageWarning} />
      )}

      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onFilterChange={setFilter}
        jobs={allJobs}
        onAddJob={() => toggleAddModal(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <div className="flex items-center gap-2">
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-gray-500">
              <svg
                className="animate-spin h-6 w-6"
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
              <span>Loading jobs...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Job count summary */}
            <div className="mb-4 text-sm text-gray-600">
              {jobs.length === allJobs.length ? (
                <span>
                  {allJobs.length} {allJobs.length === 1 ? 'job' : 'jobs'} total
                </span>
              ) : (
                <span>
                  Showing {jobs.length} of {allJobs.length}{' '}
                  {allJobs.length === 1 ? 'job' : 'jobs'}
                </span>
              )}
            </div>

            {/* Empty state */}
            {allJobs.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No jobs yet
                </h3>
                <p className="mt-2 text-gray-500">
                  Get started by adding your first job application.
                </p>
                <button
                  type="button"
                  onClick={() => toggleAddModal(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
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
                  Add Job
                </button>
              </div>
            ) : jobs.length === 0 ? (
              /* No results from filter */
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No matching jobs
                </h3>
                <p className="mt-2 text-gray-500">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              /* Job list with detail view - Requirements: 6.1, 6.2, 6.3, 6.4, 12.2 */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Job list panel */}
                <div className="lg:col-span-1">
                  <JobList
                    jobs={jobs}
                    selectedJobId={selectedJob?.id ?? null}
                    onSelectJob={selectJob}
                  />
                </div>

                {/* Job detail panel - Requirements: 4.1, 4.5, 6.3, 12.1 */}
                <div className="lg:col-span-2 space-y-4">
                  {selectedJob ? (
                    <>
                      <JobDetail
                        job={selectedJob}
                        onUpdateJob={updateJob}
                        onUpdateStatus={updateJobStatus}
                        onDeleteRequest={handleDeleteRequest}
                      />
                      
                      {/* Referral Message - Requirements: 2.2, 2.3 */}
                      <ReferralMessage
                        message={selectedJob.referralMessage}
                        jobTitle={selectedJob.jobTitle}
                        company={selectedJob.company}
                        onSave={(message) => updateJob(selectedJob.id, { referralMessage: message })}
                      />
                      
                      {/* Referral Contacts - Requirements: 5.1, 5.4, 5.5 */}
                      <ReferralContacts
                        contacts={selectedJob.referralContacts}
                        outreachStatus={selectedJob.referralOutreachStatus}
                        onAddContact={(contact) => addContact(selectedJob.id, contact)}
                        onUpdateStatus={(contactId, status) => updateContactStatus(selectedJob.id, contactId, status)}
                        onRemoveContact={(contactId) => removeContact(selectedJob.id, contactId)}
                        onOutreachStatusChange={(status) => updateJob(selectedJob.id, { referralOutreachStatus: status })}
                      />
                    </>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <h3 className="mt-4 text-lg font-medium text-gray-900">
                        Select a job
                      </h3>
                      <p className="mt-2 text-gray-500">
                        Click on a job from the list to view its details.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Add Job Modal - Requirements: 1.1, 1.2, 1.3, 1.5, 1.7, 11.3, 12.3 */}
      <AddJobModal
        ref={addJobModalRef}
        isOpen={isAddModalOpen}
        onClose={() => toggleAddModal(false)}
        onSave={addJob}
      />

      {/* Delete Confirmation Dialog - Requirements: 9.1, 9.2, 9.3 */}
      <DeleteConfirmation
        isOpen={deleteConfirmation.isOpen}
        jobTitle={deleteConfirmation.jobTitle}
        company={deleteConfirmation.company}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Toast Notifications - Requirements: 1.7, 8.3, 12.4 */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

/**
 * Auth wrapper component that handles authentication flow
 * Requirements: 1.1, 5.1
 */
function AuthenticatedApp() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showMigration, setShowMigration] = useState(false);
  const [migrationChecked, setMigrationChecked] = useState(false);

  // Check for local data when user signs in
  useEffect(() => {
    if (isAuthenticated && !migrationChecked) {
      const hasLocal = MigrationService.hasLocalData();
      if (hasLocal) {
        setShowMigration(true);
      }
      setMigrationChecked(true);
    }
  }, [isAuthenticated, migrationChecked]);

  // Reset migration check when user changes
  useEffect(() => {
    if (!isAuthenticated) {
      setMigrationChecked(false);
      setShowMigration(false);
    }
  }, [isAuthenticated]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500">
          <svg
            className="animate-spin h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
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
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Show auth UI if not authenticated
  if (!isAuthenticated) {
    if (authMode === 'signup') {
      return <SignUp onSwitchToSignIn={() => setAuthMode('signin')} />;
    }
    return <SignIn onSwitchToSignUp={() => setAuthMode('signup')} />;
  }

  // Show migration prompt if needed
  if (showMigration && user) {
    return (
      <MigrationPrompt
        userId={user.id}
        localJobCount={MigrationService.getLocalJobCount()}
        onComplete={() => setShowMigration(false)}
        onSkip={() => setShowMigration(false)}
      />
    );
  }

  // Show main app with user context
  return (
    <AppProvider userId={user?.id ?? null}>
      <AppContent />
      <NetworkStatus />
    </AppProvider>
  );
}

/**
 * App component wrapped with AuthProvider and ErrorBoundary
 * Requirements: 12.4 - Display clear, actionable error messages
 */
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

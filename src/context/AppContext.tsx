/**
 * App Context and State Management for LinkedIn Job Application Tracker
 * Requirements: 4.2, 4.3, 4.4, 8.1
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { AppState, AppAction, JobPosting, ApplicationStatus, ReferralStatus } from '../types';
import type { IAsyncStorageService } from '../services/StorageService';
import { createStorageService } from '../services/StorageServiceFactory';
import { addContact as addContactToJob, updateContactStatus as updateContactStatusInJob, removeContact as removeContactFromJob, type AddContactInput } from '../services/ContactService';

/**
 * Initial state for the application
 */
const initialState: AppState = {
  jobs: [],
  searchQuery: '',
  statusFilter: 'All',
  selectedJobId: null,
  isAddModalOpen: false,
  isLoading: true,
  error: null,
};

/**
 * App state reducer - handles all state mutations
 * Requirements: 4.2, 4.3, 4.4
 */
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_JOBS':
      return {
        ...state,
        jobs: action.payload,
        isLoading: false,
      };

    case 'ADD_JOB':
      return {
        ...state,
        jobs: [action.payload, ...state.jobs],
      };

    case 'UPDATE_JOB': {
      const { id, updates } = action.payload;
      return {
        ...state,
        jobs: state.jobs.map((job) => {
          if (job.id !== id) return job;

          const now = new Date().toISOString();
          let updatedJob: JobPosting = {
            ...job,
            ...updates,
            lastUpdated: now, // Requirements: 4.3 - record timestamp of status change
          };

          // Requirements: 4.4 - auto-set dateApplied when status changes to "Applied"
          if (
            updates.status === 'Applied' &&
            job.status !== 'Applied' &&
            !job.dateApplied
          ) {
            updatedJob = {
              ...updatedJob,
              dateApplied: now,
            };
          }

          return updatedJob;
        }),
      };
    }

    case 'DELETE_JOB':
      return {
        ...state,
        jobs: state.jobs.filter((job) => job.id !== action.payload),
        selectedJobId:
          state.selectedJobId === action.payload ? null : state.selectedJobId,
      };

    case 'SET_SEARCH':
      return {
        ...state,
        searchQuery: action.payload,
      };

    case 'SET_FILTER':
      return {
        ...state,
        statusFilter: action.payload,
      };

    case 'SELECT_JOB':
      return {
        ...state,
        selectedJobId: action.payload,
      };

    case 'TOGGLE_ADD_MODAL':
      return {
        ...state,
        isAddModalOpen: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    default:
      return state;
  }
}


/**
 * Context value interface
 */
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Convenience methods
  addJob: (job: Omit<JobPosting, 'id' | 'dateAdded' | 'lastUpdated'>) => Promise<JobPosting | null>;
  updateJob: (id: string, updates: Partial<JobPosting>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  updateJobStatus: (id: string, status: ApplicationStatus) => void;
  setSearch: (query: string) => void;
  setFilter: (filter: ApplicationStatus | 'All') => void;
  selectJob: (id: string | null) => void;
  toggleAddModal: (open: boolean) => void;
  // Contact management methods - Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
  addContact: (jobId: string, contact: AddContactInput) => void;
  updateContactStatus: (jobId: string, contactId: string, status: ReferralStatus) => void;
  removeContact: (jobId: string, contactId: string) => void;
}

/**
 * Create the context with undefined default
 */
const AppContext = createContext<AppContextValue | undefined>(undefined);

/**
 * Props for the AppProvider component
 */
interface AppProviderProps {
  children: ReactNode;
  userId?: string | null; // Optional user ID for cloud storage
}

/**
 * App Context Provider
 * Provides state management with storage integration and auto-save
 * Requirements: 8.1 - save to storage within 1 second of any data change
 */
export function AppProvider({ children, userId = null }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Get the appropriate storage service based on auth state
  const storageService: IAsyncStorageService = React.useMemo(
    () => createStorageService(userId),
    [userId]
  );

  // Load jobs from storage on mount or when userId changes
  // Requirements: 8.2 - restore all previously saved JobPostings
  useEffect(() => {
    const loadJobs = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        if (!storageService.isAvailable()) {
          dispatch({
            type: 'SET_ERROR',
            payload: 'Storage is not available. Data will not persist.',
          });
        }
        const jobs = await storageService.getAllJobs();
        dispatch({ type: 'SET_JOBS', payload: jobs });
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Failed to load saved jobs.',
        });
        dispatch({ type: 'SET_JOBS', payload: [] });
      }
    };

    loadJobs();
  }, [storageService]);

  /**
   * Add a new job with storage integration
   * Requirements: 3.1, 8.1
   */
  const addJob = useCallback(
    async (jobData: Omit<JobPosting, 'id' | 'dateAdded' | 'lastUpdated'>): Promise<JobPosting | null> => {
      try {
        const newJob = await storageService.saveJob(jobData);
        dispatch({ type: 'ADD_JOB', payload: newJob });
        return newJob;
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Failed to save job. Please try again.',
        });
        return null;
      }
    },
    [storageService, userId]
  );

  /**
   * Update an existing job with storage integration
   * Requirements: 4.2, 4.3, 8.1
   */
  const updateJob = useCallback(async (id: string, updates: Partial<JobPosting>) => {
    // First update local state (optimistic update)
    dispatch({ type: 'UPDATE_JOB', payload: { id, updates } });

    // Then persist to storage
    // Requirements: 8.1 - save within 1 second
    try {
      // Get the current job to check for status change to "Applied"
      const currentJob = await storageService.getJob(id);
      if (currentJob) {
        const now = new Date().toISOString();
        let finalUpdates = { ...updates, lastUpdated: now };

        // Requirements: 4.4 - auto-set dateApplied when status changes to "Applied"
        if (
          updates.status === 'Applied' &&
          currentJob.status !== 'Applied' &&
          !currentJob.dateApplied
        ) {
          finalUpdates = { ...finalUpdates, dateApplied: now };
        }

        await storageService.updateJob(id, finalUpdates);
      }
    } catch {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to save changes. Please try again.',
      });
    }
  }, [storageService]);

  /**
   * Update job status specifically
   * Requirements: 4.2, 4.3, 4.4
   */
  const updateJobStatus = useCallback(
    (id: string, status: ApplicationStatus) => {
      updateJob(id, { status });
    },
    [updateJob]
  );

  /**
   * Delete a job with storage integration
   * Requirements: 9.2
   */
  const deleteJob = useCallback(async (id: string) => {
    try {
      const success = await storageService.deleteJob(id);
      if (success) {
        dispatch({ type: 'DELETE_JOB', payload: id });
      } else {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Failed to delete job. Please try again.',
        });
      }
    } catch {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to delete job. Please try again.',
      });
    }
  }, [storageService]);

  /**
   * Set search query
   */
  const setSearch = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH', payload: query });
  }, []);

  /**
   * Set status filter
   */
  const setFilter = useCallback((filter: ApplicationStatus | 'All') => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  }, []);

  /**
   * Select a job
   */
  const selectJob = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_JOB', payload: id });
  }, []);

  /**
   * Toggle add modal
   */
  const toggleAddModal = useCallback((open: boolean) => {
    dispatch({ type: 'TOGGLE_ADD_MODAL', payload: open });
  }, []);

  /**
   * Add a referral contact to a job
   * Requirements: 5.1, 5.2, 5.3
   */
  const addContact = useCallback(
    (jobId: string, contactInput: AddContactInput) => {
      const job = state.jobs.find((j) => j.id === jobId);
      if (!job) {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Job not found.',
        });
        return;
      }

      const updatedJob = addContactToJob(job, contactInput);
      
      // Update local state
      dispatch({
        type: 'UPDATE_JOB',
        payload: { id: jobId, updates: { referralContacts: updatedJob.referralContacts } },
      });

      // Persist to storage
      try {
        storageService.updateJob(jobId, { 
          referralContacts: updatedJob.referralContacts,
          lastUpdated: updatedJob.lastUpdated,
        });
      } catch {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Failed to save contact. Please try again.',
        });
      }
    },
    [state.jobs, storageService]
  );

  /**
   * Update a referral contact's status
   * Requirements: 5.4, 5.5
   */
  const updateContactStatusFn = useCallback(
    (jobId: string, contactId: string, newStatus: ReferralStatus) => {
      const job = state.jobs.find((j) => j.id === jobId);
      if (!job) {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Job not found.',
        });
        return;
      }

      const updatedJob = updateContactStatusInJob(job, contactId, newStatus);
      
      // Update local state
      dispatch({
        type: 'UPDATE_JOB',
        payload: { id: jobId, updates: { referralContacts: updatedJob.referralContacts } },
      });

      // Persist to storage immediately - Requirements: 5.4
      try {
        storageService.updateJob(jobId, { 
          referralContacts: updatedJob.referralContacts,
          lastUpdated: updatedJob.lastUpdated,
        });
      } catch {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Failed to update contact status. Please try again.',
        });
      }
    },
    [state.jobs, storageService]
  );

  /**
   * Remove a referral contact from a job
   * Requirements: 5.1
   */
  const removeContactFn = useCallback(
    (jobId: string, contactId: string) => {
      const job = state.jobs.find((j) => j.id === jobId);
      if (!job) {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Job not found.',
        });
        return;
      }

      const updatedJob = removeContactFromJob(job, contactId);
      
      // Update local state
      dispatch({
        type: 'UPDATE_JOB',
        payload: { id: jobId, updates: { referralContacts: updatedJob.referralContacts } },
      });

      // Persist to storage
      try {
        storageService.updateJob(jobId, { 
          referralContacts: updatedJob.referralContacts,
          lastUpdated: updatedJob.lastUpdated,
        });
      } catch {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Failed to remove contact. Please try again.',
        });
      }
    },
    [state.jobs, storageService]
  );

  const value: AppContextValue = {
    state,
    dispatch,
    addJob,
    updateJob,
    deleteJob,
    updateJobStatus,
    setSearch,
    setFilter,
    selectJob,
    toggleAddModal,
    addContact,
    updateContactStatus: updateContactStatusFn,
    removeContact: removeContactFn,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Custom hook to use the App Context
 * Throws an error if used outside of AppProvider
 */
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export { AppContext };
export type { AppContextValue };

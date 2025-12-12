/**
 * Tests for AppContext reducer
 * Requirements: 4.2, 4.3, 4.4, 8.1
 */

import { describe, it, expect } from 'vitest';
import { appReducer } from './AppContext';
import type { AppState, JobPosting } from '../types';

// Helper to create a mock job posting
function createMockJob(overrides: Partial<JobPosting> = {}): JobPosting {
  return {
    id: 'test-id-1',
    jobId: null,
    jobTitle: 'Software Engineer',
    company: 'Test Company',
    location: 'Remote',
    description: 'Test description',
    linkedInUrl: null,
    applicationLink: null,
    referralMessage: 'Test message',
    referralOutreachStatus: 'Have to Find',
    notes: '',
    status: 'Saved',
    referralContacts: [],
    dateAdded: '2024-01-01T00:00:00.000Z',
    dateApplied: null,
    lastUpdated: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// Helper to create initial state
function createInitialState(overrides: Partial<AppState> = {}): AppState {
  return {
    jobs: [],
    searchQuery: '',
    statusFilter: 'All',
    selectedJobId: null,
    isAddModalOpen: false,
    isLoading: false,
    error: null,
    ...overrides,
  };
}

describe('appReducer', () => {
  describe('SET_JOBS', () => {
    it('should set jobs and set isLoading to false', () => {
      const state = createInitialState({ isLoading: true });
      const jobs = [createMockJob()];

      const newState = appReducer(state, { type: 'SET_JOBS', payload: jobs });

      expect(newState.jobs).toEqual(jobs);
      expect(newState.isLoading).toBe(false);
    });
  });

  describe('ADD_JOB', () => {
    it('should add job to the beginning of the list', () => {
      const existingJob = createMockJob({ id: 'existing' });
      const state = createInitialState({ jobs: [existingJob] });
      const newJob = createMockJob({ id: 'new-job' });

      const newState = appReducer(state, { type: 'ADD_JOB', payload: newJob });

      expect(newState.jobs).toHaveLength(2);
      expect(newState.jobs[0].id).toBe('new-job');
    });
  });


  describe('UPDATE_JOB', () => {
    it('should update job fields and set lastUpdated timestamp', () => {
      const job = createMockJob();
      const state = createInitialState({ jobs: [job] });
      const originalLastUpdated = job.lastUpdated;

      const newState = appReducer(state, {
        type: 'UPDATE_JOB',
        payload: { id: job.id, updates: { notes: 'Updated notes' } },
      });

      expect(newState.jobs[0].notes).toBe('Updated notes');
      expect(new Date(newState.jobs[0].lastUpdated).getTime()).toBeGreaterThanOrEqual(
        new Date(originalLastUpdated).getTime()
      );
    });

    /**
     * Requirements: 4.4 - auto-set dateApplied when status changes to "Applied"
     */
    it('should auto-set dateApplied when status changes to Applied', () => {
      const job = createMockJob({ status: 'Saved', dateApplied: null });
      const state = createInitialState({ jobs: [job] });

      const newState = appReducer(state, {
        type: 'UPDATE_JOB',
        payload: { id: job.id, updates: { status: 'Applied' } },
      });

      expect(newState.jobs[0].status).toBe('Applied');
      expect(newState.jobs[0].dateApplied).not.toBeNull();
      // Verify it's a valid ISO date string
      expect(() => new Date(newState.jobs[0].dateApplied!)).not.toThrow();
    });

    it('should NOT overwrite existing dateApplied when status changes to Applied', () => {
      const existingDate = '2024-06-15T10:00:00.000Z';
      const job = createMockJob({ status: 'Interview', dateApplied: existingDate });
      const state = createInitialState({ jobs: [job] });

      const newState = appReducer(state, {
        type: 'UPDATE_JOB',
        payload: { id: job.id, updates: { status: 'Applied' } },
      });

      // dateApplied should remain unchanged since it was already set
      expect(newState.jobs[0].dateApplied).toBe(existingDate);
    });

    it('should NOT set dateApplied when status changes to non-Applied status', () => {
      const job = createMockJob({ status: 'Saved', dateApplied: null });
      const state = createInitialState({ jobs: [job] });

      const newState = appReducer(state, {
        type: 'UPDATE_JOB',
        payload: { id: job.id, updates: { status: 'Interview' } },
      });

      expect(newState.jobs[0].status).toBe('Interview');
      expect(newState.jobs[0].dateApplied).toBeNull();
    });

    it('should not update non-existent job', () => {
      const job = createMockJob();
      const state = createInitialState({ jobs: [job] });

      const newState = appReducer(state, {
        type: 'UPDATE_JOB',
        payload: { id: 'non-existent', updates: { notes: 'Updated' } },
      });

      expect(newState.jobs).toEqual(state.jobs);
    });
  });

  describe('DELETE_JOB', () => {
    it('should remove job from list', () => {
      const job = createMockJob();
      const state = createInitialState({ jobs: [job] });

      const newState = appReducer(state, { type: 'DELETE_JOB', payload: job.id });

      expect(newState.jobs).toHaveLength(0);
    });

    it('should clear selectedJobId if deleted job was selected', () => {
      const job = createMockJob();
      const state = createInitialState({ jobs: [job], selectedJobId: job.id });

      const newState = appReducer(state, { type: 'DELETE_JOB', payload: job.id });

      expect(newState.selectedJobId).toBeNull();
    });

    it('should keep selectedJobId if different job was deleted', () => {
      const job1 = createMockJob({ id: 'job-1' });
      const job2 = createMockJob({ id: 'job-2' });
      const state = createInitialState({ jobs: [job1, job2], selectedJobId: 'job-1' });

      const newState = appReducer(state, { type: 'DELETE_JOB', payload: 'job-2' });

      expect(newState.selectedJobId).toBe('job-1');
    });
  });

  describe('SET_SEARCH', () => {
    it('should set search query', () => {
      const state = createInitialState();

      const newState = appReducer(state, { type: 'SET_SEARCH', payload: 'engineer' });

      expect(newState.searchQuery).toBe('engineer');
    });
  });

  describe('SET_FILTER', () => {
    it('should set status filter', () => {
      const state = createInitialState();

      const newState = appReducer(state, { type: 'SET_FILTER', payload: 'Applied' });

      expect(newState.statusFilter).toBe('Applied');
    });
  });

  describe('SELECT_JOB', () => {
    it('should set selected job id', () => {
      const state = createInitialState();

      const newState = appReducer(state, { type: 'SELECT_JOB', payload: 'job-123' });

      expect(newState.selectedJobId).toBe('job-123');
    });

    it('should allow setting to null', () => {
      const state = createInitialState({ selectedJobId: 'job-123' });

      const newState = appReducer(state, { type: 'SELECT_JOB', payload: null });

      expect(newState.selectedJobId).toBeNull();
    });
  });

  describe('TOGGLE_ADD_MODAL', () => {
    it('should toggle add modal state', () => {
      const state = createInitialState({ isAddModalOpen: false });

      const newState = appReducer(state, { type: 'TOGGLE_ADD_MODAL', payload: true });

      expect(newState.isAddModalOpen).toBe(true);
    });
  });

  describe('SET_LOADING', () => {
    it('should set loading state', () => {
      const state = createInitialState({ isLoading: false });

      const newState = appReducer(state, { type: 'SET_LOADING', payload: true });

      expect(newState.isLoading).toBe(true);
    });
  });

  describe('SET_ERROR', () => {
    it('should set error message', () => {
      const state = createInitialState();

      const newState = appReducer(state, { type: 'SET_ERROR', payload: 'An error occurred' });

      expect(newState.error).toBe('An error occurred');
    });

    it('should allow clearing error', () => {
      const state = createInitialState({ error: 'Previous error' });

      const newState = appReducer(state, { type: 'SET_ERROR', payload: null });

      expect(newState.error).toBeNull();
    });
  });
});

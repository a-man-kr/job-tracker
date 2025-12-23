/**
 * AddJobModal Component - Modal for adding new job postings
 * Requirements: 1.1, 1.2, 1.3, 1.5, 1.7, 12.3
 */

import { useState, useCallback, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { extractJobDetails, generateReferralMessage, AIServiceError } from '../services/AIService';
import { getCurrentAIModel, getModelDisplayName } from '../services/SettingsService';
import type { JobPosting } from '../types';

/**
 * Ref handle for AddJobModal - allows parent to trigger save
 * Requirements: 11.3
 */
export interface AddJobModalHandle {
  triggerSave: () => void;
}

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (job: Omit<JobPosting, 'id' | 'dateAdded' | 'lastUpdated'>) => Promise<JobPosting | null>;
}

interface FormState {
  rawText: string;
  jobTitle: string;
  company: string;
  location: string;
  description: string;
  linkedInUrl: string;
  applicationLink: string;
  applicationRequirements: string;
  applicationDeadline: string;
  jobId: string;
  referralMessage: string;
}

const initialFormState: FormState = {
  rawText: '',
  jobTitle: '',
  company: '',
  location: '',
  description: '',
  linkedInUrl: '',
  applicationLink: '',
  applicationRequirements: '',
  applicationDeadline: '',
  jobId: '',
  referralMessage: '',
};

/**
 * AddJobModal component - allows users to paste job posting text and extract details
 * Requirements: 1.1, 1.2, 1.3, 1.5, 1.7, 11.3, 12.3
 */
export const AddJobModal = forwardRef<AddJobModalHandle, AddJobModalProps>(function AddJobModal(
  { isOpen, onClose, onSave },
  ref
) {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExtracted, setHasExtracted] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormState(initialFormState);
      setError(null);
      setHasExtracted(false);
      // Focus textarea when modal opens
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Handle escape key to close
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);


  /**
   * Extract job details from pasted text using AI
   * Requirements: 1.1, 1.2, 1.7
   */
  const handleExtract = useCallback(async () => {
    if (!formState.rawText.trim()) {
      setError('Please paste job posting text first.');
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      // Requirements: 1.1 - Extract job details from pasted text
      const extracted = await extractJobDetails(formState.rawText);
      
      // Requirements: 1.2 - Display extracted fields in editable form
      setFormState((prev) => ({
        ...prev,
        jobTitle: extracted.jobTitle ?? '',
        company: extracted.company ?? '',
        location: extracted.location ?? '',
        description: extracted.description ?? '',
        applicationLink: extracted.applicationLink ?? '',
        applicationRequirements: extracted.applicationRequirements ?? '',
        applicationDeadline: extracted.applicationDeadline ?? '',
        jobId: extracted.jobId ?? '',
      }));
      
      setHasExtracted(true);

      // Generate referral message if we have job title and company
      if (extracted.jobTitle && extracted.company) {
        setIsGeneratingMessage(true);
        try {
          const message = await generateReferralMessage(extracted.jobTitle, extracted.company);
          setFormState((prev) => ({
            ...prev,
            referralMessage: message,
          }));
        } catch (msgError) {
          // Don't fail the whole extraction if message generation fails
          console.error('Failed to generate referral message:', msgError);
        } finally {
          setIsGeneratingMessage(false);
        }
      }
    } catch (err) {
      // Requirements: 1.7 - Display error message and allow manual entry
      if (err instanceof AIServiceError) {
        switch (err.code) {
          case 'NO_API_KEY':
            setError('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env.local file.');
            break;
          case 'TIMEOUT':
            setError('Request timed out. Please try again or enter details manually.');
            break;
          case 'NETWORK_ERROR':
            setError('Network error. Please check your connection and try again.');
            break;
          default:
            setError('Failed to extract job details. Please try again or enter details manually.');
        }
      } else {
        setError('Failed to extract job details. Please try again or enter details manually.');
      }
      // Allow manual entry by setting hasExtracted to true
      setHasExtracted(true);
    } finally {
      setIsExtracting(false);
    }
  }, [formState.rawText]);

  /**
   * Handle form field changes
   * Requirements: 1.3 - Allow user to edit any field before saving
   */
  const handleFieldChange = useCallback((field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }, []);

  // State for saving
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Handle save button click
   */
  const handleSave = useCallback(async () => {
    // Validate required field
    if (!formState.jobTitle.trim()) {
      setError('Job title is required.');
      return;
    }

    const newJob: Omit<JobPosting, 'id' | 'dateAdded' | 'lastUpdated'> = {
      jobTitle: formState.jobTitle.trim(),
      company: formState.company.trim(),
      location: formState.location.trim(),
      description: formState.description.trim(),
      linkedInUrl: formState.linkedInUrl.trim() || null,
      applicationLink: formState.applicationLink.trim() || null,
      applicationRequirements: formState.applicationRequirements.trim() || null,
      applicationDeadline: formState.applicationDeadline.trim() || null,
      jobId: formState.jobId.trim() || null,
      referralMessage: formState.referralMessage.trim(),
      referralOutreachStatus: 'Have to Find',
      notes: '',
      status: 'Saved',
      referralContacts: [],
      dateApplied: null,
    };

    setIsSaving(true);
    try {
      const savedJob = await onSave(newJob);
      if (savedJob) {
        onClose();
      }
      // If savedJob is null, the error will be shown by AppContext
    } catch (err) {
      setError('Failed to save job. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [formState, onSave, onClose]);

  /**
   * Expose triggerSave method via ref for keyboard shortcuts
   * Requirements: 11.3
   */
  useImperativeHandle(ref, () => ({
    triggerSave: () => {
      if (hasExtracted && formState.jobTitle.trim()) {
        handleSave();
      }
    },
  }), [hasExtracted, formState.jobTitle, handleSave]);

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl transform transition-all"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
              Add New Job
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Raw text input - Requirements: 1.1 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="raw-text" className="block text-sm font-medium text-gray-700">
                  Paste Job Posting Text
                </label>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Using {getModelDisplayName(getCurrentAIModel())}
                </span>
              </div>
              <textarea
                ref={textareaRef}
                id="raw-text"
                value={formState.rawText}
                onChange={(e) => handleFieldChange('rawText', e.target.value)}
                placeholder="Paste the full job posting text from LinkedIn here..."
                className="w-full h-40 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isExtracting}
              />
              <button
                type="button"
                onClick={handleExtract}
                disabled={isExtracting || !formState.rawText.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExtracting ? (
                  <>
                    {/* Loading indicator - Requirements: 12.3 */}
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Extracting...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Extract Details
                  </>
                )}
              </button>
            </div>


            {/* Extracted/Editable fields - Requirements: 1.2, 1.3 */}
            {hasExtracted && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700">Job Details</h3>
                
                {/* Job Title - Required */}
                <div className="space-y-1">
                  <label htmlFor="job-title" className="block text-sm font-medium text-gray-700">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="job-title"
                    value={formState.jobTitle}
                    onChange={(e) => handleFieldChange('jobTitle', e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Company */}
                <div className="space-y-1">
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={formState.company}
                    onChange={(e) => handleFieldChange('company', e.target.value)}
                    placeholder="e.g., Acme Corp"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={formState.location}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                    placeholder="e.g., San Francisco, CA or Remote"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* LinkedIn URL - Requirements: 1.5 */}
                <div className="space-y-1">
                  <label htmlFor="linkedin-url" className="block text-sm font-medium text-gray-700">
                    LinkedIn URL <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="url"
                    id="linkedin-url"
                    value={formState.linkedInUrl}
                    onChange={(e) => handleFieldChange('linkedInUrl', e.target.value)}
                    placeholder="https://www.linkedin.com/jobs/view/..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Application Link - Requirements: 1.8 */}
                <div className="space-y-1">
                  <label htmlFor="application-link" className="block text-sm font-medium text-gray-700">
                    Application Link <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="url"
                    id="application-link"
                    value={formState.applicationLink}
                    onChange={(e) => handleFieldChange('applicationLink', e.target.value)}
                    placeholder="https://company.com/careers/apply/..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Application Requirements - Critical Info */}
                <div className="space-y-1">
                  <label htmlFor="application-requirements" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    Application Requirements
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      Important
                    </span>
                  </label>
                  <textarea
                    id="application-requirements"
                    value={formState.applicationRequirements}
                    onChange={(e) => handleFieldChange('applicationRequirements', e.target.value)}
                    placeholder="e.g., Apply via email to siddhi.c1125@minimalix.in with subject line: [Role] - Winter Internship - Your Name"
                    className="w-full h-20 px-3 py-2 text-sm border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none bg-orange-50"
                  />
                  <p className="text-xs text-orange-600">
                    ⚠️ Capture special application instructions to avoid missing important details
                  </p>
                </div>

                {/* Application Deadline */}
                <div className="space-y-1">
                  <label htmlFor="application-deadline" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    Application Deadline
                    <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="date"
                    id="application-deadline"
                    value={formState.applicationDeadline}
                    onChange={(e) => handleFieldChange('applicationDeadline', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Job ID */}
                <div className="space-y-1">
                  <label htmlFor="job-id" className="block text-sm font-medium text-gray-700">
                    Job ID / Req ID <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="job-id"
                    value={formState.jobId}
                    onChange={(e) => handleFieldChange('jobId', e.target.value)}
                    placeholder="e.g., 1656147, REQ-2024-001"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Job Description
                  </label>
                  <textarea
                    id="description"
                    value={formState.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Brief summary of the job responsibilities and requirements..."
                    className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Referral Message */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="referral-message" className="block text-sm font-medium text-gray-700">
                      AI Referral Message
                    </label>
                    {isGeneratingMessage && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Generating...
                      </span>
                    )}
                  </div>
                  <textarea
                    id="referral-message"
                    value={formState.referralMessage}
                    onChange={(e) => handleFieldChange('referralMessage', e.target.value)}
                    placeholder="AI-generated referral message will appear here..."
                    className="w-full h-32 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}
          </div>


          {/* Footer with action buttons */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasExtracted || !formState.jobTitle.trim() || isExtracting || isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Job'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AddJobModal;

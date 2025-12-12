/**
 * ResumeUpload Component - Allows users to upload/paste their resume for AI context
 */

import { useState, useCallback, useEffect } from 'react';
import { saveResume, getResume, clearResume, hasResume } from '../services/ResumeService';

interface ResumeUploadProps {
  onClose?: () => void;
}

export function ResumeUpload({ onClose }: ResumeUploadProps) {
  const [resumeText, setResumeText] = useState('');
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadDate, setUploadDate] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Load existing resume on mount
  useEffect(() => {
    const existing = getResume();
    if (existing) {
      setResumeText(existing.text);
      setIsUploaded(true);
      setUploadDate(existing.uploadedAt);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!resumeText.trim()) {
      return;
    }
    
    try {
      saveResume(resumeText.trim());
      setIsUploaded(true);
      setUploadDate(new Date().toISOString());
      setSaveStatus('saved');
      setShowEditor(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [resumeText]);

  const handleClear = useCallback(() => {
    if (confirm('Are you sure you want to remove your resume? AI messages will use the default profile.')) {
      clearResume();
      setResumeText('');
      setIsUploaded(false);
      setUploadDate(null);
    }
  }, []);

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Your Resume
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isUploaded && !showEditor ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Resume uploaded
            {uploadDate && (
              <span className="text-gray-400">• {formatDate(uploadDate)}</span>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
            <p className="text-xs text-gray-600 whitespace-pre-wrap line-clamp-4">
              {resumeText.substring(0, 300)}...
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowEditor(true)}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Edit Resume
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Paste your resume text below. This will be used as context for generating personalized referral messages.
          </p>
          
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder={`Paste your resume here...

Example format:
Name: John Doe
Education: B.Tech Computer Science, IIT Delhi
Experience: Software Engineer at Google (2 years)
Skills: Python, JavaScript, Machine Learning
Projects: Built recommendation system, Led team of 5...`}
            className="w-full h-48 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!resumeText.trim()}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                saveStatus === 'saved'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saveStatus === 'saved' ? (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved!
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Resume
                </>
              )}
            </button>
            {isUploaded && (
              <button
                type="button"
                onClick={() => {
                  const existing = getResume();
                  if (existing) setResumeText(existing.text);
                  setShowEditor(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Your resume is stored locally in your browser and used to personalize AI-generated referral messages.
      </p>
    </div>
  );
}

/**
 * Small button to show resume status and open upload modal
 */
export function ResumeStatusButton({ onClick }: { onClick: () => void }) {
  const [hasResumeStored, setHasResumeStored] = useState(false);

  useEffect(() => {
    setHasResumeStored(hasResume());
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        hasResumeStored
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      title={hasResumeStored ? 'Resume uploaded - click to edit' : 'Upload your resume for better AI messages'}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {hasResumeStored ? 'Resume ✓' : 'Add Resume'}
    </button>
  );
}

export default ResumeUpload;

/**
 * ReferralMessage Component - Displays and allows editing of AI-generated referral message
 * Requirements: 2.2, 2.3
 */

import { useState, useEffect, useCallback } from 'react';
import { generateReferralMessage, AIServiceError } from '../services/AIService';

interface ReferralMessageProps {
  message: string;
  jobTitle: string;
  company: string;
  onSave: (message: string) => void;
}

/**
 * ReferralMessage component - displays editable referral message with copy and regenerate functionality
 * Requirements: 2.2 - allow editing before copying
 * Requirements: 2.3 - copy to clipboard
 */
export function ReferralMessage({ message, jobTitle, company, onSave }: ReferralMessageProps) {
  const [localMessage, setLocalMessage] = useState(message);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync local state when prop changes (e.g., different job selected)
  useEffect(() => {
    setLocalMessage(message);
    setError(null);
  }, [message]);

  // Auto-save with debounce
  useEffect(() => {
    if (localMessage === message) return;

    setIsSaving(true);
    const timer = setTimeout(() => {
      onSave(localMessage);
      setIsSaving(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [localMessage, message, onSave]);

  // Copy to clipboard - Requirements: 2.3
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(localMessage);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  }, [localMessage]);

  // Regenerate message with optional custom prompt
  const handleRegenerate = useCallback(async () => {
    if (!jobTitle || !company) {
      setError('Job title and company are required to generate a message');
      return;
    }

    setIsRegenerating(true);
    setError(null);

    try {
      const newMessage = await generateReferralMessage(
        jobTitle,
        company,
        customPrompt.trim() || undefined
      );
      setLocalMessage(newMessage);
      onSave(newMessage);
      setShowCustomPrompt(false);
      setCustomPrompt('');
    } catch (err) {
      if (err instanceof AIServiceError) {
        switch (err.code) {
          case 'NO_API_KEY':
            setError('API key not configured. Add VITE_GEMINI_API_KEY to .env.local');
            break;
          case 'TIMEOUT':
            setError('Request timed out. Please try again.');
            break;
          default:
            setError('Failed to generate message. Please try again.');
        }
      } else {
        setError('Failed to generate message. Please try again.');
      }
    } finally {
      setIsRegenerating(false);
    }
  }, [jobTitle, company, customPrompt, onSave]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          AI Referral Message
        </h3>
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          )}
          
          {/* Regenerate Button */}
          <button
            type="button"
            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
            disabled={isRegenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors disabled:opacity-50"
            title="Regenerate with custom instructions"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {showCustomPrompt ? 'Cancel' : 'Regenerate'}
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!localMessage}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              copyStatus === 'copied'
                ? 'bg-green-100 text-green-700'
                : copyStatus === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {copyStatus === 'copied' ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : copyStatus === 'error' ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Failed
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Custom prompt input for regeneration */}
      {showCustomPrompt && (
        <div className="space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <label className="text-sm font-medium text-purple-700">
            Custom instructions (optional)
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g., Make it shorter, mention my quant experience, ask about internship instead..."
            className="w-full h-20 px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors disabled:opacity-50"
            >
              {isRegenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate New Message
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCustomPrompt(false);
                setCustomPrompt('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Editable message - Requirements: 2.2 */}
      <textarea
        value={localMessage}
        onChange={(e) => setLocalMessage(e.target.value)}
        placeholder="No referral message generated yet. Click 'Regenerate' to create one."
        className="w-full h-40 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />

      <p className="text-xs text-gray-400">
        Edit the message above to personalize it before copying. Use 'Regenerate' to create a new version.
      </p>
    </div>
  );
}

export default ReferralMessage;

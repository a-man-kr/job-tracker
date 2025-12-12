/**
 * Migration Prompt Component
 * Shows prompt when user has localStorage data and signs in
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { useState } from 'react';
import { MigrationService, type MigrationResult } from '../services/MigrationService';

interface MigrationPromptProps {
  userId: string;
  localJobCount: number;
  onComplete: () => void;
  onSkip: () => void;
}

type MigrationState = 'prompt' | 'migrating' | 'success' | 'partial' | 'error';

export function MigrationPrompt({ userId, localJobCount, onComplete, onSkip }: MigrationPromptProps) {
  const [state, setState] = useState<MigrationState>('prompt');
  const [result, setResult] = useState<MigrationResult | null>(null);

  const handleMigrate = async () => {
    setState('migrating');
    
    try {
      const migrationResult = await MigrationService.migrateToCloud(userId);
      setResult(migrationResult);
      
      if (migrationResult.success) {
        // Clear local data after successful migration
        MigrationService.clearLocalData();
        setState('success');
      } else if (migrationResult.migratedCount > 0) {
        setState('partial');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
      setResult({
        success: false,
        migratedCount: 0,
        totalCount: localJobCount,
        errors: ['Migration failed unexpectedly. Please try again.'],
      });
    }
  };

  const handleSkip = () => {
    // Clear local data when skipping (user chose not to migrate)
    MigrationService.clearLocalData();
    onSkip();
  };

  if (state === 'prompt') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Migrate Your Data
          </h2>
          <p className="text-gray-600 mb-4">
            We found <strong>{localJobCount}</strong> job{localJobCount !== 1 ? 's' : ''} saved locally on this device.
            Would you like to migrate them to your cloud account so you can access them from anywhere?
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleMigrate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Migrate to Cloud
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'migrating') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-gray-700">Migrating your jobs to the cloud...</span>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">Migration Complete!</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Successfully migrated {result?.migratedCount} job{result?.migratedCount !== 1 ? 's' : ''} to your cloud account.
            You can now access them from any device.
          </p>
          <div className="flex justify-end">
            <button
              onClick={onComplete}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'partial') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">Partial Migration</h2>
          </div>
          <p className="text-gray-600 mb-2">
            Migrated {result?.migratedCount} of {result?.totalCount} jobs.
            Some jobs could not be migrated:
          </p>
          {result?.errors && result.errors.length > 0 && (
            <ul className="text-sm text-red-600 mb-4 list-disc list-inside">
              {result.errors.slice(0, 3).map((error, i) => (
                <li key={i}>{error}</li>
              ))}
              {result.errors.length > 3 && (
                <li>...and {result.errors.length - 3} more errors</li>
              )}
            </ul>
          )}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleMigrate}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onComplete}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue Anyway
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900">Migration Failed</h2>
        </div>
        <p className="text-gray-600 mb-4">
          We couldn't migrate your jobs. Your local data has been preserved.
        </p>
        {result?.errors && result.errors.length > 0 && (
          <p className="text-sm text-red-600 mb-4">{result.errors[0]}</p>
        )}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleMigrate}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={onSkip}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default MigrationPrompt;

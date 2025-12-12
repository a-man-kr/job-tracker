/**
 * Property-based tests for AIService contracts
 * Uses fast-check for property-based testing
 * 
 * Note: These tests verify the contract/structure of AI service responses.
 * Tests that require actual API calls are mocked to test the validation logic.
 */

import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { 
  extractJobDetails, 
  generateReferralMessage, 
  ExtractedJobDataSchema,
  AIServiceError 
} from './AIService';

// Mock fetch globally for testing
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

/**
 * Helper to create a mock Gemini API response
 */
function createMockGeminiResponse(text: string) {
  return {
    ok: true,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [{ text }],
          },
        },
      ],
    }),
  };
}

describe('AIService Property Tests', () => {
  beforeAll(() => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    mockFetch.mockReset();
  });

  /**
   * **Feature: linkedin-job-tracker, Property 16: Extraction Returns Structured Data**
   * 
   * *For any* non-empty job posting text, the AI extraction should return an object 
   * with jobTitle, company, location, and description fields (each may be null but 
   * the structure must be present).
   * 
   * **Validates: Requirements 1.1, 1.4**
   */
  it('Property 16: Extraction Returns Structured Data - extraction always returns object with required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various job posting text formats
        fc.record({
          jobTitle: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          company: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          location: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
          applicationLink: fc.option(fc.webUrl(), { nil: null }),
          jobId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
        }),
        async (mockData) => {
          // Mock the API to return the generated data
          const responseJson = JSON.stringify(mockData);
          mockFetch.mockResolvedValueOnce(createMockGeminiResponse(responseJson));

          // Call extractJobDetails with some non-empty text
          const result = await extractJobDetails('Some job posting text');

          // Verify the result has the required structure
          expect(result).toBeDefined();
          expect(typeof result).toBe('object');
          expect('jobTitle' in result).toBe(true);
          expect('company' in result).toBe(true);
          expect('location' in result).toBe(true);
          expect('description' in result).toBe(true);
          expect('applicationLink' in result).toBe(true);
          expect('jobId' in result).toBe(true);

          // Each field should be either a string or null
          expect(result.jobTitle === null || typeof result.jobTitle === 'string').toBe(true);
          expect(result.company === null || typeof result.company === 'string').toBe(true);
          expect(result.location === null || typeof result.location === 'string').toBe(true);
          expect(result.description === null || typeof result.description === 'string').toBe(true);
          expect(result.applicationLink === null || typeof result.applicationLink === 'string').toBe(true);
          expect(result.jobId === null || typeof result.jobId === 'string').toBe(true);

          // Result should pass Zod validation
          expect(() => ExtractedJobDataSchema.parse(result)).not.toThrow();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: linkedin-job-tracker, Property 16: Extraction Returns Structured Data (edge case)**
   * 
   * For empty input text, extraction should return all null fields.
   */
  it('Property 16: Extraction handles empty input by returning null fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('', '   ', '\n', '\t'),
        async (emptyText) => {
          const result = await extractJobDetails(emptyText);

          // All fields should be null for empty input
          expect(result.jobTitle).toBeNull();
          expect(result.company).toBeNull();
          expect(result.location).toBeNull();
          expect(result.description).toBeNull();
          expect(result.applicationLink).toBeNull();
          expect(result.jobId).toBeNull();

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Feature: linkedin-job-tracker, Property 16: Extraction Returns Structured Data (invalid response)**
   * 
   * When API returns invalid JSON, extraction should return null fields instead of throwing.
   */
  it('Property 16: Extraction returns null fields when API returns invalid data', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate invalid JSON responses
        fc.oneof(
          fc.constant('not json at all'),
          fc.constant('{ invalid json }'),
          fc.constant('{"missing": "required fields"}'),
          fc.constant('null'),
          fc.constant('[]'),
        ),
        async (invalidResponse) => {
          mockFetch.mockResolvedValueOnce(createMockGeminiResponse(invalidResponse));

          const result = await extractJobDetails('Some job posting text');

          // Should still return structured data with null fields
          expect(result).toBeDefined();
          expect('jobTitle' in result).toBe(true);
          expect('company' in result).toBe(true);
          expect('location' in result).toBe(true);
          expect('description' in result).toBe(true);
          expect('applicationLink' in result).toBe(true);
          expect('jobId' in result).toBe(true);

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Feature: linkedin-job-tracker, Property 17: Referral Message Contains Job Details**
   * 
   * *For any* JobPosting with non-empty jobTitle and company, the generated referral 
   * message should contain both the job title and company name.
   * 
   * **Validates: Requirements 2.1**
   */
  it('Property 17: Referral Message Contains Job Details - message includes job title and company', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          jobTitle: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          company: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        }),
        async ({ jobTitle, company }) => {
          // Mock the API to return a message containing the job details
          const mockMessage = `Hi! I'm interested in the ${jobTitle} position at ${company}. Would you be able to provide a referral?`;
          mockFetch.mockResolvedValueOnce(createMockGeminiResponse(mockMessage));

          const result = await generateReferralMessage(jobTitle, company);

          // The message should be a non-empty string
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);

          // The message should contain both the job title and company name
          expect(result.toLowerCase()).toContain(jobTitle.toLowerCase());
          expect(result.toLowerCase()).toContain(company.toLowerCase());

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: linkedin-job-tracker, Property 17: Referral Message edge case**
   * 
   * When jobTitle or company is empty, should return empty string.
   */
  it('Property 17: Referral Message returns empty string for missing job details', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.record({ jobTitle: fc.constant(''), company: fc.string({ minLength: 1 }) }),
          fc.record({ jobTitle: fc.string({ minLength: 1 }), company: fc.constant('') }),
          fc.record({ jobTitle: fc.constant(''), company: fc.constant('') }),
        ),
        async ({ jobTitle, company }) => {
          const result = await generateReferralMessage(jobTitle, company);

          // Should return empty string without making API call
          expect(result).toBe('');

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });
});

describe('AIService Error Handling', () => {
  beforeAll(() => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('throws AIServiceError with TIMEOUT code when request times out', async () => {
    // Mock fetch to simulate abort
    mockFetch.mockImplementationOnce(() => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    await expect(extractJobDetails('test')).rejects.toThrow(AIServiceError);
    
    // Reset and try again for the second assertion
    mockFetch.mockImplementationOnce(() => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });
    
    await expect(extractJobDetails('test')).rejects.toMatchObject({
      code: 'TIMEOUT',
    });
  });

  it('throws AIServiceError with API_ERROR code when API returns error status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    await expect(extractJobDetails('test')).rejects.toThrow(AIServiceError);
    
    // Reset and try again for the second assertion
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    await expect(extractJobDetails('test')).rejects.toMatchObject({
      code: 'API_ERROR',
    });
  });
});

describe('AIService NO_API_KEY Error', () => {
  beforeAll(() => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'your_gemini_api_key_here');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('throws AIServiceError with NO_API_KEY code when API key is not configured', async () => {
    await expect(extractJobDetails('test')).rejects.toThrow(AIServiceError);
    await expect(extractJobDetails('test')).rejects.toMatchObject({
      code: 'NO_API_KEY',
    });
  });
});

describe('ExtractedJobDataSchema Validation', () => {
  it('validates correct structure with all string fields', () => {
    const validData = {
      jobTitle: 'Software Engineer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      description: 'Build amazing software',
      applicationLink: 'https://example.com/apply',
      jobId: '1656147',
    };

    expect(() => ExtractedJobDataSchema.parse(validData)).not.toThrow();
  });

  it('validates structure with null fields', () => {
    const validData = {
      jobTitle: null,
      company: null,
      location: null,
      description: null,
      applicationLink: null,
      jobId: null,
    };

    expect(() => ExtractedJobDataSchema.parse(validData)).not.toThrow();
  });

  it('validates structure with mixed string and null fields', () => {
    const validData = {
      jobTitle: 'Software Engineer',
      company: null,
      location: 'Remote',
      description: null,
      applicationLink: 'https://example.com/apply',
      jobId: 'REQ-2024-001',
    };

    expect(() => ExtractedJobDataSchema.parse(validData)).not.toThrow();
  });

  it('rejects invalid structure missing required fields', () => {
    const invalidData = {
      jobTitle: 'Software Engineer',
      // missing company, location, description
    };

    expect(() => ExtractedJobDataSchema.parse(invalidData)).toThrow();
  });
});

/**
 * AI Service for job extraction and referral message generation
 * Uses Google Gemini API for AI-powered features
 * Requirements: 1.1, 1.4, 1.6, 1.7, 2.1
 */

import { z } from 'zod';
import { getCurrentAIModel } from './SettingsService';

// Zod schema for validating AI extraction responses
export const ExtractedJobDataSchema = z.object({
  jobTitle: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  description: z.string().nullable(),
  applicationLink: z.string().nullable(),
  applicationRequirements: z.string().nullable(),
  applicationDeadline: z.string().nullable(),
  jobId: z.string().nullable(),
});

export type ExtractedJobData = z.infer<typeof ExtractedJobDataSchema>;

// Error types for AI service
export type AIServiceErrorCode = 'NETWORK_ERROR' | 'TIMEOUT' | 'INVALID_RESPONSE' | 'API_ERROR' | 'NO_API_KEY';

export class AIServiceError extends Error {
  code: AIServiceErrorCode;

  constructor(message: string, code: AIServiceErrorCode) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
  }
}

// Timeout duration for API requests (10 seconds as per design doc)
const REQUEST_TIMEOUT_MS = 10000;

/**
 * Creates an AbortController with timeout
 */
function createTimeoutController(timeoutMs: number): { controller: AbortController; timeoutId: ReturnType<typeof setTimeout> } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeoutId };
}

/**
 * Gets the Gemini API key from environment variables
 */
function getApiKey(): string {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new AIServiceError('Gemini API key not configured', 'NO_API_KEY');
  }
  return apiKey;
}

/**
 * Makes a request to the Gemini API with fallback support
 * Uses the currently selected model from settings, falls back to 2.5-flash if needed
 */
async function callGeminiAPI(prompt: string, temperature: number = 0.2): Promise<string> {
  const apiKey = getApiKey();
  let model = getCurrentAIModel();
  const { controller, timeoutId } = createTimeoutController(REQUEST_TIMEOUT_MS);

  // Try the selected model first, then fallback to 2.5-flash if it fails
  const modelsToTry = model === 'gemini-2.5-flash' 
    ? ['gemini-2.5-flash'] 
    : [model, 'gemini-2.5-flash'];

  let lastError: Error | null = null;

  for (const currentModel of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature,
              maxOutputTokens: 2048,
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Gemini API Error:', {
          status: response.status,
          statusText: response.statusText,
          model: currentModel,
          errorText
        });
        
        // If this is not the last model to try, continue to next model
        if (currentModel !== modelsToTry[modelsToTry.length - 1]) {
          console.warn(`Model ${currentModel} failed, trying fallback...`);
          continue;
        }
        
        throw new AIServiceError(`API request failed: ${response.status} - ${errorText}`, 'API_ERROR');
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new AIServiceError('Invalid response structure from Gemini API', 'INVALID_RESPONSE');
      }

      // Log successful model if we had to fallback
      if (currentModel !== model) {
        console.info(`Successfully used fallback model: ${currentModel}`);
      }

      return text;
    } catch (error) {
      lastError = error as Error;
      
      // If this is not the last model to try, continue to next model
      if (currentModel !== modelsToTry[modelsToTry.length - 1]) {
        console.warn(`Model ${currentModel} failed, trying fallback...`, error);
        continue;
      }
      
      // This was the last model, so throw the error
      break;
    }
  }

  clearTimeout(timeoutId);

  if (lastError instanceof AIServiceError) {
    throw lastError;
  }

  if (lastError instanceof Error) {
    if (lastError.name === 'AbortError') {
      throw new AIServiceError('Request timed out after 10 seconds', 'TIMEOUT');
    }
    if (lastError.message.includes('fetch') || lastError.message.includes('network')) {
      throw new AIServiceError(`Network error: ${lastError.message}`, 'NETWORK_ERROR');
    }
  }

  throw new AIServiceError(`Unexpected error: ${lastError}`, 'NETWORK_ERROR');
}

/**
 * Extracts JSON from a string that may contain markdown code blocks
 */
function extractJsonFromResponse(text: string): string {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  // If no code block, try to find JSON object directly
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }
  return text.trim();
}

/**
 * Extracts job details from raw LinkedIn job posting text
 * Returns null fields when extraction confidence is low or validation fails
 * Requirements: 1.1, 1.4, 1.6
 */
export async function extractJobDetails(rawText: string): Promise<ExtractedJobData> {
  if (!rawText || rawText.trim().length === 0) {
    return {
      jobTitle: null,
      company: null,
      location: null,
      description: null,
      applicationLink: null,
      applicationRequirements: null,
      applicationDeadline: null,
      jobId: null,
    };
  }

  const prompt = `You are a job posting parser. Extract the following information from this LinkedIn job posting text and return it as a JSON object.

IMPORTANT RULES:
- Return ONLY a valid JSON object, no other text
- If you cannot confidently extract a field, set it to null
- Do not guess or make up information
- The description should be a summary of the job responsibilities and requirements (max 500 characters)
- Look for application links (URLs where candidates can apply) - these may be different from LinkedIn URLs
- Look for job IDs, requisition numbers, or posting IDs (often labeled as "Job ID:", "Req ID:", "Posting ID:", or similar)
- Pay special attention to application instructions like "Email to:", "Apply via:", "Send resume to:", "Subject line:", etc.
- Look for deadlines, closing dates, or time-sensitive language

Extract these fields:
- jobTitle: The job title/position name
- company: The company name
- location: The job location (city, state, country, or "Remote")
- description: A brief summary of the job
- applicationLink: The URL where candidates can apply (company career page, application portal, etc.)
- applicationRequirements: Special application instructions (e.g., "Email resume to xyz@company.com with subject line [Role] - Your Name", "Apply via email only", "Include portfolio link")
- applicationDeadline: Application deadline date in YYYY-MM-DD format if mentioned
- jobId: The external job ID, requisition number, or posting ID if present (e.g., "1656147", "REQ-2024-001")

Job posting text:
${rawText}

Return JSON in this exact format:
{
  "jobTitle": "string or null",
  "company": "string or null",
  "location": "string or null",
  "description": "string or null",
  "applicationLink": "string or null",
  "applicationRequirements": "string or null",
  "applicationDeadline": "string or null",
  "jobId": "string or null"
}`;

  try {
    // Use low temperature for consistent JSON extraction
    const responseText = await callGeminiAPI(prompt, 0.2);
    const jsonString = extractJsonFromResponse(responseText);
    const parsed = JSON.parse(jsonString);
    const validated = ExtractedJobDataSchema.parse(parsed);
    return validated;
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }
    // If parsing or validation fails, return null fields
    // Requirements: 1.6 - leave fields empty rather than guessing incorrectly
    return {
      jobTitle: null,
      company: null,
      location: null,
      description: null,
      applicationLink: null,
      applicationRequirements: null,
      applicationDeadline: null,
      jobId: null,
    };
  }
}

import { getResume, DEFAULT_RESUME } from './ResumeService';

/**
 * Gets the resume context - uses stored resume or falls back to default
 */
function getResumeContext(): string {
  const storedResume = getResume();
  return storedResume?.text || DEFAULT_RESUME;
}

/**
 * Generates a human-like, personalized referral message based on job details
 * Requirements: 2.1
 */
export async function generateReferralMessage(
  jobTitle: string,
  company: string,
  customPrompt?: string
): Promise<string> {
  if (!jobTitle || !company) {
    return '';
  }

  const resumeContext = getResumeContext();
  
  let prompt = `You are helping write a referral request message. Generate a casual, human-like message that sounds like a real person reaching out - NOT a corporate template.

CANDIDATE RESUME/PROFILE:
${resumeContext}

TARGET ROLE:
- Job Title: ${jobTitle}
- Company: ${company}

STYLE GUIDELINES (VERY IMPORTANT):
- Sound like a real college student, not a robot or corporate recruiter
- Keep it SHORT - 3-5 sentences max, one small paragraph
- Start with a casual greeting like "Hi [Name]," or "Hey [Name],"
- Briefly introduce yourself
- Mention ONE relevant thing from the background that fits the role
- Ask directly for referral or connection - be straightforward
- End with a simple thanks, nothing fancy
- NO bullet points, NO formal language like "I am writing to express my interest"
- Use contractions (I'm, I've, would've, etc.)
- Sound genuine and humble, not boastful

EXAMPLE MESSAGES (match this tone):

Example 1:
"Hi [Name],
Aman here - 4th year Economics at IITR. Hope you're doing well!
I just came across that [Company] is hiring for [Role]. I wanted to reach out and ask if you know whether they also consider interns for similar roles?
I recently gave CFA Level 1 (August) and am preparing for Level 2. Really keen on breaking into the investment industry and would appreciate any insights you might have.
Thanks for any help - would mean a lot!"

Example 2:
"Hi [Name],
Hope you're doing well! I saw [Company] is hiring for [Role]. I'm Aman, 4th year at IIT Roorkee—cleared CFA L1 and writing L2 in May. I've worked at a family office analyzing deals and building valuation models. This role sounds like exactly what I'm looking for. Would mean a lot if you could refer me or connect me with someone on the team.
Thanks so much!
Aman"`;

  // Add custom instructions if provided
  if (customPrompt && customPrompt.trim()) {
    prompt += `

ADDITIONAL INSTRUCTIONS FROM USER:
${customPrompt}`;
  }

  prompt += `

NOW GENERATE a similar message for the ${jobTitle} role at ${company}. Pick the most relevant experience point from the resume that matches this role. Keep it natural and conversational.

Return ONLY the message text, nothing else. Use [Name] as placeholder for recipient name.`;

  try {
    // Use higher temperature for more natural, varied messages
    const message = await callGeminiAPI(prompt, 0.7);
    return message.trim();
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }
    throw new AIServiceError(`Failed to generate referral message: ${error}`, 'API_ERROR');
  }
}

// Export the AIService interface for type checking
export interface AIService {
  extractJobDetails(rawText: string): Promise<ExtractedJobData>;
  generateReferralMessage(jobTitle: string, company: string): Promise<string>;
}

// Default export as an object implementing the interface
export default {
  extractJobDetails,
  generateReferralMessage,
} as AIService;

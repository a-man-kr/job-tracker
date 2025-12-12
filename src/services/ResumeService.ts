/**
 * Resume Service for storing and retrieving user resume from localStorage
 * Provides persistent resume context for AI-generated referral messages
 */

const RESUME_STORAGE_KEY = 'job_tracker_resume';

export interface ResumeData {
  text: string;
  uploadedAt: string;
}

/**
 * Saves resume text to localStorage
 */
export function saveResume(resumeText: string): void {
  const data: ResumeData = {
    text: resumeText,
    uploadedAt: new Date().toISOString(),
  };
  localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Retrieves resume text from localStorage
 * Returns null if no resume is stored
 */
export function getResume(): ResumeData | null {
  const stored = localStorage.getItem(RESUME_STORAGE_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored) as ResumeData;
  } catch {
    return null;
  }
}

/**
 * Checks if a resume is stored
 */
export function hasResume(): boolean {
  return getResume() !== null;
}

/**
 * Clears the stored resume
 */
export function clearResume(): void {
  localStorage.removeItem(RESUME_STORAGE_KEY);
}

/**
 * Default resume context (fallback if no resume uploaded)
 */
export const DEFAULT_RESUME = `
CANDIDATE PROFILE:
- Name: Aman Kumar
- Education: 4th year BS-MS (Economics) at IIT Roorkee, CGPA: 8.126
- CFA: Cleared Level 1 (August 2025), preparing for Level 2 (May)
- Minor/Honors: Management from DoMS, IIT Roorkee

KEY EXPERIENCE:
- Business & Financial Analyst Intern at Nahar Om Family Office: Built credit risk models, IRR calculators, Term Sheet generators; analyzed 20+ structured products; engineered invoice discounting system with 800+ deals
- Quant Finance: Built multi-strategy portfolio with 40% CAGR, 1.92 Sharpe ratio
- Financial Risk Mitigation: Developed credit risk model (XGBoost) with 85% ROC-AUC on 307k dataset
- Valuation & Investment Analysis: Built 5-year DCF models, WACC, CAPM analysis, equity research

SKILLS: Python, Financial Modeling, Valuation, Credit Risk, Quant Strategies, Data Analysis
`;

export const ResumeService = {
  saveResume,
  getResume,
  hasResume,
  clearResume,
  DEFAULT_RESUME,
};

export default ResumeService;

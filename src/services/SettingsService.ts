/**
 * Settings Service - Manages user preferences and settings
 */

export type GeminiModel = 'gemini-3.0-flash' | 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.0-flash' | 'gemini-1.5-flash';

export interface AppSettings {
  aiModel: GeminiModel;
}

const SETTINGS_KEY = 'job-tracker-settings';

const DEFAULT_SETTINGS: AppSettings = {
  aiModel: 'gemini-2.5-flash',
};

/**
 * Get current settings from localStorage
 */
export function getSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

/**
 * Update a specific setting
 */
export function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): void {
  const currentSettings = getSettings();
  const newSettings = { ...currentSettings, [key]: value };
  saveSettings(newSettings);
}

/**
 * Get the current AI model
 */
export function getCurrentAIModel(): GeminiModel {
  return getSettings().aiModel;
}

/**
 * Set the AI model
 */
export function setAIModel(model: GeminiModel): void {
  updateSetting('aiModel', model);
}

/**
 * Get model display names
 */
export function getModelDisplayName(model: GeminiModel): string {
  switch (model) {
    case 'gemini-3.0-flash':
      return 'Gemini 3.0 Flash (Experimental)';
    case 'gemini-2.5-flash':
      return 'Gemini 2.5 Flash (Recommended)';
    case 'gemini-2.5-pro':
      return 'Gemini 2.5 Pro (Most Capable)';
    case 'gemini-2.0-flash':
      return 'Gemini 2.0 Flash';
    case 'gemini-1.5-flash':
      return 'Gemini 1.5 Flash';
    default:
      return model;
  }
}

/**
 * Get all available models
 */
export function getAvailableModels(): GeminiModel[] {
  return ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.0-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
}
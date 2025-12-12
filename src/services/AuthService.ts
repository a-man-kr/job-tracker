/**
 * Authentication Service for Supabase Auth
 * Handles user authentication operations
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { supabase } from '../lib/supabase';
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

/**
 * User type for the application
 */
export interface User {
  id: string;
  email: string;
}

/**
 * Authentication result type
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Session type for the application
 */
export interface AppSession {
  user: User;
  accessToken: string;
}

/**
 * Auth Service Interface
 */
export interface IAuthService {
  signUp(email: string, password: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;
  getSession(): Promise<AppSession | null>;
  onAuthStateChange(callback: (session: AppSession | null) => void): () => void;
}

/**
 * Convert Supabase user to application User type
 */
function toAppUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
  };
}

/**
 * Convert Supabase session to application Session type
 */
function toAppSession(session: Session): AppSession {
  return {
    user: toAppUser(session.user),
    accessToken: session.access_token,
  };
}

/**
 * Map Supabase auth errors to user-friendly messages
 * Requirements: 1.3
 */
function mapAuthError(error: { message: string; status?: number }): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
    return 'Invalid email or password. Please try again.';
  }
  if (message.includes('email not confirmed')) {
    return 'Please verify your email before signing in.';
  }
  if (message.includes('user already registered')) {
    return 'An account with this email already exists.';
  }
  if (message.includes('password') && message.includes('weak')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (message.includes('rate limit') || error.status === 429) {
    return 'Too many attempts. Please try again in a few minutes.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Unable to connect. Please check your internet connection.';
  }
  
  return error.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Sign up a new user with email and password
 * Requirements: 1.5
 */
export async function signUp(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { success: false, error: mapAuthError(error) };
    }

    if (data.user) {
      return {
        success: true,
        user: toAppUser(data.user),
      };
    }

    return { success: false, error: 'Failed to create account.' };
  } catch (err) {
    return { 
      success: false, 
      error: 'Unable to connect. Please check your internet connection.' 
    };
  }
}

/**
 * Sign in an existing user with email and password
 * Requirements: 1.2, 1.3
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: mapAuthError(error) };
    }

    if (data.user) {
      return {
        success: true,
        user: toAppUser(data.user),
      };
    }

    return { success: false, error: 'Failed to sign in.' };
  } catch (err) {
    return { 
      success: false, 
      error: 'Unable to connect. Please check your internet connection.' 
    };
  }
}

/**
 * Sign out the current user
 * Requirements: 1.4
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Get the current session
 */
export async function getSession(): Promise<AppSession | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? toAppSession(session) : null;
}

/**
 * Subscribe to auth state changes
 * Returns an unsubscribe function
 */
export function onAuthStateChange(
  callback: (session: AppSession | null) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event: AuthChangeEvent, session: Session | null) => {
      callback(session ? toAppSession(session) : null);
    }
  );

  return () => subscription.unsubscribe();
}

/**
 * Auth Service object implementing IAuthService interface
 */
export const AuthService: IAuthService = {
  signUp,
  signIn,
  signOut,
  getSession,
  onAuthStateChange,
};

export default AuthService;

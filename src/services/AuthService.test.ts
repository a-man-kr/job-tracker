/**
 * Unit Tests for AuthService
 * Tests authentication flows with mocked Supabase client
 * Requirements: 1.2, 1.3, 1.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase module
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
    },
  },
}));

import { signUp, signIn, signOut, getSession } from './AuthService';
import { supabase } from '../lib/supabase';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signUp', () => {
    it('returns success with user on successful signup', async () => {
      const mockUser = { 
        id: 'user-123', 
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00.000Z'
      };
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const result = await signUp('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual({ id: 'user-123', email: 'test@example.com' });
      expect(result.error).toBeUndefined();
    });

    it('returns error when user already exists', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered', status: 400 } as any,
      });

      const result = await signUp('existing@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('An account with this email already exists.');
    });

    it('handles network errors gracefully', async () => {
      vi.mocked(supabase.auth.signUp).mockRejectedValue(new Error('Network error'));

      const result = await signUp('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unable to connect. Please check your internet connection.');
    });
  });

  describe('signIn', () => {
    it('returns success with user on valid credentials', async () => {
      const mockUser = { 
        id: 'user-123', 
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00.000Z'
      };
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { 
          user: mockUser, 
          session: { access_token: 'token', user: mockUser } as any 
        },
        error: null,
      });

      const result = await signIn('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual({ id: 'user-123', email: 'test@example.com' });
    });

    it('returns error on invalid credentials', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 400 } as any,
      });

      const result = await signIn('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password. Please try again.');
    });

    it('returns error when email not verified', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed', status: 400 } as any,
      });

      const result = await signIn('unverified@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Please verify your email before signing in.');
    });

    it('handles rate limiting', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Rate limit exceeded', status: 429 } as any,
      });

      const result = await signIn('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Too many attempts. Please try again in a few minutes.');
    });
  });

  describe('signOut', () => {
    it('calls supabase signOut', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      await signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('returns session when authenticated', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token-123',
      };
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession as any },
        error: null,
      });

      const session = await getSession();

      expect(session).toEqual({
        user: { id: 'user-123', email: 'test@example.com' },
        accessToken: 'token-123',
      });
    });

    it('returns null when not authenticated', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const session = await getSession();

      expect(session).toBeNull();
    });
  });
});

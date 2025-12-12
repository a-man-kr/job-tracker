/**
 * Authentication Context for React
 * Provides auth state and methods throughout the application
 * Requirements: 1.1, 1.2, 1.4
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { AuthService, type User, type AuthResult, type AppSession } from '../services/AuthService';

/**
 * Auth Context Value Interface
 */
export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 * Wraps the application and provides authentication state
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const session = await AuthService.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Subscribe to auth state changes
    const unsubscribe = AuthService.onAuthStateChange((session: AppSession | null) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const result = await AuthService.signIn(email, password);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const result = await AuthService.signUp(email, password);
    // Note: User might need to verify email before being fully authenticated
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const handleSignOut = useCallback(async (): Promise<void> => {
    await AuthService.signOut();
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * Throws if used outside of AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

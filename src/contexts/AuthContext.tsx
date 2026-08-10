import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut as authSignOut,
  refreshSession,
  getAccessToken,
  getUserProfile,
  type UserProfile,
} from '../lib/authService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;

  // MFA state
  requiresMFA: boolean;
  mfaFactorId: string | null;

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, nombre: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  completeMFA: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // MFA state
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    const { profile: fetchedProfile } = await getUserProfile(userId);
    if (fetchedProfile) {
      setProfile(fetchedProfile);
    }
  }, []);

  // Try auto-login on mount by rotating the Refresh Token cookie
  useEffect(() => {
    const initSession = async () => {
      try {
        const result = await refreshSession();
        if (result.success && result.user) {
          setUser(result.user);
          setSession({ user: result.user } as any);
          await loadProfile(result.user.id);
        }
      } catch (err) {
        console.warn('Auto-login failed:', err);
      } finally {
        setInitialized(true);
        setLoading(false);
      }
    };
    initSession();
  }, [loadProfile]);

  // Periodic Access Token Refresh (every 14 minutes since Access Token expires in 15 minutes)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      console.log('Refreshing session access token...');
      await refreshSession();
    }, 14 * 60 * 1000); // 14 minutes

    return () => clearInterval(interval);
  }, [user]);

  // 15-Minute Inactivity Auto-Logout
  useEffect(() => {
    if (!user) return;

    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        console.log('Inactivity auto-logout triggered (15 minutes).');
        handleLogout();
        window.location.reload();
      }, 15 * 60 * 1000); // 15 minutes
    };

    // User activity events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    const addListeners = () => events.forEach(event => window.addEventListener(event, resetTimer));
    const removeListeners = () => events.forEach(event => window.removeEventListener(event, resetTimer));

    addListeners();
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      removeListeners();
    };
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmail(email, password);
      
      if (result.success) {
        if (result.requires2FA && result.tempToken) {
          // Save temporary token in session storage for the verify component
          sessionStorage.setItem('temp_2fa_token', result.tempToken);
          setRequiresMFA(true);
          setMfaFactorId('totp-active-factor');
          return { success: true };
        }

        if (result.user) {
          setUser(result.user);
          setSession({ user: result.user } as any);
          await loadProfile(result.user.id);
        }
      }
      return { success: result.success, error: result.error };
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  const register = useCallback(async (email: string, password: string, nombre: string) => {
    setLoading(true);
    try {
      const result = await signUpWithEmail(email, password, nombre);
      return { success: result.success, error: result.error };
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      return { success: result.success, error: result.error };
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    setLoading(true);
    try {
      const result = await authSignOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setRequiresMFA(false);
      setMfaFactorId(null);
      sessionStorage.removeItem('temp_2fa_token');
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  const completeMFA = useCallback(async () => {
    setRequiresMFA(false);
    setMfaFactorId(null);
    // Reload user session state after 2FA is validated
    const result = await refreshSession();
    if (result.success && result.user) {
      setUser(result.user);
      setSession({ user: result.user } as any);
      await loadProfile(result.user.id);
    }
  }, [loadProfile]);

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    initialized,
    requiresMFA,
    mfaFactorId,
    login,
    register,
    loginWithGoogle,
    logout: handleLogout,
    refreshProfile,
    completeMFA,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut as authSignOut,
  onAuthStateChange,
  getUserProfile,
  type UserProfile,
} from '../lib/authService';
import { getAssuranceLevel, getMFAFactors } from '../lib/mfaService';


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
  const [loading, setLoading] = useState(false);
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

  
  useEffect(() => {
    const subscription = onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          setTimeout(() => loadProfile(newSession.user.id), 300);
        }
      } else {
        setProfile(null);
      }

      setInitialized(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmail(email, password);
      if (result.success && result.user) {
        await loadProfile(result.user.id);

        // Check if user has MFA enabled and needs verification
        try {
          const assurance = await getAssuranceLevel();
          if (assurance && assurance.nextLevel === 'aal2' && assurance.currentLevel === 'aal1') {
            // User has MFA factors but hasn't verified yet in this session
            const { factors } = await getMFAFactors();
            const verifiedFactor = factors.find(f => f.status === 'verified');
            if (verifiedFactor) {
              setRequiresMFA(true);
              setMfaFactorId(verifiedFactor.id);
            }
          }
        } catch {
          // MFA check failed silently — don't block login
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
      if (result.success && result.user) {
        
        await new Promise((resolve) => setTimeout(resolve, 500));
        await loadProfile(result.user.id);
      }
      return { success: result.success, error: result.error };
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      return { success: result.success, error: result.error };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      const result = await authSignOut();
      if (result.success) {
        setUser(null);
        setSession(null);
        setProfile(null);
        setRequiresMFA(false);
        setMfaFactorId(null);
      }
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

  const completeMFA = useCallback(() => {
    setRequiresMFA(false);
    setMfaFactorId(null);
  }, []);

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
    logout,
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

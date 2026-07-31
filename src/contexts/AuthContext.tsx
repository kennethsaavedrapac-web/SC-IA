import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem('cached_user_profile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // MFA state
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);

  // Control de promesas activas para evitar consultas duplicadas simultáneas
  const activeProfilePromiseRef = useRef<{ userId: string; promise: Promise<void> } | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    if (!userId) return;

    // Deduplicación de promesas en vuelo
    if (activeProfilePromiseRef.current && activeProfilePromiseRef.current.userId === userId) {
      return activeProfilePromiseRef.current.promise;
    }

    const promise = (async () => {
      try {
        const { profile: fetchedProfile } = await getUserProfile(userId);
        if (fetchedProfile) {
          setProfile(fetchedProfile);
          try {
            localStorage.setItem('cached_user_profile', JSON.stringify(fetchedProfile));
          } catch {
            // Silencioso si falla el almacenamiento
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Error al cargar perfil:', err);
      } finally {
        activeProfilePromiseRef.current = null;
      }
    })();

    activeProfilePromiseRef.current = { userId, promise };
    return promise;
  }, []);

  useEffect(() => {
    const subscription = onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          loadProfile(newSession.user.id);
        }
      } else {
        setProfile(null);
        try {
          localStorage.removeItem('cached_user_profile');
        } catch {}
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

        try {
          const assurance = await getAssuranceLevel();
          if (assurance && assurance.nextLevel === 'aal2' && assurance.currentLevel === 'aal1') {
            const { factors } = await getMFAFactors();
            const verifiedFactor = factors.find(f => f.status === 'verified');
            if (verifiedFactor) {
              setRequiresMFA(true);
              setMfaFactorId(verifiedFactor.id);
            }
          }
        } catch {
          // MFA silencioso
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
        try {
          localStorage.removeItem('cached_user_profile');
        } catch {}
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

  const value = useMemo<AuthContextType>(() => ({
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
  }), [
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
  ]);

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

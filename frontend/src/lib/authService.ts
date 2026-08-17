import { supabase } from './supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  nombre: string;
  email: string | null;
  provider?: string;
  avatar_url: string | null;
  ciudad: string;
  pais: string;
  created_at: string;
  role?: string;
  is_2fa_enabled?: boolean;
  sexo?: string | null;
}

export interface AuthResult {
  success: boolean;
  requires2FA?: boolean;
  tempToken?: string;
  user?: User | null;
  session?: Session | null;
  error?: string;
}

let currentAccessToken: string | null = null;
let currentUser: any | null = null;

export function getAccessToken(): string | null {
  return currentAccessToken;
}

export function setAccessToken(token: string | null) {
  currentAccessToken = token;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  nombre: string
): Promise<AuthResult> {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, nombre })
    });
    
    const result = await response.json();
    if (!response.ok || !result.success) {
      return { success: false, error: result.error || "Error al registrarse" };
    }
    
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: 'Error de conexión. Verifica tu conexión a internet.',
    };
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error || "Error al iniciar sesión" };
    }

    if (result.requires2FA) {
      return {
        success: true,
        requires2FA: true,
        tempToken: result.tempToken
      };
    }

    // Set local access token
    currentAccessToken = result.accessToken;
    currentUser = result.user;

    // Authenticate direct Supabase client
    if (result.supabaseSession) {
      await supabase.auth.setSession(result.supabaseSession);
    }

    return {
      success: true,
      user: result.user
    };
  } catch (err) {
    return {
      success: false,
      error: 'Error de conexión. Verifica tu conexión a internet.',
    };
  }
}

export async function validate2FA(
  tempToken: string,
  code: string
): Promise<AuthResult> {
  try {
    const response = await fetch("/api/auth/2fa/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tempToken, code })
    });

    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error || "Código de verificación incorrecto." };
    }

    // Set local access token
    currentAccessToken = result.accessToken;
    currentUser = result.user;

    // Authenticate direct Supabase client
    if (result.supabaseSession) {
      await supabase.auth.setSession(result.supabaseSession);
    }

    return {
      success: true,
      user: result.user
    };
  } catch (err) {
    return {
      success: false,
      error: "Error al validar el código 2FA."
    };
  }
}

export async function refreshSession(): Promise<AuthResult> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const result = await response.json();
    if (response.ok && result.success) {
      currentAccessToken = result.accessToken;
      currentUser = result.user;
      
      if (result.supabaseSession) {
        await supabase.auth.setSession(result.supabaseSession);
      }
      
      return { success: true, user: result.user };
    }
    
    currentAccessToken = null;
    currentUser = null;
    return { success: false, error: result.error || "No active session" };
  } catch (err) {
    currentAccessToken = null;
    currentUser = null;
    return { success: false, error: "Network error refreshing session" };
  }
}

export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    if (!import.meta.env.VITE_SUPABASE_URL) {
      return {
        success: false,
        error: 'Faltan las credenciales de Supabase. No se puede iniciar con Google.'
      };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: 'No se pudo iniciar la autenticación con Google.',
    };
  }
}

export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const token = currentAccessToken;
    // Clear local states
    currentAccessToken = null;
    currentUser = null;

    // Call custom logout
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      }
    });

    // Sign out from Supabase client
    await supabase.auth.signOut();
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: 'Error al cerrar sesión.' };
  }
}

export async function getSession() {
  if (currentAccessToken && currentUser) {
    return { session: { user: currentUser } as any, error: null };
  }
  // Try refreshing
  const result = await refreshSession();
  if (result.success && result.user) {
    return { session: { user: result.user } as any, error: null };
  }
  return { session: null, error: new Error("No session found") };
}

export function onAuthStateChange(
  callback: (event: string, session: any | null) => void
) {
  // Listen to Supabase client state change for hybrid sync
  const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
    // If Supabase has a session but we don't have custom access token, sync
    if (newSession && !currentAccessToken) {
      // Just keep them in sync, or let refreshSession run
    }
    
    callback(event, newSession);
  });
  return data.subscription;
}

export async function getUserProfile(
  userId: string
): Promise<{ profile: UserProfile | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Error fetching profile:', error.message);
      return { profile: null, error: error.message };
    }

    return { profile: data as UserProfile };
  } catch (err: any) {
    return { profile: null, error: 'Error al cargar el perfil.' };
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'nombre' | 'avatar_url' | 'ciudad' | 'pais' | 'sexo'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      // Catch undefined column error (Postgres code 42703) if database profiles table does not have 'sexo'
      if (error.code === '42703' && 'sexo' in updates) {
        const { sexo, ...otherUpdates } = updates;
        const { error: retryError } = await supabase
          .from('profiles')
          .update(otherUpdates)
          .eq('id', userId);
        if (retryError) {
          return { success: false, error: retryError.message };
        }
        return { success: true };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: 'Error al actualizar el perfil.' };
  }
}

import { supabase } from './supabaseClient';
import type { AuthError, User, Session } from '@supabase/supabase-js';
import {
  authLoginSchema,
  authRegisterSchema,
  userProfileUpdateSchema,
  validateInput,
} from './validations/schemas';
import { syncSessionCookie, clearServerSessionCookie } from './sessionService';

export interface UserProfile {
  id: string;
  nombre: string;
  email: string | null;
  provider: string;
  avatar_url: string | null;
  ciudad: string;
  pais: string;
  sexo: string | null;
  created_at: string;
}

export interface AuthResult {
  success: boolean;
  user?: User | null;
  session?: Session | null;
  error?: string;
  mfaRequired?: boolean;
  tempToken?: string;
}

function translateAuthError(error: AuthError): string {
  const code = error.message?.toLowerCase() || '';

  if (code.includes('invalid login credentials') || code.includes('invalid_credentials')) {
    return 'Correo electrónico o contraseña incorrectos.';
  }
  if (code.includes('email not confirmed')) {
    return 'Tu correo electrónico no ha sido confirmado. Revisa tu bandeja de entrada.';
  }
  if (code.includes('user already registered') || code.includes('already been registered')) {
    return 'Ya existe una cuenta con este correo electrónico.';
  }
  if (code.includes('signup is disabled')) {
    return 'El registro de nuevos usuarios está temporalmente deshabilitado.';
  }
  if (code.includes('password') && code.includes('at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (code.includes('rate limit') || code.includes('too many requests')) {
    return 'Demasiados intentos. Por favor espera un momento antes de intentar de nuevo.';
  }
  if (code.includes('network') || code.includes('fetch')) {
    return 'Error de conexión. Verifica tu conexión a internet.';
  }
  if (code.includes('provider is not enabled') || code.includes('unsupported_provider')) {
    return 'El inicio de sesión con Google no está habilitado aún. Contacta al administrador.';
  }
  if (code.includes('email_address_invalid') || code.includes('invalid email')) {
    return 'El formato del correo electrónico no es válido.';
  }

  return error.message || 'Ha ocurrido un error inesperado. Intenta de nuevo.';
}

export async function signUpWithEmail(
  email: string,
  password: string,
  nombre: string
): Promise<AuthResult> {
  // Validación estricta con Zod
  const validation = validateInput(authRegisterSchema, { email, password, nombre });
  if (!validation.success) {
    return { success: false, error: validation.message };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: validation.data.email,
      password: validation.data.password,
      options: {
        data: {
          nombre: validation.data.nombre,
          full_name: validation.data.nombre,
        },
      },
    });

    if (error) {
      return { success: false, error: translateAuthError(error) };
    }

    if (data.session?.access_token) {
      await syncSessionCookie({ accessToken: data.session.access_token });
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (err: any) {
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
  // Validación estricta con Zod
  const validation = validateInput(authLoginSchema, { email, password });
  if (!validation.success) {
    return { success: false, error: validation.message };
  }

  try {
    // Verificar si el usuario requiere desafío de 2 Factores (2FA/TOTP)
    try {
      const checkRes = await fetch('/api/auth/2fa/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: validation.data.email }),
      });
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.mfaRequired && checkData.tempToken) {
          // Requiere verificar 2FA antes de entregar la sesión completa
          return {
            success: false,
            mfaRequired: true,
            tempToken: checkData.tempToken,
          };
        }
      }
    } catch {
      // Si el endpoint 2FA no responde, continúa con el flujo estándar de Supabase
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validation.data.email,
      password: validation.data.password,
    });

    if (error) {
      return { success: false, error: translateAuthError(error) };
    }

    // Sincronizar token en cookies seguras HttpOnly del servidor
    if (data.session?.access_token) {
      await syncSessionCookie({ accessToken: data.session.access_token });
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'Error de conexión. Verifica tu conexión a internet.',
    };
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
      return { success: false, error: translateAuthError(error) };
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
    // Invalida cookie HttpOnly del servidor
    await clearServerSessionCookie();

    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: translateAuthError(error) };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: 'Error al cerrar sesión.' };
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (data?.session?.access_token) {
    await syncSessionCookie({ accessToken: data.session.access_token });
  }
  return { session: data.session, error };
}

export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.access_token) {
      await syncSessionCookie({ accessToken: session.access_token });
    } else if (event === 'SIGNED_OUT') {
      await clearServerSessionCookie();
    }
    callback(event, session);
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
  const validation = validateInput(userProfileUpdateSchema, updates);
  if (!validation.success) {
    return { success: false, error: validation.message };
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update(validation.data)
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: 'Error al actualizar el perfil.' };
  }
}

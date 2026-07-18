import { supabase } from './supabaseClient';
import type { AuthError, User, Session } from '@supabase/supabase-js';


export interface UserProfile {
  id: string;
  nombre: string;
  email: string | null;
  provider: string;
  avatar_url: string | null;
  ciudad: string;
  pais: string;
  created_at: string;
}

export interface AuthResult {
  success: boolean;
  user?: User | null;
  session?: Session | null;
  error?: string;
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
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: nombre,
          full_name: nombre,
        },
      },
    });

    if (error) {
      return { success: false, error: translateAuthError(error) };
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
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: translateAuthError(error) };
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
  return { session: data.session, error };
}


export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
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
  updates: Partial<Pick<UserProfile, 'nombre' | 'avatar_url' | 'ciudad' | 'pais'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: 'Error al actualizar el perfil.' };
  }
}

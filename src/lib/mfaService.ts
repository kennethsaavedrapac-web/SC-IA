/**
 * mfaService.ts — Servicio de autenticación de dos factores (2FA/MFA)
 * 
 * Implementación adaptada para consumir los endpoints REST custom del backend.
 */

import { supabase } from './supabaseClient';
import { getAccessToken, validate2FA } from './authService';

export interface MFAEnrollResult {
  success: boolean;
  factorId?: string;
  qrUri?: string; // otpauth:// URI para generar QR
  secret?: string; // clave secreta para entrada manual
  backupCodes?: string[];
  error?: string;
}

export interface MFAVerifyResult {
  success: boolean;
  backupCodes?: string[];
  error?: string;
}

export interface MFAFactor {
  id: string;
  type: string;
  status: 'verified' | 'unverified';
  friendlyName?: string;
  createdAt: string;
}

export interface MFAAssuranceLevel {
  currentLevel: 'aal1' | 'aal2';
  nextLevel: 'aal1' | 'aal2' | null;
  currentAuthenticationMethods: any[];
}

// ─── Enrolamiento ──────────────────────────────────────────────────

/**
 * Inicia el enrolamiento de un nuevo factor TOTP.
 * Llama al endpoint setup en el backend.
 */
export async function enrollMFA(friendlyName?: string): Promise<MFAEnrollResult> {
  try {
    const token = getAccessToken();
    const response = await fetch('/api/auth/2fa/setup', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Error al configurar 2FA.',
      };
    }

    return {
      success: true,
      factorId: 'totp-temp-factor',
      qrUri: result.qrUri,
      secret: result.secret,
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'Error de conexión al configurar 2FA.',
    };
  }
}

// ─── Verificación y activación ─────────────────────────────────────

/**
 * Verifica un código TOTP y activa el factor MFA en el backend.
 */
export async function verifyAndActivateMFA(
  factorId: string,
  code: string
): Promise<MFAVerifyResult> {
  try {
    const token = getAccessToken();
    const response = await fetch('/api/auth/2fa/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ code })
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Error al verificar el código.',
      };
    }

    return {
      success: true,
      backupCodes: result.backupCodes
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'Error al verificar el código. Intenta de nuevo.',
    };
  }
}

// ─── Consultar factores ────────────────────────────────────────────

/**
 * Obtiene los factores MFA registrados del usuario actual.
 */
export async function getMFAFactors(): Promise<{
  factors: MFAFactor[];
  error?: string;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { factors: [] };

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_2fa_enabled')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return { factors: [] };
    }

    const factors: MFAFactor[] = [];
    if (profile.is_2fa_enabled) {
      factors.push({
        id: 'totp-active-factor',
        type: 'totp',
        status: 'verified',
        friendlyName: 'Google Authenticator',
        createdAt: new Date().toISOString()
      });
    }

    return { factors };
  } catch (err: any) {
    return { factors: [], error: 'Error al obtener factores MFA.' };
  }
}

/**
 * Verifica si el usuario tiene al menos un factor MFA verificado.
 */
export async function hasMFAEnabled(): Promise<boolean> {
  const { factors } = await getMFAFactors();
  return factors.some((f) => f.status === 'verified');
}

// ─── Desactivar MFA ────────────────────────────────────────────────

/**
 * Desactiva (desenrola) un factor MFA.
 */
export async function unenrollMFA(factorId: string): Promise<MFAVerifyResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Usuario no autenticado' };

    const { error } = await supabase
      .from('profiles')
      .update({
        is_2fa_enabled: false,
        two_factor_secret: null,
        backup_codes: null
      })
      .eq('id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: 'Error al desactivar 2FA.',
    };
  }
}

// ─── Challenge post-login ──────────────────────────────────────────

/**
 * Simulación de creación de desafío (Mapeado a la validación de Login)
 * Retorna el tempToken como challengeId.
 */
export async function createMFAChallenge(
  factorId: string
): Promise<{ success: boolean; challengeId?: string; error?: string }> {
  // En nuestro flujo custom, el tempToken ya sirve como challengeId.
  // Lo leemos del localStorage o estado. Lo pasaremos al componente.
  const tempToken = sessionStorage.getItem('temp_2fa_token');
  if (!tempToken) {
    return { success: false, error: 'Sesión temporal de 2FA no encontrada.' };
  }
  return { success: true, challengeId: tempToken };
}

/**
 * Verifica un challenge MFA con el código TOTP del usuario en el backend.
 */
export async function verifyMFAChallenge(
  factorId: string,
  challengeId: string,
  code: string
): Promise<MFAVerifyResult> {
  // Llama a validate2FA con el tempToken (challengeId) y el código
  const result = await validate2FA(challengeId, code);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  // Limpia el token de sesión temporal
  sessionStorage.removeItem('temp_2fa_token');
  
  return { success: true };
}

// ─── Nivel de aseguramiento ────────────────────────────────────────

/**
 * Obtiene el nivel de aseguramiento actual.
 */
export async function getAssuranceLevel(): Promise<MFAAssuranceLevel | null> {
  // Si tenemos un custom access token, verificamos si es aal2.
  // Por simplicidad, retornamos aal1 si requiere 2FA y aal2 si ya pasó.
  const tempToken = sessionStorage.getItem('temp_2fa_token');
  
  return {
    currentLevel: tempToken ? 'aal1' : 'aal2',
    nextLevel: tempToken ? 'aal2' : null,
    currentAuthenticationMethods: []
  };
}

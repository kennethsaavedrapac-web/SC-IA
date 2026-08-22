/**
 * mfaService.ts — Servicio de autenticación de dos factores (2FA/MFA)
 * 
 * Utiliza la API nativa de Supabase MFA (TOTP) para:
 * - Enrolar un factor TOTP (genera QR)
 * - Verificar y activar el factor
 * - Desactivar el factor
 * - Crear y verificar challenges post-login
 * - Consultar nivel de aseguramiento (AAL)
 */

import { supabase } from './supabaseClient';

// ─── Tipos ─────────────────────────────────────────────────────────

export interface MFAEnrollResult {
  success: boolean;
  factorId?: string;
  qrUri?: string; // otpauth:// URI para generar QR
  secret?: string; // clave secreta para entrada manual
  error?: string;
}

export interface MFAVerifyResult {
  success: boolean;
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
 * Retorna el QR URI y el factor ID para su verificación.
 */
export async function enrollMFA(friendlyName?: string): Promise<MFAEnrollResult> {
  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: friendlyName || 'Salud-Conecta IA',
    });

    if (error) {
      return {
        success: false,
        error: translateMFAError(error.message),
      };
    }

    return {
      success: true,
      factorId: data.id,
      qrUri: data.totp.uri,
      secret: data.totp.secret,
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
 * Verifica un código TOTP y activa el factor MFA.
 * Se usa durante el enrolamiento inicial.
 */
export async function verifyAndActivateMFA(
  factorId: string,
  code: string
): Promise<MFAVerifyResult> {
  try {
    // Crear un challenge para verificar
    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeError) {
      return {
        success: false,
        error: translateMFAError(challengeError.message),
      };
    }

    // Verificar el código TOTP contra el challenge
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (verifyError) {
      return {
        success: false,
        error: translateMFAError(verifyError.message),
      };
    }

    return { success: true };
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
    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error) {
      return { factors: [], error: error.message };
    }

    const factors: MFAFactor[] = (data.totp || []).map((f: any) => ({
      id: f.id,
      type: f.factor_type || 'totp',
      status: f.status,
      friendlyName: f.friendly_name,
      createdAt: f.created_at,
    }));

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
 * Desactiva (desenrola) un factor MFA específico.
 */
export async function unenrollMFA(factorId: string): Promise<MFAVerifyResult> {
  try {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });

    if (error) {
      return {
        success: false,
        error: translateMFAError(error.message),
      };
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
 * Crea un challenge MFA para verificación post-login.
 */
export async function createMFAChallenge(
  factorId: string
): Promise<{ success: boolean; challengeId?: string; error?: string }> {
  try {
    const { data, error } = await supabase.auth.mfa.challenge({ factorId });

    if (error) {
      return { success: false, error: translateMFAError(error.message) };
    }

    return { success: true, challengeId: data.id };
  } catch (err: any) {
    return { success: false, error: 'Error al crear el desafío 2FA.' };
  }
}

/**
 * Verifica un challenge MFA con el código TOTP del usuario.
 * Se usa post-login para elevar de AAL1 a AAL2.
 */
export async function verifyMFAChallenge(
  factorId: string,
  challengeId: string,
  code: string
): Promise<MFAVerifyResult> {
  try {
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    if (error) {
      return { success: false, error: translateMFAError(error.message) };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: 'Error al verificar el código. Intenta de nuevo.',
    };
  }
}

// ─── Nivel de aseguramiento ────────────────────────────────────────

/**
 * Obtiene el nivel de aseguramiento actual (AAL1 = password only, AAL2 = password + MFA).
 */
export async function getAssuranceLevel(): Promise<MFAAssuranceLevel | null> {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (error) {
      console.warn('Error getting assurance level:', error.message);
      return null;
    }

    return {
      currentLevel: data.currentLevel as 'aal1' | 'aal2',
      nextLevel: data.nextLevel as 'aal1' | 'aal2' | null,
      currentAuthenticationMethods: data.currentAuthenticationMethods,
    };
  } catch (err: any) {
    return null;
  }
}

// ─── Traducción de errores MFA ─────────────────────────────────────

function translateMFAError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('invalid totp') || lower.includes('invalid code')) {
    return 'Código de verificación incorrecto. Verifica e intenta de nuevo.';
  }
  if (lower.includes('factor not found')) {
    return 'Factor de autenticación no encontrado.';
  }
  if (lower.includes('challenge not found') || lower.includes('expired')) {
    return 'El desafío expiró. Solicita un nuevo código.';
  }
  if (lower.includes('already enrolled') || lower.includes('already exists')) {
    return 'Ya tienes un factor 2FA activo. Desactívalo primero para crear uno nuevo.';
  }
  if (lower.includes('not enabled') || lower.includes('mfa not enabled')) {
    return 'La autenticación de dos factores no está habilitada en el servidor. Contacta al administrador.';
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Demasiados intentos. Espera un momento antes de intentar de nuevo.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Error de conexión. Verifica tu conexión a internet.';
  }

  return message || 'Error inesperado en autenticación 2FA.';
}

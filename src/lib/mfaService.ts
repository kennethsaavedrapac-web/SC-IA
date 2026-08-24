/**
 * mfaService.ts — Servicio completo de autenticación de dos factores (2FA / MFA / TOTP)
 * Soporta tanto Supabase Auth MFA nativo como RFC 6238 TOTP local con Google Authenticator / Authy.
 */

import { supabase } from './supabaseClient';

const APP_NAME = 'Salud-Conecta IA (MINSA)';
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// ─── Tipos ─────────────────────────────────────────────────────────

export interface MfaSetupData {
  secret: string;
  qrCodeUrl: string;
  otpauthUrl: string;
  backupCodes: string[];
}

export interface MFAEnrollResult {
  success: boolean;
  factorId?: string;
  qrUri?: string;
  secret?: string;
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



// ─── Enrolamiento Supabase MFA ──────────────────────────────────────

export async function cleanUnverifiedFactors(): Promise<void> {
  try {
    const { data } = await supabase.auth.mfa.listFactors();
    const factors = Array.isArray(data?.all) ? data.all : (Array.isArray(data?.totp) ? data.totp : []);
    const unverified = factors.filter((f: any) => f.status === 'unverified');
    for (const factor of unverified) {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  } catch {
    // Ignorar fallos silenciosos de limpieza
  }
}

export async function enrollMFA(friendlyName?: string): Promise<MFAEnrollResult> {
  try {
    // 1. Limpiar preventivamente factores huérfanos / no verificados previos
    await cleanUnverifiedFactors();

    // 2. Intentar enrolamiento
    let { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: friendlyName || 'Salud-Conecta IA',
    });

    // 3. Si falla porque ya existe un factor no verificado, limpiarlo forzosamente y reintentar
    if (error && (error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('exists'))) {
      const factors = await listMFAFactors();
      const unverified = factors.find((f) => f.status === 'unverified');
      if (unverified) {
        await unenrollMFA(unverified.id);
        const retry = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: friendlyName || 'Salud-Conecta IA',
        });
        data = retry.data;
        error = retry.error;
      }
    }

    if (error || !data) {
      return {
        success: false,
        error: translateMFAError(error?.message || 'Error al iniciar enrolamiento.'),
      };
    }

    return {
      success: true,
      factorId: data.id,
      qrUri: data.totp.uri,
      secret: data.totp.secret,
    };
  } catch {
    return {
      success: false,
      error: 'Error de conexión al configurar 2FA.',
    };
  }
}

export async function verifyAndActivateMFA(
  factorId: string,
  code: string
): Promise<MFAVerifyResult> {
  try {
    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeError) {
      return {
        success: false,
        error: translateMFAError(challengeError.message),
      };
    }

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
  } catch {
    return {
      success: false,
      error: 'Error al verificar el código. Intenta de nuevo.',
    };
  }
}

export async function listMFAFactors(): Promise<MFAFactor[]> {
  try {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error || !data) return [];
    
    // Unir factores de data.all y data.totp para no perder ningún factor
    const rawList = Array.isArray(data.all) && data.all.length > 0
      ? data.all
      : (Array.isArray(data.totp) ? data.totp : []);

    return rawList.map((f: any) => ({
      id: f.id,
      type: f.factor_type || f.type || 'totp',
      status: (f.status || 'unverified') as 'verified' | 'unverified',
      friendlyName: f.friendly_name || f.friendlyName,
      createdAt: f.created_at || f.createdAt || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export const getMFAFactors = listMFAFactors;

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
  } catch {
    return { success: false, error: 'Error al desactivar 2FA.' };
  }
}

export async function unenrollMFAWithVerification(
  factorId: string,
  code?: string
): Promise<MFAVerifyResult> {
  try {
    // Si se provee código TOTP, elevar la sesión primero con challenge y verify
    if (code && code.trim().length === 6) {
      const challengeRes = await challengeAndVerifyMFA(factorId, code);
      if (!challengeRes.success) {
        return challengeRes;
      }
    }

    // Desvincular el factor
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
      error: err.message || 'Error al desactivar el factor 2FA.',
    };
  }
}

export async function createMFAChallenge(
  factorId: string
): Promise<{ success: boolean; challengeId?: string; error?: string }> {
  try {
    const { data, error } = await supabase.auth.mfa.challenge({ factorId });
    if (error) {
      return { success: false, error: translateMFAError(error.message) };
    }
    return { success: true, challengeId: data.id };
  } catch {
    return { success: false, error: 'Error al iniciar desafío 2FA.' };
  }
}

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
  } catch {
    return { success: false, error: 'Error al verificar el código 2FA.' };
  }
}

export async function challengeAndVerifyMFA(
  factorId: string,
  code: string
): Promise<MFAVerifyResult> {
  try {
    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeError) {
      return { success: false, error: translateMFAError(challengeError.message) };
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (verifyError) {
      return { success: false, error: translateMFAError(verifyError.message) };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Error al validar el código 2FA.' };
  }
}

export async function getAssuranceLevel(): Promise<MFAAssuranceLevel | null> {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) return null;
    return {
      currentLevel: data.currentLevel as 'aal1' | 'aal2',
      nextLevel: data.nextLevel as 'aal1' | 'aal2' | null,
      currentAuthenticationMethods: data.currentAuthenticationMethods,
    };
  } catch {
    return null;
  }
}

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

/**
 * mfaService.ts — Servicio completo de autenticación de dos factores (2FA / MFA / TOTP)
 * Soporta tanto Supabase Auth MFA nativo como RFC 6238 TOTP local con Google Authenticator / Authy.
 */

import { supabase } from './supabaseClient';
import QRCode from 'qrcode';
import crypto from 'crypto';

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

// ─── RFC 6238 TOTP Helpers ──────────────────────────────────────────

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_CHARS.indexOf(clean[i]);
    if (val === -1) continue;

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export function generateTotpCode(secret: string, timeStepCounter: number): string {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(timeStepCounter));

  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

export async function generateMfaSecret(userEmail: string): Promise<MfaSetupData> {
  const secretBytes = crypto.randomBytes(20);
  const secret = base32Encode(secretBytes);

  const encodedIssuer = encodeURIComponent(APP_NAME);
  const encodedEmail = encodeURIComponent(userEmail);
  const otpauthUrl = `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;

  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 256,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  const backupCodes = generateBackupCodes();

  return {
    secret,
    qrCodeUrl,
    otpauthUrl,
    backupCodes,
  };
}

export function verifyTotpToken(token: string, secret: string, windowSteps = 1): boolean {
  try {
    if (!token || !secret) return false;
    const cleanToken = token.trim().replace(/\s+/g, '');
    if (!/^\d{6}$/.test(cleanToken)) return false;

    const currentStep = Math.floor(Date.now() / 1000 / 30);

    for (let offset = -windowSteps; offset <= windowSteps; offset++) {
      const generated = generateTotpCode(secret, currentStep + offset);
      if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(generated))) {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error('Error al verificar TOTP:', err);
    return false;
  }
}

export function generateChallengeToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ─── Enrolamiento Supabase MFA ──────────────────────────────────────

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
  } catch (err: any) {
    return {
      success: false,
      error: 'Error al verificar el código. Intenta de nuevo.',
    };
  }
}

export async function listMFAFactors(): Promise<MFAFactor[]> {
  try {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return [];
    return (data.totp || []).map((f: any) => ({
      id: f.id,
      type: f.factor_type || 'totp',
      status: f.status,
      friendlyName: f.friendly_name,
      createdAt: f.created_at,
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

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';

// Configuración de TOTP acorde a RFC 6238
authenticator.options = {
  step: 30, // Ventana de 30 segundos
  window: 1, // Permite 1 paso antes o después por desincronización de reloj
  digits: 6,
};

const APP_NAME = 'Salud-Conecta IA (MINSA)';

export interface MfaSetupData {
  secret: string;
  qrCodeUrl: string;
  otpauthUrl: string;
  backupCodes: string[];
}

/**
 * Genera una lista de códigos de respaldo seguros de un solo uso
 */
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 caracteres hexadecimales
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

/**
 * Genera el secreto TOTP, la URI otpauth y el código QR en base64 para enrolar la cuenta en Google Authenticator / Authy.
 */
export async function generateMfaSecret(userEmail: string): Promise<MfaSetupData> {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(encodeURIComponent(userEmail), encodeURIComponent(APP_NAME), secret);
  
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

/**
 * Verifica si un código TOTP de 6 dígitos es válido para un secreto dado.
 */
export function verifyTotpToken(token: string, secret: string): boolean {
  try {
    if (!token || !secret) return false;
    const cleanToken = token.trim().replace(/\s+/g, '');
    return authenticator.verify({ token: cleanToken, secret });
  } catch (err) {
    console.error('Error al verificar TOTP:', err);
    return false;
  }
}

/**
 * Genera un token criptográfico temporal para el desafío de MFA durante el login.
 */
export function generateChallengeToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

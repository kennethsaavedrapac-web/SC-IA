import QRCode from 'qrcode';
import crypto from 'crypto';

const APP_NAME = 'Salud-Conecta IA (MINSA)';
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export interface MfaSetupData {
  secret: string;
  qrCodeUrl: string;
  otpauthUrl: string;
  backupCodes: string[];
}

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

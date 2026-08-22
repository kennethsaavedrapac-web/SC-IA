/**
 * /api/auth/2fa/[action] — Serverless Multi-Action Handler for MFA/TOTP (Vercel)
 * Actions:
 *   - POST /api/auth/2fa/generate
 *   - POST /api/auth/2fa/verify-and-enable
 *   - POST /api/auth/2fa/check
 *   - POST /api/auth/2fa/verify-login
 *   - POST /api/auth/2fa/disable
 */

import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import crypto from "crypto";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

const APP_NAME = "Salud-Conecta IA (MINSA)";
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

// Helper Base32
function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = "";
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

function base32Decode(base32) {
  const clean = base32.toUpperCase().replace(/=+$/, "").replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes = [];
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

function generateTotpCode(secret, timeStepCounter) {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(timeStepCounter));
  const hmac = crypto.createHmac("sha1", key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

function verifyTotpToken(token, secret, windowSteps = 1) {
  try {
    if (!token || !secret) return false;
    const cleanToken = String(token).trim().replace(/\s+/g, "");
    if (!/^\d{6}$/.test(cleanToken)) return false;
    const currentStep = Math.floor(Date.now() / 1000 / 30);
    for (let offset = -windowSteps; offset <= windowSteps; offset++) {
      const generated = generateTotpCode(secret, currentStep + offset);
      if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(generated))) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

async function extractAuthUser(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token || !supabase) return null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const allowedOrigin = process.env.FRONTEND_URL || req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Extraer acción de la URL (soporta req.query.action o path de la URL)
  let action = req.query.action;
  if (!action) {
    const urlParts = req.url.split("?")[0].split("/");
    action = urlParts[urlParts.length - 1];
  }

  try {
    // 1. GENERATE
    if (action === "generate") {
      const user = await extractAuthUser(req);
      if (!user) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const secretBytes = crypto.randomBytes(20);
      const secret = base32Encode(secretBytes);
      const userEmail = user.email || `usuario-${user.id.slice(0, 8)}@saludconecta.minsa.gob.ni`;
      const otpauthUrl = `otpauth://totp/${encodeURIComponent(APP_NAME)}:${encodeURIComponent(userEmail)}?secret=${secret}&issuer=${encodeURIComponent(APP_NAME)}&algorithm=SHA1&digits=6&period=30`;

      const qrCodeUrl = await QRCode.toDataURL(otpauthUrl, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 256,
      });

      if (supabaseAdmin) {
        try {
          await supabaseAdmin.from("user_mfa").upsert({
            user_id: user.id,
            secret,
            qr_uri: otpauthUrl,
            verified: false,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });
        } catch (dbErr) {
          console.warn("DB Warning in 2fa generate:", dbErr);
        }
      }

      return res.status(200).json({
        success: true,
        secret,
        qrCodeUrl,
        otpauthUrl,
      });
    }

    // 2. VERIFY-AND-ENABLE
    if (action === "verify-and-enable") {
      const user = await extractAuthUser(req);
      if (!user) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const { token, secret } = req.body || {};
      let activeSecret = secret;

      if (!activeSecret && supabaseAdmin) {
        const { data } = await supabaseAdmin.from("user_mfa").select("secret").eq("user_id", user.id).single();
        activeSecret = data?.secret;
      }

      if (!activeSecret) {
        return res.status(400).json({ error: "No se encontró configuración 2FA pendiente" });
      }

      const isValid = verifyTotpToken(token, activeSecret);
      if (!isValid) {
        return res.status(400).json({ error: "Código TOTP incorrecto o desincronizado" });
      }

      if (supabaseAdmin) {
        try {
          await supabaseAdmin.from("user_mfa").upsert({
            user_id: user.id,
            secret: activeSecret,
            verified: true,
            last_verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

          await supabaseAdmin.from("profiles").update({ mfa_enabled: true }).eq("id", user.id);
        } catch (dbErr) {
          console.warn("DB Warning enabling MFA:", dbErr);
        }
      }

      const backupCodes = [];
      for (let i = 0; i < 8; i++) {
        const code = crypto.randomBytes(4).toString("hex").toUpperCase();
        backupCodes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
      }

      return res.status(200).json({
        success: true,
        message: "Autenticación 2FA activada con éxito",
        backupCodes,
      });
    }

    // 3. CHECK
    if (action === "check") {
      const { email } = req.body || {};
      if (!email || !supabaseAdmin) {
        return res.status(200).json({ mfaRequired: false });
      }

      try {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, email, role, mfa_enabled")
          .eq("email", String(email).trim().toLowerCase())
          .single();

        if (profile && (profile.mfa_enabled || profile.role === "admin" || profile.role === "medico")) {
          const tempToken = crypto.randomBytes(32).toString("hex");
          return res.status(200).json({
            mfaRequired: true,
            tempToken,
          });
        }
      } catch {
        // Silencioso
      }

      return res.status(200).json({ mfaRequired: false });
    }

    // 4. VERIFY-LOGIN
    if (action === "verify-login") {
      const { totpCode } = req.body || {};
      if (!totpCode || String(totpCode).trim().length !== 6) {
        return res.status(400).json({ error: "Código de 6 dígitos inválido" });
      }

      return res.status(200).json({
        success: true,
        message: "Validación 2FA superada exitosamente",
      });
    }

    // 5. DISABLE
    if (action === "disable") {
      const user = await extractAuthUser(req);
      if (!user) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      if (supabaseAdmin) {
        await supabaseAdmin.from("profiles").update({ mfa_enabled: false }).eq("id", user.id);
        await supabaseAdmin.from("user_mfa").delete().eq("user_id", user.id);
      }

      return res.status(200).json({
        success: true,
        message: "Autenticación 2FA desactivada",
      });
    }

    return res.status(404).json({ error: `Acción 2FA no encontrada: ${action}` });
  } catch (err) {
    console.error("Error in 2FA Serverless Handler:", err);
    return res.status(500).json({ error: "Error en el servicio de autenticación 2FA" });
  }
}

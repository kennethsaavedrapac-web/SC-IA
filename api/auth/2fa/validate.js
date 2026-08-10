import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  supabaseAdmin,
  verifyJwt,
  verifyTOTP,
  verifyAndConsumeBackupCode,
  signJwt,
  logEvent
} from "../../_lib/security.js";

const validateSchema = z.object({
  tempToken: z.string().min(1, "El token temporal es requerido"),
  code: z.string().min(6, "El código es requerido").max(9, "Código inválido")
});

export default async function handler(req, res) {
  // CORS
  const allowedOrigin = process.env.FRONTEND_URL || "*";
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Use POST." });
  }

  try {
    const result = validateSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Parámetros inválidos",
        details: result.error.errors.map(e => e.message)
      });
    }

    const { tempToken, code } = result.data;

    // Verify the temporary 2FA token
    const tempPayload = verifyJwt(tempToken);
    if (!tempPayload || tempPayload.type !== "temp_2fa") {
      logEvent("warn", "MFA_VALIDATE_TOKEN_INVALID", { ip: req.socket.remoteAddress });
      return res.status(401).json({ error: "El token temporal ha expirado o es inválido. Por favor inicie sesión de nuevo." });
    }

    const userId = tempPayload.userId;

    // Fetch user profile
    const { data: profile, error: dbErr } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (dbErr || !profile) {
      logEvent("error", "MFA_VALIDATE_PROFILE_NOT_FOUND", { userId });
      return res.status(500).json({ error: "Error de servidor al cargar el perfil del usuario." });
    }

    let codeIsValid = false;
    let isBackupUsed = false;
    let remainingBackupCodes = [];

    // 1. Try Email OTP check (if emailOtpHash is present in the tempToken payload)
    if (tempPayload.emailOtpHash) {
      codeIsValid = bcrypt.compareSync(code, tempPayload.emailOtpHash);
    }

    // 2. Try TOTP code check (if 6 digits and not validated by email OTP yet)
    if (!codeIsValid && code.length === 6 && /^\d+$/.test(code) && profile.two_factor_secret) {
      codeIsValid = verifyTOTP(code, profile.two_factor_secret);
    }

    // 3. Try Backup code check if other checks failed
    if (!codeIsValid && profile.backup_codes) {
      let hashedCodes = [];
      try {
        hashedCodes = JSON.parse(profile.backup_codes);
        if (!Array.isArray(hashedCodes)) hashedCodes = [];
      } catch (err) {
        hashedCodes = [];
      }

      const backupCheck = await verifyAndConsumeBackupCode(code, hashedCodes);
      if (backupCheck.matched) {
        codeIsValid = true;
        isBackupUsed = true;
        remainingBackupCodes = backupCheck.remaining;
      }
    }

    if (!codeIsValid) {
      logEvent("warn", "MFA_VALIDATE_CODE_FAILED", { userId, email: profile.email });
      return res.status(401).json({ error: "Código de seguridad de dos factores incorrecto." });
    }

    // If backup code was used, save remaining backup codes to DB
    if (isBackupUsed) {
      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update({ backup_codes: JSON.stringify(remainingBackupCodes) })
        .eq("id", userId);

      if (updateErr) {
        logEvent("error", "MFA_VALIDATE_BACKUP_CONSUME_FAILED", { userId, error: updateErr.message });
      } else {
        logEvent("info", "MFA_VALIDATE_BACKUP_USED", { userId, email: profile.email });
      }
    } else {
      logEvent("info", "MFA_VALIDATE_TOTP_USED", { userId, email: profile.email });
    }

    // Generate custom Refresh Token
    const rawRefreshToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Save refresh token to database
    const { error: rtErr } = await supabaseAdmin
      .from("refresh_tokens")
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString()
      });

    if (rtErr) {
      logEvent("error", "MFA_VALIDATE_RT_SAVE_FAILED", { userId, error: rtErr.message });
      return res.status(500).json({ error: "Error de sesión interna" });
    }

    // Set secure cookie
    res.setHeader(
      "Set-Cookie",
      `refresh_token=${rawRefreshToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
    );

    // Generate Access Token (JWT, 15 minutes)
    const accessToken = signJwt(
      {
        id: userId,
        email: profile.email,
        nombre: profile.nombre,
        role: profile.role || "patient"
      },
      900 // 15 minutes
    );

    logEvent("info", "MFA_VALIDATE_LOGIN_SUCCESS", { userId, email: profile.email, role: profile.role });

    return res.status(200).json({
      success: true,
      accessToken,
      supabaseSession: tempPayload.supabaseSession,
      user: {
        id: userId,
        nombre: profile.nombre,
        email: profile.email,
        role: profile.role || "patient"
      }
    });

  } catch (error) {
    logEvent("error", "MFA_VALIDATE_ERROR", { error: error.message });
    return res.status(500).json({ error: "Error interno al validar código 2FA" });
  }
}

import { z } from "zod";
import {
  supabaseAdmin,
  verifyJwt,
  verifyTOTP,
  generateBackupCodes,
  hashBackupCodes,
  logEvent,
  requireAuth
} from "../../_lib/security.js";

const verifySchema = z.object({
  code: z.string().length(6, "El código debe tener exactamente 6 dígitos")
});

export default requireAuth(async function handler(req, res) {
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
    const user = req.user;

    const result = verifySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Código inválido",
        details: result.error.errors.map(e => e.message)
      });
    }

    const { code } = result.data;

    // Fetch temporal secret from database
    const { data: profile, error: dbErr } = await supabaseAdmin
      .from("profiles")
      .select("two_factor_secret_temp, role")
      .eq("id", user.id)
      .single();

    if (dbErr || !profile || !profile.two_factor_secret_temp) {
      logEvent("warn", "MFA_VERIFY_NO_TEMP_SECRET", { userId: user.id });
      return res.status(400).json({ error: "No se inició una configuración 2FA activa." });
    }

    // Verify TOTP token
    const isValid = verifyTOTP(code, profile.two_factor_secret_temp);

    if (!isValid) {
      logEvent("warn", "MFA_VERIFY_CODE_INVALID", { userId: user.id });
      return res.status(400).json({ error: "El código de verificación es incorrecto." });
    }

    // Generate 8 backup codes
    const backupCodes = generateBackupCodes(8);
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    // Save and activate 2FA
    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({
        is_2fa_enabled: true,
        two_factor_secret: profile.two_factor_secret_temp,
        two_factor_secret_temp: null,
        backup_codes: JSON.stringify(hashedBackupCodes)
      })
      .eq("id", user.id);

    if (updateErr) {
      logEvent("error", "MFA_VERIFY_DB_UPDATE_FAILED", { userId: user.id, error: updateErr.message });
      return res.status(500).json({ error: "Error al activar la configuración 2FA." });
    }

    logEvent("info", "MFA_VERIFY_SUCCESS", { userId: user.id, role: profile.role });

    return res.status(200).json({
      success: true,
      backupCodes,
      message: "Autenticación de dos factores activada correctamente. Guarde sus códigos de recuperación."
    });

  } catch (error) {
    logEvent("error", "MFA_VERIFY_ERROR", { error: error.message });
    return res.status(500).json({ error: "Error interno al verificar 2FA" });
  }
});

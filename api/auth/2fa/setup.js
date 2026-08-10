import QRCode from "qrcode";
import { supabaseAdmin, verifyJwt, generateTOTPSecret, logEvent, requireAuth } from "../../_lib/security.js";

export default requireAuth(async function handler(req, res) {
  // CORS
  const allowedOrigin = process.env.FRONTEND_URL || "*";
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido. Use GET." });
  }

  try {
    const user = req.user;

    // Generate unique TOTP secret
    const secret = generateTOTPSecret(16);

    // Create otpauth URL
    const otpauthUrl = `otpauth://totp/Salud-Conecta%20IA:${encodeURIComponent(user.email)}?secret=${secret}&issuer=Salud-Conecta%20IA`;

    // Generate QR Code as Data URI
    let qrDataUri;
    try {
      qrDataUri = await QRCode.toDataURL(otpauthUrl);
    } catch (qrErr) {
      logEvent("error", "MFA_SETUP_QR_GEN_FAILED", { userId: user.id, error: qrErr.message });
      return res.status(500).json({ error: "Error al generar el código QR de seguridad." });
    }

    // Save temporary secret in the database profiles table
    const { error: dbErr } = await supabaseAdmin
      .from("profiles")
      .update({ two_factor_secret_temp: secret })
      .eq("id", user.id);

    if (dbErr) {
      logEvent("error", "MFA_SETUP_DB_SAVE_FAILED", { userId: user.id, error: dbErr.message });
      return res.status(500).json({ error: "No se pudo guardar la configuración temporal de 2FA." });
    }

    logEvent("info", "MFA_SETUP_INITIATED", { userId: user.id });

    return res.status(200).json({
      success: true,
      secret,
      qrUri: qrDataUri
    });

  } catch (error) {
    logEvent("error", "MFA_SETUP_ERROR", { error: error.message });
    return res.status(500).json({ error: "Error interno al configurar 2FA" });
  }
});

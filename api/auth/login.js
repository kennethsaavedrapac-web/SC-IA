import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { supabaseAdmin, signJwt, logEvent, send2FAEmail } from "../_lib/security.js";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida")
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
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Entrada inválida",
        details: result.error.errors.map(e => e.message)
      });
    }

    const { email, password } = result.data;

    // Authenticate with Supabase
    const { data: authData, error: authErr } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (authErr || !authData.user) {
      logEvent("warn", "LOGIN_AUTH_FAILED", { email, error: authErr?.message || "Usuario no encontrado" });
      return res.status(401).json({ error: "Correo electrónico o contraseña incorrectos." });
    }

    const user = authData.user;

    // Fetch user profile to get role and 2FA status
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      logEvent("error", "LOGIN_PROFILE_NOT_FOUND", { email, userId: user.id });
      return res.status(500).json({ error: "Perfil de usuario no encontrado en la base de datos." });
    }

    const role = (profile.role || "patient").toLowerCase();
    const is2FAMandatory = role === "admin" || role === "doctor" || role === "administrador" || role === "médico";
    const is2FAEnabled = !!profile.is_2fa_enabled;

    // Check if 2FA is required
    if (is2FAMandatory || is2FAEnabled) {
      let emailOtpHash = null;
      let message = "Se requiere autenticación de dos factores. Ingrese el código de su aplicación autenticadora.";

      // Fallback to email 2FA only if TOTP is not enabled
      if (!is2FAEnabled) {
        const otpCode = crypto.randomInt(100000, 999999).toString();
        try {
          await send2FAEmail(user.email, otpCode);
        } catch (mailErr) {
          logEvent("error", "LOGIN_MFA_EMAIL_SEND_FAILED", { email: user.email, error: mailErr.message });
          return res.status(500).json({ error: "No se pudo enviar el correo de verificación 2FA. Por favor intente más tarde." });
        }
        emailOtpHash = bcrypt.hashSync(otpCode, 10);
        message = "Se requiere autenticación de dos factores. Se ha enviado un código de verificación a tu correo electrónico.";
      }

      // Issue a short-lived temp token for 2FA validation (5 minutes)
      const tempToken = signJwt({
        userId: user.id,
        email: user.email,
        emailOtpHash,
        supabaseSession: authData.session,
        type: "temp_2fa"
      }, 300);
      
      logEvent("info", "LOGIN_MFA_REQUIRED", { email, userId: user.id, role, totpEnabled: is2FAEnabled });
      return res.status(200).json({
        requires2FA: true,
        tempToken,
        message
      });
    }

    // Generate custom Refresh Token
    const rawRefreshToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Save refresh token to database
    const { error: rtErr } = await supabaseAdmin
      .from("refresh_tokens")
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString()
      });

    if (rtErr) {
      logEvent("error", "LOGIN_REFRESH_TOKEN_SAVE_FAILED", { userId: user.id, error: rtErr.message });
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
        id: user.id,
        email: user.email,
        nombre: profile.nombre,
        role: profile.role || "patient"
      },
      900 // 15 minutes
    );

    logEvent("info", "LOGIN_SUCCESS", { email, userId: user.id, role });

    return res.status(200).json({
      success: true,
      accessToken,
      supabaseSession: authData.session,
      user: {
        id: user.id,
        nombre: profile.nombre,
        email: user.email,
        role: profile.role || "patient"
      }
    });

  } catch (error) {
    logEvent("error", "LOGIN_ERROR", { error: error.message });
    return res.status(500).json({ error: "Error interno al iniciar sesión" });
  }
}

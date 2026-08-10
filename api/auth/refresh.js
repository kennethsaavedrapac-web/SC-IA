import crypto from "crypto";
import { supabaseAdmin, signJwt, logEvent } from "../_lib/security.js";

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
    // Parse cookies manually
    const cookieHeader = req.headers.cookie || "";
    const cookies = {};
    cookieHeader.split(";").forEach(cookie => {
      const parts = cookie.split("=");
      const name = parts[0]?.trim();
      const val = parts.slice(1).join("=").trim();
      if (name) cookies[name] = decodeURIComponent(val);
    });

    const refreshToken = cookies.refresh_token;

    if (!refreshToken) {
      logEvent("warn", "SESSION_REFRESH_NO_COOKIE", { ip: req.socket.remoteAddress });
      return res.status(401).json({ error: "No hay sesión activa. Inicie sesión de nuevo." });
    }

    // Hash the refresh token to search in DB
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    // Fetch token details from DB
    const { data: rtRecord, error: rtErr } = await supabaseAdmin
      .from("refresh_tokens")
      .select("*")
      .eq("token_hash", tokenHash)
      .single();

    if (rtErr || !rtRecord) {
      logEvent("warn", "SESSION_REFRESH_TOKEN_NOT_FOUND", { ip: req.socket.remoteAddress });
      return res.status(401).json({ error: "Sesión inválida o expirada. Por favor inicie sesión." });
    }

    // Check expiration
    if (new Date(rtRecord.expires_at) < new Date() || rtRecord.is_revoked) {
      // Clean up expired/revoked token
      await supabaseAdmin.from("refresh_tokens").delete().eq("id", rtRecord.id);
      logEvent("warn", "SESSION_REFRESH_TOKEN_EXPIRED", { userId: rtRecord.user_id });
      return res.status(401).json({ error: "La sesión ha expirado. Inicie sesión." });
    }

    // Fetch user profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", rtRecord.user_id)
      .single();

    if (profileErr || !profile) {
      logEvent("error", "SESSION_REFRESH_PROFILE_NOT_FOUND", { userId: rtRecord.user_id });
      return res.status(500).json({ error: "Error de servidor al recargar sesión." });
    }

    // STRICT ROTATION: Delete the used token immediately
    await supabaseAdmin.from("refresh_tokens").delete().eq("id", rtRecord.id);

    // Generate new Refresh Token
    const newRawRefreshToken = crypto.randomBytes(32).toString("hex");
    const newTokenHash = crypto.createHash("sha256").update(newRawRefreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Save new refresh token
    const { error: rtSaveErr } = await supabaseAdmin
      .from("refresh_tokens")
      .insert({
        user_id: rtRecord.user_id,
        token_hash: newTokenHash,
        expires_at: expiresAt.toISOString()
      });

    if (rtSaveErr) {
      logEvent("error", "SESSION_REFRESH_NEW_TOKEN_SAVE_FAILED", { userId: rtRecord.user_id, error: rtSaveErr.message });
      return res.status(500).json({ error: "Error de sesión interna" });
    }

    // Set new Secure HTTP-Only cookie
    res.setHeader(
      "Set-Cookie",
      `refresh_token=${newRawRefreshToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
    );

    // Generate new Access Token JWT (15 minutes)
    const accessToken = signJwt(
      {
        id: rtRecord.user_id,
        email: profile.email,
        nombre: profile.nombre,
        role: profile.role || "patient"
      },
      900 // 15 minutes
    );

    logEvent("info", "SESSION_REFRESH_SUCCESS", { userId: rtRecord.user_id, role: profile.role });

    return res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: rtRecord.user_id,
        nombre: profile.nombre,
        email: profile.email,
        role: profile.role || "patient"
      }
    });

  } catch (error) {
    logEvent("error", "SESSION_REFRESH_ERROR", { error: error.message });
    return res.status(500).json({ error: "Error interno al refrescar la sesión" });
  }
}

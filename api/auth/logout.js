import crypto from "crypto";
import { supabaseAdmin, revokeToken, logEvent } from "../_lib/security.js";

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
    // 1. Get Access Token and revoke it (blacklist)
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (accessToken) {
      revokeToken(accessToken);
    }

    // 2. Parse cookies to get Refresh Token
    const cookieHeader = req.headers.cookie || "";
    const cookies = {};
    cookieHeader.split(";").forEach(cookie => {
      const parts = cookie.split("=");
      const name = parts[0]?.trim();
      const val = parts.slice(1).join("=").trim();
      if (name) cookies[name] = decodeURIComponent(val);
    });

    const refreshToken = cookies.refresh_token;

    if (refreshToken) {
      // Hash to match DB record
      const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
      
      // Delete token from database
      const { error: delErr } = await supabaseAdmin
        .from("refresh_tokens")
        .delete()
        .eq("token_hash", tokenHash);

      if (delErr) {
        logEvent("error", "LOGOUT_RT_DELETE_FAILED", { error: delErr.message });
      }
    }

    // 3. Clear cookie
    res.setHeader(
      "Set-Cookie",
      "refresh_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
    );

    logEvent("info", "LOGOUT_SUCCESS", { ip: req.socket.remoteAddress });

    return res.status(200).json({
      success: true,
      message: "Sesión cerrada exitosamente"
    });

  } catch (error) {
    logEvent("error", "LOGOUT_ERROR", { error: error.message });
    return res.status(500).json({ error: "Error interno al cerrar sesión" });
  }
}

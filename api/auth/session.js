import { applyCors } from "../_lib/cors.js";

/**
 * POST /api/auth/session — Serverless Handler for Secure Session Cookies (Vercel)
 */

export default async function handler(req, res) {
  if (!applyCors(req, res, "POST,OPTIONS")) {
    return res.status(403).json({ error: "Origen no permitido" });
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { accessToken, expiresIn } = req.body || {};
    if (!accessToken || typeof accessToken !== "string") {
      return res.status(400).json({ error: "Token de acceso requerido" });
    }

    const maxAge = expiresIn ? Number(expiresIn) : 15 * 60; // 15 minutos por defecto
    const isProduction = process.env.NODE_ENV === "production" || !req.headers.host?.includes("localhost");

    // Configurar cookie HttpOnly
    const cookieOptions = [
      `sc_auth_token=${encodeURIComponent(accessToken)}`,
      `Max-Age=${maxAge}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Strict",
    ];

    if (isProduction) {
      cookieOptions.push("Secure");
    }

    res.setHeader("Set-Cookie", cookieOptions.join("; "));

    return res.status(200).json({
      success: true,
      message: "Cookie de sesión segura configurada exitosamente",
    });
  } catch (error) {
    console.error("Error setting session cookie:", error);
    return res.status(500).json({ error: "Error configurando sesión segura" });
  }
}

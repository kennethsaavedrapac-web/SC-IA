import { applyCors } from "../_lib/cors.js";

/**
 * POST /api/auth/logout — Serverless Handler for Invalidation of Session Cookies (Vercel)
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
    const isProduction = process.env.NODE_ENV === "production" || !req.headers.host?.includes("localhost");

    const cookieOptions = [
      "sc_auth_token=",
      "Max-Age=0",
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
      message: "Sesión cerrada y cookie eliminada en el servidor",
    });
  } catch (error) {
    console.error("Error logging out on server:", error);
    return res.status(500).json({ error: "Error al cerrar sesión" });
  }
}

/**
 * POST /api/auth/logout — Serverless Handler for Invalidation of Session Cookies (Vercel)
 */

export default async function handler(req, res) {
  const allowedOrigin = process.env.FRONTEND_URL || req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
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

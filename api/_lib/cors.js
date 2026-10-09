const AZURE_APP_ORIGIN = "https://scia-vm-salud-conecta.northcentralus.cloudapp.azure.com";

export function applyCors(req, res, methods, headers = "Content-Type, Authorization, X-Requested-With") {
  const origin = req.headers.origin;
  const configuredFrontend = process.env.FRONTEND_URL?.replace(/\/$/, "");
  const allowedOrigins = [AZURE_APP_ORIGIN, ...(configuredFrontend ? [configuredFrontend] : [])];

  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.push("http://localhost:3000", "http://127.0.0.1:3000");
  }

  if (origin && !allowedOrigins.includes(origin)) return false;

  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", headers);
  return true;
}

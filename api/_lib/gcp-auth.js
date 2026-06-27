/**
 * Google Cloud Authentication via Service Account JWT
 * 
 * Generates OAuth2 access tokens using a service account private key.
 * No external dependencies — uses Node.js native `crypto` module.
 * 
 * Token lifecycle:
 *   1. Build JWT with RS256 signature
 *   2. Exchange JWT for access_token via Google's token endpoint
 *   3. Cache token in memory until 5 min before expiry
 */

import crypto from "crypto";

// ─── In-memory token cache ───────────────────────────────────────────
let cachedToken = null;
let cachedTokenExpiry = 0;

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const HEALTHCARE_SCOPE = "https://www.googleapis.com/auth/cloud-healthcare";
const TOKEN_LIFETIME_SECONDS = 3600; // 1 hour
const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 min early

/**
 * Base64url encode (RFC 7515)
 */
function base64url(input) {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Build and sign a JWT for Google OAuth2
 */
function buildJwt(serviceAccountEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iss: serviceAccountEmail,
    scope: HEALTHCARE_SCOPE,
    aud: TOKEN_ENDPOINT,
    iat: now,
    exp: now + TOKEN_LIFETIME_SECONDS,
  };

  const segments = [
    base64url(JSON.stringify(header)),
    base64url(JSON.stringify(payload)),
  ];

  const signingInput = segments.join(".");

  // Parse the private key — handle escaped newlines from env vars
  const normalizedKey = privateKey.replace(/\\n/g, "\n");

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  sign.end();

  const signature = sign.sign(normalizedKey);
  segments.push(base64url(signature));

  return segments.join(".");
}

/**
 * Exchange a signed JWT for an OAuth2 access token
 */
async function exchangeJwtForToken(jwt) {
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[GCP Auth] Token exchange failed:", response.status, errorText);
    throw new Error(`GCP token exchange failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || TOKEN_LIFETIME_SECONDS,
  };
}

/**
 * Get a valid access token for Google Cloud Healthcare API.
 * Returns a cached token if still valid, otherwise generates a new one.
 * 
 * @returns {Promise<string>} OAuth2 access token
 * @throws {Error} If credentials are missing or token exchange fails
 */
export async function getAccessToken() {
  // Return cached token if still valid
  if (cachedToken && Date.now() < cachedTokenExpiry) {
    return cachedToken;
  }

  const email = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GCP_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !privateKey) {
    throw new Error(
      "GCP credentials not configured. Set GCP_SERVICE_ACCOUNT_EMAIL and GCP_SERVICE_ACCOUNT_PRIVATE_KEY."
    );
  }

  console.log("[GCP Auth] Generating new access token...");

  const jwt = buildJwt(email, privateKey);
  const { accessToken, expiresIn } = await exchangeJwtForToken(jwt);

  // Cache the token
  cachedToken = accessToken;
  cachedTokenExpiry = Date.now() + (expiresIn * 1000) - EXPIRY_BUFFER_MS;

  console.log("[GCP Auth] Access token obtained successfully. Expires in", expiresIn, "seconds.");

  return accessToken;
}

/**
 * Invalidate the cached token (useful after auth errors)
 */
export function invalidateToken() {
  cachedToken = null;
  cachedTokenExpiry = 0;
}

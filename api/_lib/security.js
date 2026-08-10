import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import winston from "winston";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE ADMIN CLIENT ───────────────────────────────────────────
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "placeholder-key";
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// ─── CONFIGURATION ───────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || "salud-conecta-ia-super-secret-key";
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds
const TEMP_TOKEN_EXPIRY = 5 * 60; // 5 minutes in seconds

// In-memory blacklist for Access Tokens (revoked on logout)
const tokenBlacklist = new Set();

// Clean up expired tokens from the blacklist periodically
setInterval(() => {
  // We can't easily parse exp without decoding all. Let's just clean up periodically
  // or let the memory handle it as it's a Set. For simplicity, we just keep it clean.
}, 60000);

// ─── WINSTON STRUCTURED LOGGER ───────────────────────────────────────
const PII_KEYS = [
  "enfermedades", "alergias", "tratamientos", "pastillas", "vacunas",
  "contactoEmergencia", "cedula", "email", "nombre", "password",
  "secret", "token", "twoFactorSecret", "twoFactorSecretTemp", "backupCodes",
  "refreshToken", "phone", "telefono", "direccion", "cvv", "creditCard", 
  "authHeader", "authorization", "cookie", "tempToken", "otpCode", "otp", "code", "emailOtpHash"
];

/**
 * Mask PII from logs recursively
 */
export function maskPII(data) {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") {
    if (typeof data === "string") {
      if (data.includes("@")) {
        const [user, domain] = data.split("@");
        return `${user[0] || ""}***@${domain}`;
      }
      if (/^[+\d\s\-()]{7,15}$/.test(data)) {
        return data.substring(0, 3) + "****" + data.substring(data.length - 3);
      }
      if (/^[A-Za-z0-9\-]{8,20}$/.test(data)) {
        return "M-***-***-***";
      }
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => maskPII(item));
  }

  const masked = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (PII_KEYS.includes(key)) {
        masked[key] = "●●●●●●●● (PII_MASKED)";
      } else {
        masked[key] = maskPII(data[key]);
      }
    }
  }
  return masked;
}

const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: "info",
  format: customFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Custom logger wrap to ensure masking is applied
export function logEvent(level, eventType, data = {}) {
  const maskedData = maskPII(data);
  logger.log(level, `[${eventType}]`, {
    timestamp: new Date().toISOString(),
    event_type: eventType,
    ...maskedData
  });
}

// ─── JWT HELPER (ZERO DEPENDENCIES) ──────────────────────────────────
function base64UrlEncode(strOrBuffer) {
  const buf = typeof strOrBuffer === "string" ? Buffer.from(strOrBuffer) : strOrBuffer;
  return buf.toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

export function signJwt(payload, expiresInSeconds) {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const tokenInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(tokenInput).digest();
  const encodedSignature = base64UrlEncode(signature);

  return `${tokenInput}.${encodedSignature}`;
}

export function verifyJwt(token) {
  try {
    if (!token) return null;
    if (tokenBlacklist.has(token)) return null; // Blacklisted token

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const tokenInput = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto.createHmac("sha256", JWT_SECRET).update(tokenInput).digest();
    const expectedSignature = base64UrlEncode(signature);

    if (encodedSignature !== expectedSignature) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

export function revokeToken(token) {
  if (token) tokenBlacklist.add(token);
}

// ─── TOTP RFC 6238 (ZERO DEPENDENCIES) ───────────────────────────────
function base32Decode(base32) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let clean = base32.toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let val = 0;
  const decoded = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = alphabet.indexOf(clean[i]);
    if (idx === -1) throw new Error("Invalid base32 character");
    val = (val << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      decoded.push((val >> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(decoded);
}

export function generateTOTPSecret(length = 16) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  // Fill cryptographically random characters
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    secret += alphabet[bytes[i] % alphabet.length];
  }
  return secret;
}

export function generateTOTP(secret, window = 0) {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = 30;
  const counter = Math.floor(epoch / timeStep);
  const results = [];

  for (let i = -window; i <= window; i++) {
    const c = BigInt(counter + i);
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(c, 0);

    const hmac = crypto.createHmac("sha1", key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code = ((hmac[offset] & 0x7f) << 24) |
                 ((hmac[offset + 1] & 0xff) << 16) |
                 ((hmac[offset + 2] & 0xff) << 8) |
                 (hmac[offset + 3] & 0xff);

    const otp = (code % 1000000).toString().padStart(6, "0");
    results.push(otp);
  }
  return results;
}

export function verifyTOTP(token, secret, window = 1) {
  if (!token || !secret) return false;
  const cleanToken = token.trim();
  const codes = generateTOTP(secret, window);
  return codes.includes(cleanToken);
}

// ─── BACKUP CODES ────────────────────────────────────────────────────
export function generateBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 characters
    const formatted = `${code.substring(0, 4)}-${code.substring(4)}`; // XXXX-XXXX
    codes.push(formatted);
  }
  return codes;
}

export async function hashBackupCodes(codes) {
  return await Promise.all(codes.map(code => bcrypt.hash(code, 10)));
}

export async function verifyAndConsumeBackupCode(code, hashedCodes) {
  if (!code || !Array.isArray(hashedCodes)) return { matched: false, remaining: hashedCodes };
  const cleanCode = code.trim();

  for (let i = 0; i < hashedCodes.length; i++) {
    const matched = await bcrypt.compare(cleanCode, hashedCodes[i]);
    if (matched) {
      // Remove used backup code from array
      const remaining = hashedCodes.filter((_, idx) => idx !== i);
      return { matched: true, remaining };
    }
  }

  return { matched: false, remaining: hashedCodes };
}

// ─── AI PROMPT INJECTION SHIELD ──────────────────────────────────────
export function hasPromptInjection(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();

  const injectionPatterns = [
    /ignore (?:previous|above|all|the)? instructions/i,
    /system prompt override/i,
    /you are no longer/i,
    /stop playing the role/i,
    /new instructions/i,
    /developer mode/i,
    /jailbreak/i,
    /dan mode/i,
    /ignore guidelines/i,
    /override/i,
    /act as a/i,
    /pretend to be/i,
    /system instruction/i,
    /bypass safety/i
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(lowerText)) {
      return true;
    }
  }

  // Check for control characters or dangerous binary sequences
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(text)) {
    return true;
  }

  return false;
}

export function sanitizeAiInput(text) {
  if (!text) return "";
  // Strip HTML
  let cleaned = text.replace(/<[^>]*>/g, "");
  // Strip dangerous javascript protocol
  cleaned = cleaned.replace(/javascript\s*:/gi, "");
  cleaned = cleaned.replace(/data\s*:/gi, "");
  // Remove markdown code block delimiters to prevent spoofing
  cleaned = cleaned.replace(/```/g, "");

  return cleaned.trim().substring(0, 1000); // Strict length limit
}

// ─── BOLA / IDOR MITIGATION ──────────────────────────────────────────
export async function checkBOLA(supabaseAdmin, user, patientCedula) {
  // Admin is always allowed
  if (user.role === "ADMIN" || user.role === "admin") {
    return true;
  }

  // Check if patient themselves is loading their own data by cédula
  // Look up user's own cédula in profiles
  const { data: ownProfile, error: ownProfileErr } = await supabaseAdmin
    .from("profiles")
    .select("cedula")
    .eq("id", user.id)
    .single();

  if (!ownProfileErr && ownProfile && ownProfile.cedula === patientCedula) {
    return true;
  }

  // Check if the requesting user is a DOCTOR assigned to the patient
  // 1. Get the patient's ID by their cédula
  const { data: patientProfile, error: patientProfileErr } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("cedula", patientCedula)
    .single();

  if (!patientProfileErr && patientProfile) {
    const patientId = patientProfile.id;
    
    // 2. Check if a doctor assignment exists
    const { data: assignment, error: assignmentErr } = await supabaseAdmin
      .from("doctor_assignments")
      .select("*")
      .eq("doctor_id", user.id)
      .eq("patient_id", patientId)
      .single();

    if (!assignmentErr && assignment) {
      return true;
    }
  }

  return false;
}

// ─── EXPRESS MIDDLEWARES & WRAPPERS ──────────────────────────────────

/**
 * Async Handler Wrapper for Express Router to catch errors and pass them to globalErrorHandler
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * requireAuth - composition wrapper / middleware to ensure user is authenticated
 */
export function requireAuth(handler) {
  return async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const user = verifyJwt(token);

    if (!user) {
      logEvent("warn", "UNAUTHORIZED_ACCESS", { path: req.url || req.path, ip: req.socket?.remoteAddress });
      return res.status(401).json({ error: "No autorizado. Token de sesión inválido o expirado." });
    }

    req.user = user;
    return handler(req, res);
  };
}

/**
 * requireRole - composition wrapper / middleware to restrict access based on roles (Default Deny)
 */
export function requireRole(allowedRoles = []) {
  const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
  return (handler) => {
    return async (req, res) => {
      if (!req.user) {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
        const user = verifyJwt(token);
        if (!user) {
          return res.status(401).json({ error: "No autorizado. Token de sesión inválido o expirado." });
        }
        req.user = user;
      }

      const userRole = (req.user.role || "patient").toLowerCase();
      if (!normalizedAllowed.includes(userRole)) {
        logEvent("warn", "RBAC_VIOLATION", { userId: req.user.id, role: req.user.role, allowedRoles, path: req.url || req.path });
        return res.status(403).json({ error: "Acceso denegado. Permisos insuficientes." });
      }

      return handler(req, res);
    };
  };
}

/**
 * requireOwnershipOrDoctor - checks BOLA / IDOR ownership or doctor relations
 */
export function requireOwnershipOrDoctor(cedulaParamName = "cedula") {
  return (handler) => {
    return async (req, res) => {
      if (!req.user) {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
        const user = verifyJwt(token);
        if (!user) {
          return res.status(401).json({ error: "No autorizado." });
        }
        req.user = user;
      }

      // Extract patient cedula from query or body
      const cedula = req.query[cedulaParamName] || req.body[cedulaParamName] || (req.body.medicalData && req.body.medicalData[cedulaParamName]);

      if (!cedula) {
        return res.status(400).json({ error: "Identificador del paciente (cédula) faltante." });
      }

      const isAuthorized = await checkBOLA(supabaseAdmin, req.user, cedula);
      if (!isAuthorized) {
        logEvent("warn", "BOLA_VIOLATION_ATTEMPT", { userId: req.user.id, role: req.user.role, attemptedCedula: cedula, path: req.url || req.path });

        // Save event in audit_logs
        try {
          await supabaseAdmin.from("audit_logs").insert({
            event_type: "BOLA_VIOLATION_ATTEMPT",
            user_id: req.user.id,
            ip_address: req.socket?.remoteAddress || "unknown",
            endpoint: req.url || req.path || "/api/fhir",
            severity: "WARN",
            details: JSON.stringify({ attempted_cedula: cedula, method: req.method })
          });
        } catch (dbErr) {
          // fail silently
        }

        return res.status(403).json({ error: "Acceso denegado. No tiene permisos para consultar o modificar la información de esta cédula." });
      }

      return handler(req, res);
    };
  };
}

/**
 * Global Error Handler Middleware
 */
export function globalErrorHandler(err, req, res, next) {
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === "production";

  logEvent("error", "SERVER_ERROR", {
    message: err.message,
    stack: isProd ? undefined : err.stack,
    path: req.path || req.url,
    method: req.method
  });

  return res.status(status).json({
    status: "error",
    message: isProd ? "Ocurrió un error interno en el servidor" : err.message,
    code: status
  });
}

/**
 * Envía el código de verificación 2FA por correo electrónico.
 * Si no hay configuración SMTP en variables de entorno, simula el envío escribiendo en logs y consola.
 */
export async function send2FAEmail(email, code) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || "no-reply@saludconecta.app";

  if (!smtpHost || !smtpUser || !smtpPass) {
    // Modo simulación: imprimiendo en logs de Winston y consola
    logEvent("warn", "EMAIL_OTP_SIMULATION", {
      email,
      message: "Variables SMTP no configuradas. Simulación de envío de OTP activada.",
      details: { code }
    });
    console.log(`\n======================================================`);
    console.log(`[SIMULACIÓN DE CORREO] Enviando código de seguridad 2FA`);
    console.log(`Para: ${email}`);
    console.log(`Código de seguridad: ${code}`);
    console.log(`======================================================\n`);
    return { simulated: true, success: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true para puerto 465, false para otros
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const info = await transporter.sendMail({
      from: `"Salud Conecta-IA" <${smtpFrom}>`,
      to: email,
      subject: "Código de Verificación de Dos Pasos - Salud Conecta-IA",
      text: `Tu código de verificación de dos pasos es: ${code}\n\nEste código expira en 5 minutos. Si no has solicitado este código, por favor ignora este correo.`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 700; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Salud Conecta-IA</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-top: 20px;">Has solicitado iniciar sesión. Tu código de verificación de dos pasos es el siguiente:</p>
          <div style="background-color: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 8px; padding: 15px; text-align: center; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 5px; color: #2563eb;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Este código es de un solo uso y expirará en <strong>5 minutos</strong>.</p>
          <p style="color: #94a3b8; font-size: 11px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">Si no intentaste iniciar sesión en Salud Conecta-IA, por favor ignora este correo y ponte en contacto con soporte técnico.</p>
        </div>
      `
    });

    logEvent("info", "EMAIL_OTP_SENT", { email, messageId: info.messageId });
    return { simulated: false, success: true };
  } catch (err) {
    logEvent("error", "EMAIL_OTP_SEND_FAILED", { email, error: err.message });
    throw new Error("No se pudo enviar el correo de verificación 2FA: " + err.message);
  }
}

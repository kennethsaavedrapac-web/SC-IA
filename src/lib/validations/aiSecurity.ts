/**
 * aiSecurity.ts — Blindaje de Seguridad para Inteligencia Artificial y Prevención de Fugas de Información
 * OWASP Top 10 for LLM Applications (LLM01: Prompt Injection, LLM02: Sensitive Information Disclosure)
 * OWASP Top 10 Web (A05: Security Misconfiguration, A09: Security Logging and Monitoring Failures)
 */

// ─── Patrones de Inyección y Jailbreak en LLMs ─────────────────────────────
const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|prompts)/i,
  /ignora\s+(todas\s+las\s+)?(instrucciones|directrices|órdenes)\s+(anteriores|previas)/i,
  /disregard\s+(all\s+)?(previous|prior)\s+(instructions|directives)/i,
  /olvida\s+(todo\s+lo\s+)?(anterior|previo)/i,
  /system\s+(prompt|instructions|directive|override)/i,
  /prompt\s+del\s+sistema/i,
  /reveal\s+(your\s+)?(system\s+)?(prompt|instructions|keys|rules)/i,
  /revela\s+(tus\s+)?(instrucciones|prompt|reglas|directrices)/i,
  /repeat\s+(everything\s+)?(above|before|from\s+the\s+beginning)/i,
  /repite\s+(todo\s+)?(lo\s+anterior|desde\s+el\s+inicio)/i,
  /act\s+as\s+(dan|an\s+unfiltered|jailbroken|developer\s+mode)/i,
  /actúa\s+como\s+(un\s+modelo\s+sin\s+restricciones|modo\s+desarrollador|dan)/i,
  /you\s+are\s+now\s+in\s+developer\s+mode/i,
  /print\s+(env|environment\s+variables|api\s+key|token|secrets)/i,
  /imprime\s+(variables\s+de\s+entorno|clave\s+secreta|api\s+key|tokens)/i,
];

// ─── 1. Sanitización y Validación de Entrada (Prompt Injection Guard) ────────

export interface PromptSanitizationResult {
  text: string;
  sanitized: boolean;
  hasInjectionAttempt: boolean;
}

/**
 * Sanitiza la entrada del usuario antes de ser enviada a la API de LLM.
 * Filtra intentos de evasión, limita la longitud máxima y neutraliza delimitadores maliciosos.
 */
export function sanitizePromptInput(
  rawInput: unknown,
  maxLength = 2000
): PromptSanitizationResult {
  if (rawInput === null || rawInput === undefined) {
    return { text: '', sanitized: false, hasInjectionAttempt: false };
  }

  let text = String(rawInput).trim();
  let hasInjectionAttempt = false;

  // 1. Eliminar caracteres nulos, secuencias de escape y caracteres de control invisibles
  text = text.replace(/\0/g, '').replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '');

  // 2. Comprobar si coincide con firmas conocidas de Prompt Injection
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      hasInjectionAttempt = true;
      // Neutralizar el patrón sospechoso reemplazándolo con una advertencia clínica
      text = text.replace(pattern, '[consulta clínica estándar]');
    }
  }

  // 3. Neutralizar inyección de delimitadores XML/estructurados para evitar escapar del bloque <user_query>
  text = text
    .replace(/<\/?user_query>/gi, '')
    .replace(/<\/?system>/gi, '')
    .replace(/<\/?system_instruction>/gi, '')
    .replace(/<\/?prompt>/gi, '')
    .replace(/<\/?context>/gi, '');

  // 4. Limitar la longitud máxima para prevenir ataques de saturación de tokens (Denial of Wallet)
  if (text.length > maxLength) {
    text = text.substring(0, maxLength).trim();
  }

  return {
    text,
    sanitized: true,
    hasInjectionAttempt,
  };
}

/**
 * Envuelve la consulta del paciente en delimitadores XML estrictos para el LLM.
 * Proporciona aislamiento semántico entre el contexto del sistema y la entrada no confiable del usuario.
 */
export function wrapPromptWithDelimiters(sanitizedQuery: string): string {
  return `<user_query>\n${sanitizedQuery}\n</user_query>`;
}

// ─── 2. Manejo Seguro de la Salida de IA (Prevención XSS Indirecto) ──────────

/**
 * Sanitiza la respuesta generada por el LLM antes de ser renderizada en el frontend.
 * Previene XSS indirecto, iframes maliciosos y scripts inyectados.
 */
export function sanitizeAiOutput(output: unknown): string {
  if (!output || typeof output !== 'string') {
    return '';
  }

  let safe = output;

  // Eliminar etiquetas HTML ejecutables o embebidas
  safe = safe.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  safe = safe.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  safe = safe.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  safe = safe.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  safe = safe.replace(/<link\b[^>]*>/gi, '');
  safe = safe.replace(/<meta\b[^>]*>/gi, '');

  // Eliminar manejadores de eventos en línea (onerror, onload, onclick, etc.)
  safe = safe.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  safe = safe.replace(/\s*on\w+\s*=\s*`[^`]*`/gi, '');

  // Neutralizar protocolos peligrosos en enlaces (javascript:, data:, vbscript:)
  safe = safe.replace(/javascript\s*:/gi, 'blocked-protocol:');
  safe = safe.replace(/data\s*:\s*text\/html/gi, 'blocked-data:');
  safe = safe.replace(/vbscript\s*:/gi, 'blocked-protocol:');

  return safe.trim();
}

// ─── 3. Enmascaramiento de Datos Sensibles en Logs (PII & PHI Guard) ─────────

const SENSITIVE_KEYS = new Set([
  'password',
  'contraseña',
  'token',
  'apikey',
  'api_key',
  'secret',
  'authorization',
  'cookie',
  'cedula',
  'identificacion',
  'dni',
  'tarjeta',
  'cvv',
  'card',
]);

/**
 * Enmascara direcciones de correo electrónico para logs (ej. "j***@gmail.com").
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  const parts = email.split('@');
  if (parts.length !== 2) return '[EMAIL_PROTEGIDO]';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
  return `${maskedName}@${domain}`;
}

/**
 * Enmascara números telefónicos para logs (ej. "+505 **** 1234").
 */
export function maskPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  const cleaned = phone.trim();
  if (cleaned.length <= 4) return '****';
  return `****${cleaned.slice(-4)}`;
}

/**
 * Enmascara cédulas de identidad nicaragüenses u otros documentos (ej. "***-******-****X").
 */
export function maskIdNumber(id: string): string {
  if (!id || typeof id !== 'string') return '';
  const cleaned = id.trim();
  if (cleaned.length <= 4) return '****';
  return `***-******-${cleaned.slice(-4)}`;
}

/**
 * Sanitiza recursivamente objetos y valores para logs de servidor y cliente,
 * ocultando contraseñas, tokens, emails, teléfonos y datos médicos directos.
 */
export function maskPII<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Detectar y enmascarar emails en strings sueltos
    let masked = data.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (match) =>
      maskEmail(match)
    );
    // Detectar y enmascarar teléfonos (+505 o 8 dígitos)
    masked = masked.replace(/(?:\+?505)?\s*[2578]\d{7}/g, () => '[TELÉFONO_PROTEGIDO]');
    // Detectar y enmascarar números de cédula nicaragüense (ej: 001-120590-0004L)
    masked = masked.replace(/\b\d{3}-\d{6}-\d{4}[A-Za-z]\b/g, () => '[CÉDULA_PROTEGIDA]');
    return masked as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => maskPII(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const safeObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      // Si la clave representa un secreto o credencial directa
      if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('pass') || lowerKey.includes('secret') || lowerKey.includes('token')) {
        safeObj[key] = '[REDACTED]';
        continue;
      }

      // Si la clave representa un correo
      if (lowerKey.includes('email') || lowerKey.includes('correo')) {
        safeObj[key] = typeof value === 'string' ? maskEmail(value) : '[EMAIL_PROTEGIDO]';
        continue;
      }

      // Si la clave representa un teléfono
      if (lowerKey.includes('phone') || lowerKey.includes('telefono') || lowerKey.includes('tel')) {
        safeObj[key] = typeof value === 'string' ? maskPhone(value) : '[TELÉFONO_PROTEGIDO]';
        continue;
      }

      // Si la clave representa cédula o identificación
      if (lowerKey.includes('cedula') || lowerKey.includes('dni') || lowerKey.includes('identificacion')) {
        safeObj[key] = typeof value === 'string' ? maskIdNumber(value) : '[ID_PROTEGIDA]';
        continue;
      }

      safeObj[key] = maskPII(value);
    }
    return safeObj as T;
  }

  return data;
}

// ─── 4. Logger Seguro para Consola / Servidor (OWASP A09) ────────────────────

export const safeLogger = {
  info: (message: string, ...args: any[]) => {
    const maskedArgs = args.map((arg) => maskPII(arg));
    console.log(`[INFO] ${maskPII(message)}`, ...maskedArgs);
  },
  warn: (message: string, ...args: any[]) => {
    const maskedArgs = args.map((arg) => maskPII(arg));
    console.warn(`[WARN] ${maskPII(message)}`, ...maskedArgs);
  },
  error: (message: string, ...args: any[]) => {
    const maskedArgs = args.map((arg) => {
      if (arg instanceof Error) {
        return {
          name: arg.name,
          message: maskPII(arg.message),
        };
      }
      return maskPII(arg);
    });
    console.error(`[ERROR] ${maskPII(message)}`, ...maskedArgs);
  },
};

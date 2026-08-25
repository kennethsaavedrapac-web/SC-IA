/**
 * security.ts — Utilidades de seguridad y validación centralizadas
 * 
 * Módulo reutilizable para sanitización de entradas (prevención XSS),
 * validación de formatos y helpers de seguridad.
 */

// ─── Sanitización XSS ─────────────────────────────────────────────
/**
 * Escapa caracteres HTML peligrosos para prevenir ataques XSS.
 * Convierte: < > " ' & en sus entidades HTML equivalentes.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Combina trim + sanitización. Ideal para inputs de formulario antes de guardar.
 */
export function sanitizeAndTrim(input: string): string {
  if (!input) return '';
  return sanitizeInput(input.trim());
}

/**
 * Elimina tags HTML de una cadena (más agresivo que sanitizeInput).
 * Útil para campos que nunca deberían contener HTML.
 */
export function stripHtml(input: string): string {
  if (!input) return '';
  return input.replace(/<[^>]*>/g, '').trim();
}

// ─── Validaciones de formato ───────────────────────────────────────

/**
 * Valida formato de correo electrónico.
 * Compatible con la regex usada en LoginView y RegisterView.
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida longitud mínima de contraseña (6 caracteres, matching Supabase config).
 */
export function validatePassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 6;
}

/**
 * Calcula la fortaleza de una contraseña (0-4).
 * 0 = muy débil, 1 = débil, 2 = moderada, 3 = fuerte, 4 = muy fuerte
 */
export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

/**
 * Valida nombre de usuario (mínimo 3 caracteres, sin HTML).
 */
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { valid: false, error: 'required' };
  }
  const cleaned = stripHtml(name.trim());
  if (cleaned.length < 3) {
    return { valid: false, error: 'tooShort' };
  }
  if (cleaned.length > 100) {
    return { valid: false, error: 'tooLong' };
  }
  return { valid: true };
}

/**
 * Valida formato de número de teléfono (acepta formato internacional básico).
 */
export function validatePhone(phone: string): boolean {
  if (!phone || !phone.trim()) return true; // Campo opcional
  const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
  return phoneRegex.test(phone.trim());
}

/**
 * Valida que un código TOTP tenga exactamente 6 dígitos.
 */
export function validateTOTPCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

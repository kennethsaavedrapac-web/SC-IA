/**
 * Sanitización y Seguridad de Entrada de Datos
 * Previene XSS, inyecciones de código, caracteres de control y secuencias de escape maliciosas.
 */

/**
 * Escapa caracteres HTML peligrosos para prevenir ataques Cross-Site Scripting (XSS).
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  return input.replace(/[&<>"'`=\/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Limpia y normaliza texto eliminando etiquetas de script, null bytes y caracteres no imprimibles.
 */
export function sanitizeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str = String(value).trim();

  // Eliminar null bytes (\0) y caracteres de control ASCII (excepto tab y newline común si es necesario)
  str = str.replace(/\0/g, '').replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '');

  // Eliminar scripts y etiquetas de ejecución activa
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  str = str.replace(/javascript:/gi, '');
  str = str.replace(/data:text\/html/gi, '');
  str = str.replace(/vbscript:/gi, '');
  str = str.replace(/onload|onerror|onclick|onmouseover|eval\(/gi, '');

  return str.trim();
}

/**
 * Sanitiza valores de texto para uso seguro en prompts de IA o logs.
 */
export function sanitizeForAiPrompt(value: unknown, maxLength = 1000): string {
  if (!value) return '';
  const clean = sanitizeString(value)
    .replace(/[\n\r]+/g, ' ')
    .replace(/[<>{}[\]\\]/g, '');
  return clean.substring(0, maxLength).trim();
}

/**
 * Sanitiza recursivamente objetos y arrays de datos de entrada.
 */
export function sanitizeDeep<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }
  if (typeof input === 'string') {
    return sanitizeString(input) as unknown as T;
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeDeep(item)) as unknown as T;
  }
  if (typeof input === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      // Prevenir Prototype Pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      result[key] = sanitizeDeep(value);
    }
    return result as T;
  }
  return input;
}

/**
 * Input Validation and Sanitization
 * 
 * Security measures for medical data:
 *   - XSS prevention (strip HTML tags)
 *   - Field length limits
 *   - Type-safe validation for numeric fields
 *   - Blood type whitelist
 *   - Phone number format validation
 *   - Cédula format validation
 */

// ─── Sanitization ────────────────────────────────────────────────────

/**
 * Strip HTML tags to prevent XSS
 */
function stripHtml(str) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim();
}

/**
 * Sanitize a text field: strip HTML, limit length
 */
function sanitizeText(value, maxLength = 500) {
  if (value === null || value === undefined) return "";
  const cleaned = stripHtml(String(value));
  return cleaned.substring(0, maxLength);
}

// ─── Validators ──────────────────────────────────────────────────────

const VALID_BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/**
 * Validate the entire medical data form.
 * Returns { valid: true, sanitized: {...} } or { valid: false, errors: [...] }
 */
export function validateMedicalData(data) {
  const errors = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Los datos médicos son inválidos o están vacíos."] };
  }

  // Sanitize all text fields
  const sanitized = {
    enfermedades: sanitizeText(data.enfermedades),
    alergias: sanitizeText(data.alergias),
    tipoSangre: sanitizeText(data.tipoSangre, 5),
    tratamientos: sanitizeText(data.tratamientos),
    pastillas: sanitizeText(data.pastillas),
    vacunas: sanitizeText(data.vacunas),
    peso: sanitizeText(data.peso, 10),
    altura: sanitizeText(data.altura, 10),
    cedula: sanitizeText(data.cedula, 30),
    contactoEmergencia: sanitizeText(data.contactoEmergencia, 30),
  };

  // Validate blood type (if provided)
  if (sanitized.tipoSangre && !VALID_BLOOD_TYPES.includes(sanitized.tipoSangre)) {
    errors.push(`Tipo de sangre inválido: "${sanitized.tipoSangre}". Valores permitidos: ${VALID_BLOOD_TYPES.join(", ")}`);
  }

  // Validate weight (if provided)
  if (sanitized.peso) {
    const peso = parseFloat(sanitized.peso);
    if (isNaN(peso) || peso < 1 || peso > 500) {
      errors.push("El peso debe ser un número entre 1 y 500 kg.");
    }
  }

  // Validate height (if provided)
  if (sanitized.altura) {
    const altura = parseFloat(sanitized.altura);
    if (isNaN(altura) || altura < 30 || altura > 300) {
      errors.push("La altura debe ser un número entre 30 y 300 cm.");
    }
  }

  // Validate phone (if provided) — accept digits, spaces, dashes, plus, parens
  if (sanitized.contactoEmergencia) {
    const phoneRegex = /^[+\d\s\-()]{6,25}$/;
    if (!phoneRegex.test(sanitized.contactoEmergencia)) {
      errors.push("El número de teléfono de emergencia tiene un formato inválido.");
    }
  }

  // Validate cédula (if provided) — flexible format for Nicaragua
  if (sanitized.cedula) {
    // Accept: 001-010190-0001A, 0010101900001A, or simple alphanumeric
    const cedulaRegex = /^[A-Za-z0-9\-]{5,25}$/;
    if (!cedulaRegex.test(sanitized.cedula)) {
      errors.push("La cédula de identidad tiene un formato inválido.");
    }
  }

  // At least one field should have data
  const hasAnyData = Object.values(sanitized).some((v) => v && v.trim().length > 0);
  if (!hasAnyData) {
    errors.push("Debe completar al menos un campo de datos médicos.");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, sanitized };
}

/**
 * Validate user context (userId, name, etc.)
 */
export function validateUserContext(userContext) {
  if (!userContext || typeof userContext !== "object") {
    return { valid: false, error: "Contexto de usuario inválido." };
  }

  const sanitizedContext = {
    userId: sanitizeText(userContext.userId, 100),
    nombre: sanitizeText(userContext.nombre, 200),
    email: sanitizeText(userContext.email, 200),
    ciudad: sanitizeText(userContext.ciudad, 100),
    pais: sanitizeText(userContext.pais, 100),
  };

  return { valid: true, sanitized: sanitizedContext };
}

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

  const fieldLimits = {
    enfermedades: 500,
    alergias: 500,
    tipoSangre: 3,
    tratamientos: 500,
    pastillas: 500,
    vacunas: 500,
    peso: 10,
    altura: 10,
    cedula: 16,
    contactoEmergencia: 20,
  };
  for (const [field, maxLength] of Object.entries(fieldLimits)) {
    const value = data[field];
    if (value !== undefined && value !== null && typeof value !== "string") {
      errors.push(`El campo ${field} debe ser texto.`);
    } else if (typeof value === "string" && value.length > maxLength) {
      errors.push(`El campo ${field} no puede exceder ${maxLength} caracteres.`);
    }
  }

  // Sanitize all text fields
  const sanitized = {
    enfermedades: sanitizeText(data.enfermedades),
    alergias: sanitizeText(data.alergias),
    tipoSangre: sanitizeText(data.tipoSangre, 3),
    tratamientos: sanitizeText(data.tratamientos),
    pastillas: sanitizeText(data.pastillas),
    vacunas: sanitizeText(data.vacunas),
    peso: sanitizeText(data.peso, 10),
    altura: sanitizeText(data.altura, 10),
    cedula: sanitizeText(data.cedula, 30),
    contactoEmergencia: sanitizeText(data.contactoEmergencia, 20),
  };

  // Validate blood type (if provided)
  if (sanitized.tipoSangre && !VALID_BLOOD_TYPES.includes(sanitized.tipoSangre)) {
    errors.push(`Tipo de sangre inválido: "${sanitized.tipoSangre}". Valores permitidos: ${VALID_BLOOD_TYPES.join(", ")}`);
  }

  // Validate weight (if provided)
  if (sanitized.peso) {
    const normalizedPeso = sanitized.peso.replace(",", ".");
    const peso = Number(normalizedPeso);
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(sanitized.peso) || !Number.isFinite(peso) || peso < 1 || peso > 500) {
      errors.push("El peso debe ser un número entre 1 y 500 kg.");
    }
  }

  // Validate height (if provided)
  if (sanitized.altura) {
    const normalizedAltura = sanitized.altura.replace(",", ".");
    const altura = Number(normalizedAltura);
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(sanitized.altura) || !Number.isFinite(altura) || altura < 30 || altura > 300) {
      errors.push("La altura debe ser un número entre 30 y 300 cm.");
    }
  }

  // Validate phone (if provided) — accept digits, spaces, dashes, plus, parens
  if (sanitized.contactoEmergencia) {
    const phone = sanitized.contactoEmergencia;
    const phoneRegex = /^\+?[\d][\d\s()\-]*$/;
    const digitCount = phone.replace(/\D/g, "").length;
    if (!phoneRegex.test(phone) || digitCount < 7 || digitCount > 15) {
      errors.push("El teléfono de emergencia debe tener entre 7 y 15 dígitos.");
    }
  }

  // Nicaraguan cédula: 3 digits, hyphen, 6 digits, hyphen, 4 digits, uppercase letter.
  if (sanitized.cedula) {
    const cedulaRegex = /^\d{3}-\d{6}-\d{4}[A-Z]$/;
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

  const contextLimits = { userId: 100, nombre: 100, email: 254, ciudad: 100, pais: 100 };
  for (const [field, maxLength] of Object.entries(contextLimits)) {
    const value = userContext[field];
    if (value !== undefined && value !== null && typeof value !== "string") {
      return { valid: false, error: `El campo ${field} debe ser texto.` };
    }
    if (typeof value === "string" && value.length > maxLength) {
      return { valid: false, error: `El campo ${field} no puede exceder ${maxLength} caracteres.` };
    }
  }

  if (userContext.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userContext.email.trim())) {
    return { valid: false, error: "El correo del perfil tiene un formato inválido." };
  }

  const sanitizedContext = {
    userId: sanitizeText(userContext.userId, 100),
    nombre: sanitizeText(userContext.nombre, 100),
    email: sanitizeText(userContext.email, 254),
    ciudad: sanitizeText(userContext.ciudad, 100),
    pais: sanitizeText(userContext.pais, 100),
  };

  return { valid: true, sanitized: sanitizedContext };
}

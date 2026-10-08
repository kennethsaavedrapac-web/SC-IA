/**
 * FHIR Service — Frontend Client
 * 
 * Abstracts communication with /api/fhir and /api/fhir-get endpoints.
 * Handles errors gracefully and provides fallback to localStorage.
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface MedicalFormData {
  enfermedades: string;
  alergias: string;
  tipoSangre: string;
  tratamientos: string;
  pastillas: string;
  vacunas: string;
  peso: string;
  altura: string;
  cedula: string;
  contactoEmergencia: string;
}

export interface FhirSaveResult {
  success: boolean;
  message: string;
  patientId?: string;
  resourceCount?: number;
  source: "fhir" | "localStorage";
}

export interface FhirLoadResult {
  found: boolean;
  data: MedicalFormData | null;
  source: "fhir" | "localStorage";
  patientId?: string;
}

const VALID_BLOOD_TYPES = new Set(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
const CEDULA_REGEX = /^\d{3}-\d{6}-\d{4}[A-Z]$/;

/** Client-side guard so invalid values never enter the local cache as a fallback. */
export function validateMedicalFormData(data: MedicalFormData): string | null {
  const limits: Record<keyof MedicalFormData, number> = {
    enfermedades: 500, alergias: 500, tipoSangre: 3, tratamientos: 500,
    pastillas: 500, vacunas: 500, peso: 10, altura: 10, cedula: 16,
    contactoEmergencia: 20,
  };
  for (const [field, maxLength] of Object.entries(limits) as [keyof MedicalFormData, number][]) {
    const value = data[field];
    if (typeof value !== "string") return `El campo ${field} debe ser texto.`;
    if (value.length > maxLength) return `El campo ${field} no puede exceder ${maxLength} caracteres.`;
  }
  if (data.tipoSangre && !VALID_BLOOD_TYPES.has(data.tipoSangre)) return "Selecciona un tipo de sangre válido.";
  if (data.cedula && !CEDULA_REGEX.test(data.cedula.trim().toUpperCase())) return "La cédula debe tener el formato 000-000000-0000A.";

  for (const [field, value, min, max, unit] of [
    ["peso", data.peso, 1, 500, "kg"],
    ["altura", data.altura, 30, 300, "cm"],
  ] as const) {
    if (!value) continue;
    const numericValue = Number(value.replace(",", "."));
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(value) || !Number.isFinite(numericValue) || numericValue < min || numericValue > max) {
      return `El campo ${field} debe ser un número entre ${min} y ${max} ${unit}.`;
    }
  }

  if (data.contactoEmergencia) {
    const phone = data.contactoEmergencia.trim();
    const digits = phone.replace(/\D/g, "");
    if (phone.length > 20 || !/^\+?[\d][\d\s()\-]*$/.test(phone) || digits.length < 7 || digits.length > 15) {
      return "El teléfono de emergencia debe tener entre 7 y 15 dígitos.";
    }
  }
  return null;
}

// ─── Constants ───────────────────────────────────────────────────────

const LOCAL_STORAGE_KEY_PREFIX = "medicalData_";
const FHIR_SAVE_ENDPOINT = "/api/fhir";
const FHIR_GET_ENDPOINT = "/api/fhir-get";
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

// ─── Helpers ─────────────────────────────────────────────────────────

function getLocalStorageKey(userId: string): string {
  return `${LOCAL_STORAGE_KEY_PREFIX}${userId || "guest"}`;
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Save ────────────────────────────────────────────────────────────

/**
 * Save medical data to FHIR Store via backend.
 * Falls back to localStorage on failure.
 */
export async function saveMedicalData(
  data: MedicalFormData,
  userId: string,
  userContext?: {
    nombre?: string;
    email?: string;
    ciudad?: string;
    pais?: string;
  }
): Promise<FhirSaveResult> {
  const normalizedData = { ...data, cedula: data.cedula.trim().toUpperCase() };
  const validationError = validateMedicalFormData(normalizedData);
  if (validationError) throw new Error(validationError);

  // Always save to localStorage as cache/fallback
  try {
    localStorage.setItem(getLocalStorageKey(userId), JSON.stringify(normalizedData));
  } catch (e) {
    console.warn("[FHIR Service] localStorage save failed:", e);
  }

  // Attempt FHIR save
  try {
    const response = await fetchWithTimeout(FHIR_SAVE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medicalData: normalizedData,
        userContext: {
          userId,
          nombre: userContext?.nombre || "",
          email: userContext?.email || "",
          ciudad: userContext?.ciudad || "",
          pais: userContext?.pais || "",
        },
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log("[FHIR Service] ✅ Saved to FHIR Store:", result.patientId);
      return {
        success: true,
        message: "Datos médicos guardados de forma segura en la nube (FHIR).",
        patientId: result.patientId,
        resourceCount: result.resourceCount,
        source: "fhir",
      };
    }

    // Backend returned an error
    console.warn("[FHIR Service] Backend error:", result.error || result.details);
    return {
      success: true, // Data is in localStorage
      message: result.error || "Error al guardar en la nube. Datos guardados localmente.",
      source: "localStorage",
    };
  } catch (error: any) {
    // Network error / timeout
    const isAbort = error.name === "AbortError";
    console.error("[FHIR Service] Save failed:", isAbort ? "Timeout" : error.message);

    return {
      success: true, // Data is in localStorage
      message: isAbort
        ? "Tiempo de espera agotado. Datos guardados localmente."
        : "Sin conexión al servidor. Datos guardados localmente.",
      source: "localStorage",
    };
  }
}

// ─── Load ────────────────────────────────────────────────────────────

/**
 * Load medical data from FHIR Store, falling back to localStorage.
 */
export async function loadMedicalData(
  cedula: string,
  userId: string
): Promise<FhirLoadResult> {
  // Try FHIR first (if we have a cédula)
  if (cedula && cedula.trim().length >= 3) {
    try {
      const response = await fetchWithTimeout(
        `${FHIR_GET_ENDPOINT}?cedula=${encodeURIComponent(cedula.trim())}`,
        { method: "GET", headers: { Accept: "application/json" } },
        15000 // 15s timeout for read
      );

      const result = await response.json();

      if (response.ok && result.found && result.data) {
        console.log("[FHIR Service] ✅ Loaded from FHIR Store:", result.patientId);

        // Also update localStorage cache
        try {
          localStorage.setItem(getLocalStorageKey(userId), JSON.stringify(result.data));
        } catch (e) {
          // ignore
        }

        return {
          found: true,
          data: result.data,
          source: "fhir",
          patientId: result.patientId,
        };
      }
    } catch (error: any) {
      console.warn("[FHIR Service] FHIR load failed, falling back to localStorage:", error.message);
    }
  }

  // Fallback: localStorage
  try {
    const cached = localStorage.getItem(getLocalStorageKey(userId));
    if (cached) {
      const data = JSON.parse(cached) as MedicalFormData;
      return {
        found: true,
        data,
        source: "localStorage",
      };
    }
  } catch (e) {
    console.warn("[FHIR Service] localStorage load failed:", e);
  }

  // Nothing found anywhere
  return {
    found: false,
    data: null,
    source: "localStorage",
  };
}

// ─── Default empty form ──────────────────────────────────────────────

export function getEmptyMedicalForm(): MedicalFormData {
  return {
    enfermedades: "",
    alergias: "",
    tipoSangre: "",
    tratamientos: "",
    pastillas: "",
    vacunas: "",
    peso: "",
    altura: "",
    cedula: "",
    contactoEmergencia: "",
  };
}

import { z } from 'zod';
import { sanitizeString } from './sanitize';

/**
 * Transformador sanitizador Zod para strings seguros y sin espacios residuales.
 */
export const safeString = (min = 1, max = 255) =>
  z.string()
    .trim()
    .min(min, { message: `Debe contener al menos ${min} caracter(es)` })
    .max(max, { message: `No puede exceder ${max} caracteres` })
    .transform((val) => sanitizeString(val));

export const optionalSafeString = (max = 500) =>
  z.string()
    .max(max, { message: `No puede exceder ${max} caracteres` })
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeString(val) : ''));

/**
 * Expresiones regulares seguras
 */
export const REGEX = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE_NI: /^(\+?505)?[2578]\d{7}$/, // Formato Nicaragua
  NAME: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]{2,100}$/,
  TOTP_CODE: /^\d{6}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  BLOOD_TYPE: /^(A|B|AB|O)[+-]$/,
};

// ==============================================================================
// 1. ESQUEMAS DE AUTENTICACIÓN
// ==============================================================================

export const authLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(5, { message: 'El correo electrónico es requerido' })
    .max(254, { message: 'El correo excede la longitud máxima permitida' })
    .regex(REGEX.EMAIL, { message: 'Formato de correo electrónico inválido' })
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    .max(128, { message: 'La contraseña es demasiado larga (máx. 128)' }),
  totpCode: z
    .string()
    .regex(REGEX.TOTP_CODE, { message: 'El código 2FA debe ser de 6 dígitos numéricos' })
    .optional()
    .nullable(),
});

export const authRegisterSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, { message: 'El nombre debe tener al menos 3 caracteres' })
    .max(100, { message: 'El nombre no puede superar 100 caracteres' })
    .regex(REGEX.NAME, { message: 'El nombre solo puede contener letras y espacios válidos' })
    .transform((val) => sanitizeString(val)),
  email: z
    .string()
    .trim()
    .min(5, { message: 'El correo electrónico es requerido' })
    .max(254, { message: 'El correo excede la longitud máxima permitida' })
    .regex(REGEX.EMAIL, { message: 'Formato de correo electrónico inválido' })
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    .max(128, { message: 'La contraseña es demasiado larga (máx. 128)' }),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.confirmPassword !== undefined && data.confirmPassword !== data.password) {
    return false;
  }
  return true;
}, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// ==============================================================================
// 2. ESQUEMAS DE PERFIL DE USUARIO
// ==============================================================================

export const userProfileUpdateSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(100, { message: 'El nombre no puede superar 100 caracteres' })
    .regex(REGEX.NAME, { message: 'El nombre contiene caracteres inválidos' })
    .transform((val) => sanitizeString(val))
    .optional(),
  avatar_url: z
    .string()
    .url({ message: 'URL de avatar inválida' })
    .max(500)
    .optional()
    .nullable(),
  ciudad: safeString(2, 100).optional(),
  pais: safeString(2, 100).optional(),
  sexo: z.string().optional().nullable(),
  fecha_nacimiento: z.string().optional().nullable(),
  emergencyPhone: z
    .string()
    .trim()
    .max(30, { message: 'El teléfono no puede exceder 30 caracteres' })
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeString(val) : '')),
  bloodType: z
    .string()
    .regex(REGEX.BLOOD_TYPE, { message: 'Tipo de sangre inválido (Ej: O+, A+, B-, AB+)' })
    .optional()
    .nullable()
    .or(z.literal('')),
  healthConditions: z.array(z.string().max(100).transform((val) => sanitizeString(val))).optional(),
});

// ==============================================================================
// 3. ESQUEMAS DE REGISTROS Y DATOS MÉDICOS (FHIR / CLINICAL)
// ==============================================================================

export const medicalRecordSchema = z.object({
  patient_id: z.string().uuid({ message: 'ID de paciente inválido' }).optional(),
  doctor_id: z.string().uuid({ message: 'ID de médico inválido' }).optional().nullable(),
  diagnostico: safeString(3, 1000),
  sintomas: safeString(3, 2000),
  tratamiento: optionalSafeString(2000),
  notas_clinicas: optionalSafeString(3000),
  tipo_sangre: z.string().regex(REGEX.BLOOD_TYPE, { message: 'Tipo de sangre inválido' }).optional().nullable().or(z.literal('')),
  alergias: optionalSafeString(1000),
  enfermedades_cronicas: optionalSafeString(1000),
});

export const fhirMedicalFormSchema = z.object({
  cedula: z.string().trim().min(3).max(30).transform((val) => sanitizeString(val)),
  enfermedades: optionalSafeString(1000),
  alergias: optionalSafeString(1000),
  tipoSangre: z.string().max(10).optional().nullable(),
  contactoEmergencia: optionalSafeString(150),
  telefonoEmergencia: optionalSafeString(50),
  seguroMedico: optionalSafeString(100),
});

// ==============================================================================
// 4. ESQUEMAS DE CITAS MÉDICAS
// ==============================================================================

export const appointmentSchema = z.object({
  patient_id: z.string().uuid({ message: 'ID de paciente debe ser un UUID válido' }).optional(),
  doctor_id: z.string().uuid({ message: 'ID de médico debe ser un UUID válido' }).optional().nullable(),
  center_id: safeString(1, 100),
  fecha_cita: z.string().datetime({ message: 'La fecha de la cita debe estar en formato ISO 8601' }),
  motivo: safeString(5, 500),
  estado: z.enum(['pendiente', 'confirmada', 'completada', 'cancelada']).default('pendiente'),
  notas_especialista: optionalSafeString(1000),
});

// ==============================================================================
// 5. ESQUEMAS DE TRIAJE VIRTUAL (CHAT IA)
// ==============================================================================

export const chatMessageTurnSchema = z.object({
  role: z.enum(['user', 'model', 'system']).or(z.enum(['user', 'assistant'])),
  text: z.string().max(4000).transform((val) => sanitizeString(val)),
  content: z.string().max(4000).optional().transform((val) => (val ? sanitizeString(val) : '')),
});

export const chatTriageRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, { message: 'El mensaje de síntomas es obligatorio' })
    .max(2000, { message: 'El mensaje excede el límite máximo de 2000 caracteres' })
    .transform((val) => sanitizeString(val)),
  history: z.array(z.any()).max(30, { message: 'El historial no puede superar 30 turnos' }).optional().default([]),
  userProfile: z
    .object({
      id: z.string().optional(),
      name: z.string().max(100).optional(),
      city: z.string().max(100).optional(),
      healthConditions: z.array(z.string().max(100)).optional(),
    })
    .optional()
    .nullable(),
});

// ==============================================================================
// 6. ESQUEMAS DE AUTENTICACIÓN 2FA / MFA (TOTP)
// ==============================================================================

export const totpVerifySchema = z.object({
  token: z
    .string()
    .trim()
    .regex(REGEX.TOTP_CODE, { message: 'El código TOTP debe tener exactamente 6 dígitos numéricos' }),
  secret: z.string().min(16).max(128).optional(),
});

export const totpLoginVerifySchema = z.object({
  tempToken: safeString(10, 500),
  totpCode: z
    .string()
    .trim()
    .regex(REGEX.TOTP_CODE, { message: 'El código TOTP debe tener exactamente 6 dígitos numéricos' }),
});

export const totpDisableSchema = z.object({
  password: z.string().min(6, { message: 'Se requiere la contraseña para desactivar 2FA' }),
  totpCode: z.string().regex(REGEX.TOTP_CODE, { message: 'Código TOTP de 6 dígitos requerido' }),
});

// ==============================================================================
// 7. ESQUEMAS DE GESTIÓN ADMINISTRATIVA
// ==============================================================================

export const adminAnnouncementSchema = z.object({
  titulo: safeString(3, 200),
  contenido: safeString(5, 5000),
  tipo: z.enum(['info', 'alerta', 'emergencia', 'mantenimiento']).default('info'),
  activo: z.boolean().default(true),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Formato de fecha YYYY-MM-DD' }).optional(),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Formato de fecha YYYY-MM-DD' }).optional(),
});

export const appSettingsSchema = z.object({
  clave: safeString(2, 100),
  valor: z.record(z.string(), z.any()),
  descripcion: optionalSafeString(500),
});

/**
 * Tipo discriminado para resultados de validación síncrona
 */
export type ValidationResult<T> =
  | { success: true; data: T; error?: never; message?: never; errors?: never }
  | { success: false; errors: Record<string, string>; message: string; data?: never };

/**
 * Función utilitaria para validación síncrona en componentes de cliente / React
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || 'root';
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  const firstErrorMsg = result.error.issues[0]?.message || 'Datos de formulario inválidos';
  return { success: false, errors, message: firstErrorMsg };
}

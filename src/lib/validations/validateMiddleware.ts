import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sanitizeDeep } from './sanitize';

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

export interface ValidationErrorResponse {
  success: false;
  error: string;
  statusCode: 400;
  details: ValidationErrorDetail[];
  timestamp: string;
}

/**
 * Middleware de Express reutilizable para validación estricta de esquemas Zod y sanitización.
 * @param schema Esquema Zod a evaluar
 * @param target 'body' | 'query' | 'params'
 */
export function validateRequest(schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawData = req[target];
      // Sanitizar datos brutos antes de parsear
      const sanitizedData = sanitizeDeep(rawData);

      const parsed = schema.safeParse(sanitizedData);

      if (!parsed.success) {
        const errorDetails: ValidationErrorDetail[] = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.') || 'root',
          message: issue.message,
          code: issue.code,
        }));

        const response: ValidationErrorResponse = {
          success: false,
          error: errorDetails[0]?.message || 'Error de validación en los datos enviados.',
          statusCode: 400,
          details: errorDetails,
          timestamp: new Date().toISOString(),
        };

        return res.status(400).json(response);
      }

      // Reemplazar target con los datos validados y transformados por Zod
      req[target] = parsed.data;
      return next();
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: 'Entrada de datos malformada o inválida.',
        statusCode: 400,
        details: [{ field: target, message: err?.message || 'Error desconocido de parseo', code: 'parse_error' }],
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * Helper para validar objetos en rutas o funciones asíncronas de servidor
 */
export function validateOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  const sanitized = sanitizeDeep(data);
  return schema.parse(sanitized);
}

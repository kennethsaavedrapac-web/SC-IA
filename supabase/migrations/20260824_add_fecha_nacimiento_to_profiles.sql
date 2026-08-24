-- ==============================================================================
-- Migración: Agregar columnas fecha_nacimiento y sexo a la tabla profiles
-- ==============================================================================

-- 1. Agregar columnas si no existen
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS fecha_nacimiento text,
ADD COLUMN IF NOT EXISTS sexo text;

-- 2. Refrescar el schema cache de PostgREST
NOTIFY pgrst, 'reload schema';

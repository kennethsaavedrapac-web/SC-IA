-- Permite guardar el sexo seleccionado desde la sección de información personal.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS sexo text;

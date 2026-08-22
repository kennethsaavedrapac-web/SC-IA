-- ==============================================================================
-- SALUD-CONECTA IA: MIGRACIÓN DE SEGURIDAD RLS Y CONTROL DE ACCESO BASADO EN ROLES (RBAC)
-- Archivo: 20260822_rls_rbac_security_hardening.sql
-- Descripción:
--   1. Definición de tipos de roles y tablas centrales si no existen.
--   2. Funciones de seguridad con SECURITY DEFINER para verificación de roles.
--   3. Habilitación de Row Level Security (RLS) en todas las tablas sensibles.
--   4. Políticas RLS estrictas para Pacientes, Médicos/Especialistas y Administradores.
--   5. Soporte para 2FA/MFA y persistencia blindada.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONES Y ENUMS DE ROLES
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Rol de usuario: paciente, medico, especialista, admin, superadmin
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('paciente', 'medico', 'especialista', 'admin', 'superadmin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. TABLAS DEL SISTEMA CON ESQUEMA ROBUSTO
-- ------------------------------------------------------------------------------

-- Tabla de perfiles de usuario (vinculada a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE,
    provider VARCHAR(50) DEFAULT 'email',
    avatar_url TEXT,
    ciudad VARCHAR(100) DEFAULT 'Granada',
    pais VARCHAR(100) DEFAULT 'Nicaragua',
    role user_role_enum DEFAULT 'paciente' NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE NOT NULL,
    mfa_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    mfa_secret TEXT, -- Almacenado encriptado o gestionado via API
    mfa_backup_codes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de asignación de roles y permisos granulares (RBAC extendido)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role user_role_enum NOT NULL,
    assigned_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

-- Tabla de registros médicos / expedientes clínicos
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    diagnostico TEXT NOT NULL,
    sintomas TEXT NOT NULL,
    tratamiento TEXT,
    notas_clinicas TEXT,
    tipo_sangre VARCHAR(10),
    alergias TEXT,
    enfermedades_cronicas TEXT,
    fecha_registro TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de citas médicas
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    center_id VARCHAR(100),
    fecha_cita TIMESTAMPTZ NOT NULL,
    motivo VARCHAR(500) NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
    notas_especialista TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de historial de triajes inteligentes
CREATE TABLE IF NOT EXISTS public.triage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sintomas TEXT NOT NULL,
    prioridad VARCHAR(50) NOT NULL,
    recomendaciones TEXT,
    respuesta_ia TEXT,
    centro_referencia_sugerido VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Logs de auditoría y chat
CREATE TABLE IF NOT EXISTS public.chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    message_length INTEGER NOT NULL,
    ip_hash VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Configuración global de la aplicación (solo lectura para usuarios, edición para admins)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor JSONB NOT NULL,
    descripcion TEXT,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Anuncios y alertas del sistema
CREATE TABLE IF NOT EXISTS public.admin_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'info' CHECK (tipo IN ('info', 'alerta', 'emergencia', 'mantenimiento')),
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    fecha_fin DATE DEFAULT CURRENT_DATE + INTERVAL '30 days',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Centros de salud y sobreescrituras
CREATE TABLE IF NOT EXISTS public.health_center_overrides (
    center_id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    municipality VARCHAR(100),
    phone VARCHAR(50),
    schedule VARCHAR(255),
    emergency_24h BOOLEAN DEFAULT FALSE,
    coordinates JSONB,
    services JSONB,
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Suscripciones Web Push seguras
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    auth TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_endpoint UNIQUE (user_id, endpoint)
);

-- Factores MFA y tokens temporales
CREATE TABLE IF NOT EXISTS public.user_mfa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    secret TEXT NOT NULL,
    qr_uri TEXT,
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    temp_challenge_token TEXT,
    temp_challenge_expires TIMESTAMPTZ,
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. FUNCIONES DE SEGURIDAD RBAC (SECURITY DEFINER)
-- ------------------------------------------------------------------------------

-- Función para obtener el rol del usuario autenticado de forma segura
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role_enum
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    v_role user_role_enum;
BEGIN
    -- Primero verifica si existe en profiles
    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_role IS NOT NULL THEN
        RETURN v_role;
    END IF;

    -- Por defecto devuelve paciente
    RETURN 'paciente'::user_role_enum;
END;
$$;

-- Función para verificar si el usuario es Administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    -- Comprobar si el usuario tiene rol admin o superadmin en profiles o en user_roles
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'superadmin')
    ) OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'superadmin')
    );
END;
$$;

-- Función para verificar si el usuario es Personal Médico o Especialista
CREATE OR REPLACE FUNCTION public.is_medical_staff()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('medico', 'especialista', 'admin', 'superadmin')
    ) OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('medico', 'especialista', 'admin', 'superadmin')
    );
END;
$$;

-- Trigger automático para crear perfil cuando se registra un nuevo usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        nombre,
        email,
        provider,
        avatar_url,
        ciudad,
        pais,
        role
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.raw_user_meta_data->>'full_name', 'Usuario'),
        NEW.email,
        COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'ciudad', 'Granada'),
        COALESCE(NEW.raw_user_meta_data->>'pais', 'Nicaragua'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role_enum, 'paciente'::user_role_enum)
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 4. HABILITACIÓN DE ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.triage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_center_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mfa ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 5. POLÍTICAS RLS: PROFILES (PERFILES DE USUARIO)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        id = auth.uid() 
        OR public.is_admin() 
        OR public.is_medical_staff()
    );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR public.is_admin())
    WITH CHECK (
        id = auth.uid() OR public.is_admin()
    );

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. POLÍTICAS RLS: MEDICAL_RECORDS (REGISTROS MÉDICOS)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "medical_records_select_policy" ON public.medical_records;
CREATE POLICY "medical_records_select_policy"
    ON public.medical_records FOR SELECT
    TO authenticated
    USING (
        -- Pacientes solo ven sus propios registros
        patient_id = auth.uid()
        -- Personal médico asignado ve registros de sus pacientes
        OR doctor_id = auth.uid()
        -- Administradores con acceso clínico autorizado
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "medical_records_insert_policy" ON public.medical_records;
CREATE POLICY "medical_records_insert_policy"
    ON public.medical_records FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Pacientes pueden registrar datos de su propio formulario inicial
        patient_id = auth.uid()
        -- Médicos pueden crear registros para sus pacientes
        OR public.is_medical_staff()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "medical_records_update_policy" ON public.medical_records;
CREATE POLICY "medical_records_update_policy"
    ON public.medical_records FOR UPDATE
    TO authenticated
    USING (
        doctor_id = auth.uid()
        OR patient_id = auth.uid()
        OR public.is_admin()
    )
    WITH CHECK (
        doctor_id = auth.uid()
        OR patient_id = auth.uid()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "medical_records_delete_policy" ON public.medical_records;
CREATE POLICY "medical_records_delete_policy"
    ON public.medical_records FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. POLÍTICAS RLS: APPOINTMENTS (CITAS MÉDICAS)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "appointments_select_policy" ON public.appointments;
CREATE POLICY "appointments_select_policy"
    ON public.appointments FOR SELECT
    TO authenticated
    USING (
        patient_id = auth.uid()
        OR doctor_id = auth.uid()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "appointments_insert_policy" ON public.appointments;
CREATE POLICY "appointments_insert_policy"
    ON public.appointments FOR INSERT
    TO authenticated
    WITH CHECK (
        patient_id = auth.uid()
        OR public.is_medical_staff()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "appointments_update_policy" ON public.appointments;
CREATE POLICY "appointments_update_policy"
    ON public.appointments FOR UPDATE
    TO authenticated
    USING (
        patient_id = auth.uid()
        OR doctor_id = auth.uid()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "appointments_delete_policy" ON public.appointments;
CREATE POLICY "appointments_delete_policy"
    ON public.appointments FOR DELETE
    TO authenticated
    USING (
        patient_id = auth.uid()
        OR public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 8. POLÍTICAS RLS: TRIAGE_RECORDS & CHAT_LOGS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "triage_select_policy" ON public.triage_records;
CREATE POLICY "triage_select_policy"
    ON public.triage_records FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR public.is_medical_staff()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "triage_insert_policy" ON public.triage_records;
CREATE POLICY "triage_insert_policy"
    ON public.triage_records FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        OR user_id IS NULL
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "chat_logs_insert_policy" ON public.chat_logs;
CREATE POLICY "chat_logs_insert_policy"
    ON public.chat_logs FOR INSERT
    TO authenticated, anon
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "chat_logs_select_admin" ON public.chat_logs;
CREATE POLICY "chat_logs_select_admin"
    ON public.chat_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 9. POLÍTICAS RLS: APP_SETTINGS & ANUNCIOS & CENTROS DE SALUD
-- ------------------------------------------------------------------------------
-- Configuración: Lectura pública, modificación solo Admin
DROP POLICY IF EXISTS "app_settings_read_all" ON public.app_settings;
CREATE POLICY "app_settings_read_all"
    ON public.app_settings FOR SELECT
    TO authenticated, anon
    USING (TRUE);

DROP POLICY IF EXISTS "app_settings_admin_all" ON public.app_settings;
CREATE POLICY "app_settings_admin_all"
    ON public.app_settings FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Anuncios: Lectura pública de anuncios activos, gestión solo Admin
DROP POLICY IF EXISTS "announcements_read_active" ON public.admin_announcements;
CREATE POLICY "announcements_read_active"
    ON public.admin_announcements FOR SELECT
    TO authenticated, anon
    USING (activo = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "announcements_admin_all" ON public.admin_announcements;
CREATE POLICY "announcements_admin_all"
    ON public.admin_announcements FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Centros de salud: Lectura general, gestión solo Administradores
DROP POLICY IF EXISTS "health_centers_read_all" ON public.health_center_overrides;
CREATE POLICY "health_centers_read_all"
    ON public.health_center_overrides FOR SELECT
    TO authenticated, anon
    USING (TRUE);

DROP POLICY IF EXISTS "health_centers_admin_all" ON public.health_center_overrides;
CREATE POLICY "health_centers_admin_all"
    ON public.health_center_overrides FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 10. POLÍTICAS RLS: PUSH_SUBSCRIPTIONS & USER_MFA
-- ------------------------------------------------------------------------------
-- Push Subscriptions: Solo el propio usuario gestiona su suscripción
DROP POLICY IF EXISTS "push_subscriptions_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_own"
    ON public.push_subscriptions FOR ALL
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- User MFA: Acceso estrictamente restringido al propio usuario y servicio backend
DROP POLICY IF EXISTS "user_mfa_own_access" ON public.user_mfa;
CREATE POLICY "user_mfa_own_access"
    ON public.user_mfa FOR ALL
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Permiso para inserción anónima durante proceso de validación temporal
DROP POLICY IF EXISTS "user_mfa_anon_challenge" ON public.user_mfa;
CREATE POLICY "user_mfa_anon_challenge"
    ON public.user_mfa FOR SELECT
    TO anon
    USING (temp_challenge_token IS NOT NULL AND temp_challenge_expires > NOW());

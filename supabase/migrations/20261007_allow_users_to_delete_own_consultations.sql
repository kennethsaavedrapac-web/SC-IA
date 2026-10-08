-- Permite a cada usuario borrar sus propias consultas guardadas.
DO $$
BEGIN
    IF to_regclass('public.consultations') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "consultations_delete_own" ON public.consultations';
        EXECUTE 'CREATE POLICY "consultations_delete_own"
            ON public.consultations FOR DELETE
            TO authenticated
            USING (user_id = auth.uid())';
    END IF;
END
$$;

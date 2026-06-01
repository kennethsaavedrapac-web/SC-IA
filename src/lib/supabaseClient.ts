import { createClient } from '@supabase/supabase-js';

// ⚠️ Puedes pegar tus credenciales reales directamente aquí adentro de las comillas:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://TU_PROYECTO.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "TU_CLAVE_ANONIMA";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ Supabase: Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
    'Verifica tu archivo .env'
  );
}

// Proveemos valores de respaldo (placeholders) para evitar que la app 
// colapse con un "Uncaught Error" si faltan las variables en producción.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true, // Necesario para OAuth redirects
    },
  }
);

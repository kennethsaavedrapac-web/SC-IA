import { createClient } from '@supabase/supabase-js';

const isNode = typeof process !== 'undefined' && process.env != null;

const supabaseUrl = (isNode ? process.env.VITE_SUPABASE_URL : import.meta.env.VITE_SUPABASE_URL) || "https://TU_PROYECTO.supabase.co";
const supabaseAnonKey = (isNode ? process.env.VITE_SUPABASE_ANON_KEY : import.meta.env.VITE_SUPABASE_ANON_KEY) || "TU_CLAVE_ANONIMA";

const isPlaceholderUrl = supabaseUrl?.includes("TU_PROYECTO");
const isPlaceholderKey = supabaseAnonKey?.includes("TU_CLAVE_ANONIMA");

if (!supabaseUrl || !supabaseAnonKey || isPlaceholderUrl || isPlaceholderKey) {
  console.warn(
    '⚠️ Supabase: Las credenciales están vacías o en modo placeholder. ' +
    'Verifica tu archivo .env'
  );
}



export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true, 
    },
  }
);

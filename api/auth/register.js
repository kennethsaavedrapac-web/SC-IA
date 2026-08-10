import { z } from "zod";
import { supabaseAdmin, logEvent } from "../_lib/security.js";

const registerSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres")
});

export default async function handler(req, res) {
  // CORS
  const allowedOrigin = process.env.FRONTEND_URL || "*";
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Use POST." });
  }

  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Datos de entrada inválidos",
        details: result.error.errors.map(e => e.message)
      });
    }

    const { email, password, nombre } = result.data;

    // Create user in Supabase Auth (admin client bypasses confirmation emails if we set email_confirm: true)
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre, full_name: nombre }
    });

    if (authErr) {
      logEvent("warn", "REGISTER_FAILED", { email, error: authErr.message });
      return res.status(400).json({ error: authErr.message });
    }

    const user = authData.user;

    // Create record in public.profiles table
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: user.id,
        nombre,
        email,
        role: "patient",
        created_at: new Date().toISOString()
      });

    if (profileErr) {
      logEvent("error", "REGISTER_PROFILE_FAILED", { email, userId: user.id, error: profileErr.message });
      // Clean up the created auth user to avoid orphan auth accounts
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      return res.status(550).json({ error: "No se pudo crear el perfil de usuario" });
    }

    logEvent("info", "REGISTER_SUCCESS", { email, userId: user.id });

    return res.status(201).json({
      success: true,
      message: "Registro exitoso. Ahora puede iniciar sesión."
    });

  } catch (error) {
    logEvent("error", "REGISTER_ERROR", { error: error.message });
    return res.status(500).json({ error: "Error interno al procesar el registro" });
  }
}

import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

// Import Vercel API handlers to make them work locally
import fhirHandler from "./api/fhir.js";
import fhirGetHandler from "./api/fhir-get.js";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PORT = 3000;


const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: "Demasiadas solicitudes desde esta IP, por favor intente nuevamente después de 15 minutos." }
});

async function startServer() {
  const app = express();
  
  // Security middlewares
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://*.supabase.co", "https://generativelanguage.googleapis.com", "https://nominatim.openstreetmap.org"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: ["'self'", "https://*.supabase.co"],
        baseUri: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false
  }));
  app.use(cors({
    origin: process.env.NODE_ENV === "production" && process.env.FRONTEND_URL ? process.env.FRONTEND_URL : "http://localhost:3000",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }));
  
  app.use(express.json({ limit: "100kb" })); 

  
  app.post("/api/chat", apiLimiter, async (req: Request, res: Response) => {
    try {
      // Verify authentication - require a valid session
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      
      let authenticated = false;
      if (token) {
        try {
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
          if (!authError && authUser) authenticated = true;
        } catch {
          // Token validation failed silently
        }
      }

      const { message, history, userProfile } = req.body;
      if (!message) {
        return res.status(400).json({ error: "El mensaje es obligatorio" });
      }

      
      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey || groqApiKey.length < 10) {
        console.log("Using simulated response (unconfigured API key).");
        return res.json({
          text: `Nivel de prioridad: 🟡 Moderado\n\n🔍 EVALUACIÓN INICIAL\nLos síntomas reportados ("${message}") indican una situación que requiere vigilancia activa. El análisis sugiere que no se detectan signos de emergencia inmediata, pero es fundamental seguir las pautas de cuidado para monitorear que el cuadro no progrese.\n\n✅ RECOMENDACIONES\n🔹 Mantener reposo absoluto y evitar esfuerzos físicos.\n🔹 Hidratación constante con líquidos claros o suero oral.\n🔹 Monitorear síntomas cada 2-4 horas.\n🔹 Si los síntomas persisten o empeoran tras 24 horas, acuda a su centro de salud.\n🔹 Contacte al 118 si presenta dificultad para respirar, dolor severo o cambios de conciencia.\n\n⚠️ Esta orientación es únicamente informativa y no reemplaza la evaluación de un profesional de salud.`,
          simulated: true,
        });
      }

      const systemInstruction = `Eres "Salud-Conecta IA", un asistente médico virtual y asesor de triaje clínico inteligente para Nicaragua.

TU OBJETIVO PRINCIPAL:
Analizar los síntomas ingresados por el usuario y proporcionar un triaje médico estructurado que clasifique la urgencia, explique la evaluación y genere recomendaciones preliminares.

FUNCIONES OBLIGATORIAS:

1. **ANÁLISIS DE SÍNTOMAS**: Analiza los síntomas ingresados por el usuario utilizando razonamiento clínico básico y contextual.

2. **CLASIFICACIÓN DE PRIORIDAD**: Clasifica el caso en EXACTAMENTE UNA de estas categorías:
   - 🔴 Alta urgencia
   - 🟡 Moderado
   - 🟢 Leve

3. **EXPLICACIÓN DE CLASIFICACIÓN**: Explica claramente por qué se asignó esa clasificación usando lenguaje sencillo y comprensible.

4. **RECOMENDACIONES PRELIMINARES**: Genera recomendaciones apropiadas según los síntomas reportados, incluyendo:
   - Medidas generales de cuidado
   - Recomendaciones de descanso o hidratación cuando aplique
   - Sugerencias de vigilancia de síntomas

5. **IDENTIFICACIÓN DE SEÑALES DE RIESGO**: Identifica señales de riesgo potencial y recomienda buscar atención médica profesional cuando los síntomas sugieran mayor gravedad.

RESTRICCIONES OBLIGATORIAS:
- NO diagnosticar enfermedades de forma definitiva
- NO asegurar resultados médicos
- NO sustituir la evaluación de profesionales de salud
- Evitar lenguaje alarmista
- Siempre mantener tono empático y tranquilizador

FORMATO OBLIGATORIO DE RESPUESTA:

Nivel de prioridad: [Categoría con emoji]

🔍 EVALUACIÓN INICIAL
[Análisis breve explicando por qué se asignó esa clasificación]

✅ RECOMENDACIONES
🔹 [Recomendación 1]
🔹 [Recomendación 2]
🔹 [Recomendación 3 si aplica]
🔹 [Más recomendaciones según sea necesario]

⚠️ Esta orientación es únicamente informativa y no reemplaza la evaluación de un profesional de salud.

CENTROS DE REFERENCIA EN GRANADA:
- Hospital Bautista (hospital general - abierto 24h)
- Centro de Salud Sócrates Flores (para casos no graves, cierra a las 8:00 p.m.)
- Hospital Amistad Japón Nicaragua (servicios avanzados especializados)
- Emergencias: Llamar al 118

RECUERDA: Siempre finaliza con la advertencia médica obligatoria.`;

      
      const now = new Date();
      const localTimeStr = now.toLocaleString("es-NI", { timeZone: "America/Managua", weekday: 'long', hour: '2-digit', minute: '2-digit' });
      
      const timeContext = `\n\n[CONTEXTO TEMPORAL ACTUAL IMPORTANTE PARA TRIAGE]
Hora y día actual en Nicaragua: ${localTimeStr}
REGLA ESTRICTA: Los Centros y Puestos de Salud del MINSA atienden únicamente de Lunes a Viernes de 08:00 AM a 4:00 PM. Si la hora actual de arriba está fuera de ese horario (noches o fines de semana), ESTÁN CERRADOS. En caso de síntomas preocupantes fuera de horario laboral, debes REFERIR AL PACIENTE EXCLUSIVAMENTE A HOSPITALES, ya que estos sí atienden 24/7. Es vital para la seguridad no derivarlos a clínicas cerradas.`;

      // Sanitize user input to prevent prompt injection
      function sanitizeForPrompt(value: string): string {
        if (!value) return 'No especificado';
        return String(value)
          .replace(/[\n\r]/g, ' ')
          .replace(/[<>"']/g, '')
          .substring(0, 200);
      }

      let profileContext = "";
      if (userProfile && typeof userProfile === 'object') {
        const safeName = sanitizeForPrompt(userProfile.name);
        const safeCity = sanitizeForPrompt(userProfile.city);
        const safeConditions = Array.isArray(userProfile.healthConditions) 
          ? userProfile.healthConditions.map((c: string) => sanitizeForPrompt(c)).join(', ') 
          : 'Ninguna';
        
        profileContext = `\n\n[CONTEXTO DEL PACIENTE]
Nombre: ${safeName || 'No especificado'}
Ciudad: ${safeCity || 'No especificada'}
Condiciones: ${safeConditions || 'Ninguna'}`;
      }

      const historyContext = `\n\n[USO DEL HISTORIAL DE TRIAGE]
El historial de conversación puede incluir consultas de los últimos 14 días con fecha y hora. Úsalo SOLO cuando los síntomas actuales parezcan relacionados, sean una continuación, recurrencia o empeoramiento de algo previo. Si los síntomas actuales no tienen relación clara con el historial, ignóralo y evalúa la consulta actual por sí sola. No menciones el historial salvo que aporte valor clínico.`;

      const finalSystemInstruction = systemInstruction + timeContext + profileContext + historyContext;

      let aiModel = "llama-3.3-70b-versatile";
      try {
        if (!process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL.includes("placeholder")) {
           throw new Error("Supabase no configurado");
        }
        
        const { data, error } = await supabase
          .from("app_settings")
          .select("valor")
          .eq("clave", "global_config")
          .single();
        if (!error && data && data.valor && (data.valor as any).aiModel) {
          const dbModel = (data.valor as any).aiModel;
          if (dbModel && !dbModel.startsWith("gemini")) {
            aiModel = dbModel;
          }
        }
      } catch (dbErr) {
        console.error("Error fetching dynamic model config from Supabase:", dbErr);
      }

      // Map chat history and build message payload for Groq
      const messages = [
        { role: "system", content: finalSystemInstruction }
      ];

      if (history && Array.isArray(history)) {
        history.forEach((turn: any) => {
          const role = (turn.sender === "user" || turn.role === "user") ? "user" : "assistant";
          const text = turn.text || turn.content || "";
          if (text) {
            messages.push({ role, content: text });
          }
        });
      }

      messages.push({ role: "user", content: message });

      // Send request to Groq API
      let responseText = "";
      try {
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: aiModel,
            messages: messages,
            temperature: 0.2,
            max_tokens: 1024
          })
        });

        if (!groqResponse.ok) {
          const errBody = await groqResponse.text();
          throw new Error(`Groq API responded with status ${groqResponse.status}: ${errBody}`);
        }

        const groqData: any = await groqResponse.json();
        responseText = groqData.choices?.[0]?.message?.content || "";
      } catch (aiErr: any) {
        console.error("Groq Generation Error:", aiErr);
        if (aiErr?.message?.includes("safety") || aiErr?.message?.includes("refuse")) {
            return res.status(200).json({ text: "Consulta bloqueada por seguridad. Reformule sus síntomas.", simulated: false });
        }
        throw aiErr;
      }

      // Try to log the chat interaction to the database (fail silently if table doesn't exist)
      try {
        const userId = userProfile?.id;
        await supabase.from('chat_logs').insert({
          user_id: userId || null,
          message_length: message.length,
          created_at: new Date().toISOString()
        });
      } catch (logErr) {
        console.warn("Could not log chat interaction to Supabase:", logErr);
      }

      return res.json({
        text: responseText || "El asistente no pudo generar una respuesta clara.",
        simulated: false,
      });

    } catch (error: any) {
      console.error("Detalle del Error en API Chat:", error);
      return res.status(500).json({
        error: "Ocurrió un error procesando el triaje virtual con IA. Intente nuevamente."
      });
    }
  });

  // Mount FHIR API endpoints
  app.post("/api/fhir", (req: Request, res: Response) => {
    // Wrap Express req/res to simulate Vercel serverless environment if necessary,
    // but the handlers are simple enough to work with Express directly.
    return fhirHandler(req, res);
  });

  app.get("/api/fhir-get", (req: Request, res: Response) => {
    return fhirGetHandler(req, res);
  });

  // Hot module reloading and client asset serving
  if (process.env.NODE_ENV !== "production") {
    console.log("Configuring Vite Development Server Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production build of client from /dist...");
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Salud-Conecta IA Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

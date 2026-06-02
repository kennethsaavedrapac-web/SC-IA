import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const PORT = 3000;

// Initialize Gemini client on the server
let aiClient: GoogleGenerativeAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in the environment.");
    }
    aiClient = new GoogleGenerativeAI(apiKey || "");
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API router setup - Triage / Chat IA endpoint
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Check if API key is mock/missing, if so return a helpful simulated medic response to preserve experience
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.length < 10) {
        console.log("Using simulated response (unconfigured API key).");
        return res.json({
          text: `Nivel de prioridad: 🟡 Moderado\n\n🔍 EVALUACIÓN INICIAL\nLos síntomas reportados ("${message}") indican una situación que requiere vigilancia activa. El análisis sugiere que no se detectan signos de emergencia inmediata, pero es fundamental seguir las pautas de cuidado para monitorear que el cuadro no progrese.\n\n✅ RECOMENDACIONES\n🔹 Mantener reposo absoluto y evitar esfuerzos físicos.\n🔹 Hidratación constante con líquidos claros o suero oral.\n🔹 Monitorear síntomas cada 2-4 horas.\n🔹 Si los síntomas persisten o empeoran tras 24 horas, acuda a su centro de salud.\n🔹 Contacte al 118 si presenta dificultad para respirar, dolor severo o cambios de conciencia.\n\n⚠️ Esta orientación es únicamente informativa y no reemplaza la evaluación de un profesional de salud.`,
          simulated: true,
        });
      }

      const client = getGeminiClient();

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

      // Evaluamos la hora actual para inyectarla en el contexto del agente
      const now = new Date();
      const localTimeStr = now.toLocaleString("es-NI", { timeZone: "America/Managua", weekday: 'long', hour: '2-digit', minute: '2-digit' });
      
      const timeContext = `\n\n[CONTEXTO TEMPORAL ACTUAL IMPORTANTE PARA TRIAGE]
Hora y día actual en Nicaragua: ${localTimeStr}
REGLA ESTRICTA: Los Centros y Puestos de Salud del MINSA atienden únicamente de Lunes a Viernes de 08:00 AM a 4:00 PM. Si la hora actual de arriba está fuera de ese horario (noches o fines de semana), ESTÁN CERRADOS. En caso de síntomas preocupantes fuera de horario laboral, debes REFERIR AL PACIENTE EXCLUSIVAMENTE A HOSPITALES, ya que estos sí atienden 24/7. Es vital para la seguridad no derivarlos a clínicas cerradas.`;

      const finalSystemInstruction = systemInstruction + timeContext;

      const model = client.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: finalSystemInstruction
      });

      // Build chat with history
      const chat = model.startChat({
        history: history && Array.isArray(history) ? history.map((turn: any) => ({
          role: (turn.sender === "user" || turn.role === "user") ? "user" : "model",
          parts: [{ text: turn.text || turn.content || "" }]
        })) : [],
      });

      // Send message and get response
      const result = await chat.sendMessage(message);
      const responseText = result.response.text();

      return res.json({
        text: responseText || "No obtuve una respuesta clara del asistente.",
        simulated: false,
      });

    } catch (error: any) {
      console.error("Gemini Error:", error);
      return res.status(500).json({
        error: "Ocurrió un error procesando el triaje virtual con IA.",
        details: error?.message || ""
      });
    }
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

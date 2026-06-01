import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const PORT = 3000;

// Initialize Gemini client on the server
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in the environment.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API router setup - Triage / Chat IA endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Check if API key is mock/missing, if so return a helpful simulated medic response to preserve experience
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" || process.env.GEMINI_API_KEY === "MOCK_KEY") {
        console.log("Using simulated response (unconfigured API key).");
        return res.json({
          text: `Nivel de prioridad: 🟡 Moderado

🔍 EVALUACIÓN INICIAL
Los síntomas reportados ("${message}") indican una situación que requiere vigilancia activa. No se detectan signos de emergencia inmediata, pero es fundamental seguir las pautas de cuidado para evitar que el cuadro progrese.

✅ RECOMENDACIONES
🔹 Mantener reposo absoluto y evitar esfuerzos físicos.
🔹 Hidratación constante con líquidos claros o suero oral.
🔹 Monitorear la temperatura cada 4 horas.
🔹 Si los síntomas persisten o empeoran tras 24 horas, acuda a su centro de salud.

⚠️ Advertencia: Esta orientación es únicamente informativa y no reemplaza la evaluación de un profesional de salud.`,
          simulated: true,
        });
      }

      const client = getGeminiClient();
      
      const systemInstruction = `Actúa como un sistema de triaje médico conversacional para Salud-Conecta IA. Tu función es analizar los síntomas proporcionados por el usuario y generar orientación médica preliminar sin reemplazar una consulta profesional.

Funciones obligatorias:
1. Analiza los síntomas ingresados por el usuario utilizando razonamiento clínico básico y contextual.
2. Clasifica el caso en un nivel de prioridad médica utilizando estas categorías:
🔴 Alta urgencia
🟡 Moderado
🟢 Leve
3. Explica claramente por qué se asignó esa clasificación usando lenguaje sencillo y comprensible.
4. Genera recomendaciones preliminares apropiadas según los síntomas reportados, incluyendo:
   - Medidas generales de cuidado
   - Recomendaciones de descanso o hidratación cuando aplique
   - Sugerencias de vigilancia de síntomas
5. Identifica señales de riesgo potencial y recomienda buscar atención médica profesional cuando los síntomas sugieran mayor gravedad.

Mantén siempre las siguientes restricciones:
- No diagnosticar enfermedades de forma definitiva.
- No asegurar resultados médicos.
- No sustituir la evaluación de profesionales de salud.
- Evitar lenguaje alarmista.

Formato obligatorio de respuesta:
Nivel de prioridad: [🔴 Alta urgencia / 🟡 Moderado / 🟢 Leve]

🔍 EVALUACIÓN INICIAL
[Escribe aquí el análisis breve de forma clara y organizada]

✅ RECOMENDACIONES
[Usa el símbolo 🔹 para cada punto de la lista, sin usar guiones o puntos genéricos]

⚠️ Advertencia: Esta orientación es únicamente informativa y no reemplaza la evaluación de un profesional de salud.`;

      // Transform history to expected Gemini parts/contents format if history is passed
      // For simplicity, we can use generateContent with the full conversation or use chats.create
      const contents = [];
      if (history && Array.isArray(history)) {
        for (const turn of history) {
          contents.push({
            role: turn.sender === "user" ? "user" : "model",
            parts: [{ text: turn.text }]
          });
        }
      }
      
      // Add current message
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await client.models.generateContent({
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction,
        contents: contents,
        generationConfig: {
          temperature: 0.75,
        }
      });

      return res.json({
        text: response.text || "No obtuve una respuesta clara del asistente.",
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
    app.get('*', (req, res) => {
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

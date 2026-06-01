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
          text: `Nivel de prioridad: 🟡 Moderado\n\nEvaluación inicial: Usted reporta: "${message}". En el contexto de Granada, esto requiere atención preventiva para evitar complicaciones.\n\nRecomendaciones:\n- Guarde reposo y mantenga una hidratación constante con líquidos claros.\n- Monitoree su temperatura cada 4 horas.\n- Si los síntomas persisten por más de 24 horas, acuda al Centro de Salud Sócrates Flores.\n\nAdvertencia: ⚠️ Esta orientación es únicamente informativa y no reemplaza la evaluación de un profesional de salud.`,
          simulated: true,
        });
      }

      const client = getGeminiClient();
      
      const systemInstruction = `Actúa como un sistema de triaje médico conversacional para Salud-Conecta IA. Tu función es analizar los síntomas proporcionados por el usuario y generar orientación médica preliminar sin reemplazar una consulta profesional.

Funciones obligatorias:
1. Analiza los síntomas ingresados utilizando razonamiento clínico básico.
2. Clasifica el caso en un nivel de prioridad médica: 🔴 Alta urgencia, 🟡 Moderado, o 🟢 Leve.
3. Explica claramente la clasificación usando lenguaje sencillo.
4. Genera recomendaciones preliminares (cuidado general, descanso, hidratación, vigilancia).
5. Identifica señales de riesgo y recomienda atención profesional si es necesario.

Restricciones estrictas:
- No diagnosticar de forma definitiva ni asegurar resultados.
- No sustituir la evaluación profesional.
- Evitar lenguaje alarmista.

Formato obligatorio de respuesta:
Nivel de prioridad: [Categoría con su respectivo emoji]
Evaluación inicial: [Análisis breve y explicación de la prioridad]
Recomendaciones: [Lista clara de acciones]
Advertencia: ⚠️ Esta orientación es únicamente informativa y no reemplaza la evaluación de un profesional de salud.`;

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
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
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

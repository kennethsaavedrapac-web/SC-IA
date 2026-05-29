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
          text: `[Respuesta Simulada - Salud-Conecta IA]\n\n¡Hola Granada! He recibido tus síntomas sobre: "${message}". Como tu asistente de salud inteligente, te sugiero lo siguiente:\n\n1. **Autocuidado**: Mantente hidratado y descansa. \n2. **Centros recomendados**: Puedes acudir al **Centro de Salud Sócrates Flores** para una atención regular, o al **Hospital Bautista** si requieres consulta especializada urgente en Granada.\n3. **Urgencia**: Si presentas dolor abdominal agudo, dificultad para respirar o fiebre alta mayor a 39°C que no cede, por favor llama a emergencias al **118** de inmediato.\n\n*Nota: Recuerde configurar su clave GEMINI_API_KEY en la sección Secrets para recibir un verdadero análisis clínico avanzado de IA.*`,
          simulated: true,
        });
      }

      const client = getGeminiClient();
      
      const systemInstruction = `Eres "Salud-Conecta IA", un asistente médico virtual y asesor de triaje clínico inteligente extremadamente empático, profesional y calificado para los ciudadanos de Granada, Nicaragua y general.
      
Tu objetivo principal es escuchar los síntomas que describe el usuario, priorizar con base en la urgencia y dar orientación médica general clara, respetando los estándares internacionales de salud.

Sigue estas directrices estrictas:
1. **Saluda cordialmente** y mantén un tono tranquilizador, empático pero clínicamente riguroso.
2. **Triaje (Clasificación de Gravedad)**: Analiza los síntomas descritos y especifica un nivel de riesgo (Bajo, Medio, Alto/Servicio de Urgencias).
3. **Recomendaciones de Acción**: Indica posibles medidas de alivio temporal seguro (por ejemplo: rehidratación para malestares estomacales o fiebres ligeras, reposo absoluto, etc.) y advierte sobre los signos de alarma clínicamente críticos.
4. **Centros Recomendados**: Menciona que en Granada pueden visitar el **Hospital Bautista** (hospital general - abierto 24h), el **Centro de Salud Sócrates Flores** (para casos no graves, cierra a las 8:00 p.m.) o el **Hospital Amistad Japón Nicaragua** (servicios avanzados especializados).
5. **Emergencias**: Para urgencias extremas, enfatiza que deben llamar inmediatamente al número de emergencias **118** local.
6. **Limitación de Responsabilidad**: Agrega siempre una nota sutil al final recordando que esta es una herramienta de triaje orientativa y no sustituye un examen de diagnóstico físico cara a cara con un doctor colegiado.
      
Responde en un español amigable, estructurado y fácil de leer con viñetas.`;

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

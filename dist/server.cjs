var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
import_dotenv.default.config();
var PORT = 3e3;
var aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("\u26A0\uFE0F Warning: GEMINI_API_KEY is not defined in the environment.");
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
async function startServer() {
  const app = (0, import_express.default)();
  app.use(import_express.default.json());
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" || process.env.GEMINI_API_KEY === "MOCK_KEY") {
        console.log("Using simulated response (unconfigured API key).");
        return res.json({
          text: `[Respuesta Simulada - Salud-Conecta IA]

\xA1Hola Granada! He recibido tus s\xEDntomas sobre: "${message}". Como tu asistente de salud inteligente, te sugiero lo siguiente:

1. **Autocuidado**: Mantente hidratado y descansa. 
2. **Centros recomendados**: Puedes acudir al **Centro de Salud S\xF3crates Flores** para una atenci\xF3n regular, o al **Hospital Bautista** si requieres consulta especializada urgente en Granada.
3. **Urgencia**: Si presentas dolor abdominal agudo, dificultad para respirar o fiebre alta mayor a 39\xB0C que no cede, por favor llama a emergencias al **118** de inmediato.

*Nota: Recuerde configurar su clave GEMINI_API_KEY en la secci\xF3n Secrets para recibir un verdadero an\xE1lisis cl\xEDnico avanzado de IA.*`,
          simulated: true
        });
      }
      const client = getGeminiClient();
      const systemInstruction = `Eres "Salud-Conecta IA", un asistente m\xE9dico virtual y asesor de triaje cl\xEDnico inteligente extremadamente emp\xE1tico, profesional y calificado para los ciudadanos de Granada, Nicaragua y general.
      
Tu objetivo principal es escuchar los s\xEDntomas que describe el usuario, priorizar con base en la urgencia y dar orientaci\xF3n m\xE9dica general clara, respetando los est\xE1ndares internacionales de salud.

Sigue estas directrices estrictas:
1. **Saluda cordialmente** y mant\xE9n un tono tranquilizador, emp\xE1tico pero cl\xEDnicamente riguroso.
2. **Triaje (Clasificaci\xF3n de Gravedad)**: Analiza los s\xEDntomas descritos y especifica un nivel de riesgo (Bajo, Medio, Alto/Servicio de Urgencias).
3. **Recomendaciones de Acci\xF3n**: Indica posibles medidas de alivio temporal seguro (por ejemplo: rehidrataci\xF3n para malestares estomacales o fiebres ligeras, reposo absoluto, etc.) y advierte sobre los signos de alarma cl\xEDnicamente cr\xEDticos.
4. **Centros Recomendados**: Menciona que en Granada pueden visitar el **Hospital Bautista** (hospital general - abierto 24h), el **Centro de Salud S\xF3crates Flores** (para casos no graves, cierra a las 8:00 p.m.) o el **Hospital Amistad Jap\xF3n Nicaragua** (servicios avanzados especializados).
5. **Emergencias**: Para urgencias extremas, enfatiza que deben llamar inmediatamente al n\xFAmero de emergencias **118** local.
6. **Limitaci\xF3n de Responsabilidad**: Agrega siempre una nota sutil al final recordando que esta es una herramienta de triaje orientativa y no sustituye un examen de diagn\xF3stico f\xEDsico cara a cara con un doctor colegiado.
      
Responde en un espa\xF1ol amigable, estructurado y f\xE1cil de leer con vi\xF1etas.`;
      const contents = [];
      if (history && Array.isArray(history)) {
        for (const turn of history) {
          contents.push({
            role: turn.sender === "user" ? "user" : "model",
            parts: [{ text: turn.text }]
          });
        }
      }
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.75
        }
      });
      return res.json({
        text: response.text || "No obtuve una respuesta clara del asistente.",
        simulated: false
      });
    } catch (error) {
      console.error("Gemini Error:", error);
      return res.status(500).json({
        error: "Ocurri\xF3 un error procesando el triaje virtual con IA.",
        details: error?.message || ""
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("Configuring Vite Development Server Middleware...");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production build of client from /dist...");
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} Salud-Conecta IA Server running at http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
//# sourceMappingURL=server.cjs.map

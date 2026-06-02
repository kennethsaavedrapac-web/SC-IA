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
var import_generative_ai = require("@google/generative-ai");
import_dotenv.default.config();
var PORT = 3e3;
var aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("\u26A0\uFE0F Warning: GEMINI_API_KEY is not defined in the environment.");
    }
    aiClient = new import_generative_ai.GoogleGenerativeAI(apiKey || "");
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
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.length < 10) {
        console.log("Using simulated response (unconfigured API key).");
        return res.json({
          text: `Nivel de prioridad: \u{1F7E1} Moderado

\u{1F50D} EVALUACI\xD3N INICIAL
Los s\xEDntomas reportados ("${message}") indican una situaci\xF3n que requiere vigilancia activa. El an\xE1lisis sugiere que no se detectan signos de emergencia inmediata, pero es fundamental seguir las pautas de cuidado para monitorear que el cuadro no progrese.

\u2705 RECOMENDACIONES
\u{1F539} Mantener reposo absoluto y evitar esfuerzos f\xEDsicos.
\u{1F539} Hidrataci\xF3n constante con l\xEDquidos claros o suero oral.
\u{1F539} Monitorear s\xEDntomas cada 2-4 horas.
\u{1F539} Si los s\xEDntomas persisten o empeoran tras 24 horas, acuda a su centro de salud.
\u{1F539} Contacte al 118 si presenta dificultad para respirar, dolor severo o cambios de conciencia.

\u26A0\uFE0F Esta orientaci\xF3n es \xFAnicamente informativa y no reemplaza la evaluaci\xF3n de un profesional de salud.`,
          simulated: true
        });
      }
      const client = getGeminiClient();
      const systemInstruction = `Eres "Salud-Conecta IA", un asistente m\xE9dico virtual y asesor de triaje cl\xEDnico inteligente para Nicaragua.

TU OBJETIVO PRINCIPAL:
Analizar los s\xEDntomas ingresados por el usuario y proporcionar un triaje m\xE9dico estructurado que clasifique la urgencia, explique la evaluaci\xF3n y genere recomendaciones preliminares.

FUNCIONES OBLIGATORIAS:

1. **AN\xC1LISIS DE S\xCDNTOMAS**: Analiza los s\xEDntomas ingresados por el usuario utilizando razonamiento cl\xEDnico b\xE1sico y contextual.

2. **CLASIFICACI\xD3N DE PRIORIDAD**: Clasifica el caso en EXACTAMENTE UNA de estas categor\xEDas:
   - \u{1F534} Alta urgencia
   - \u{1F7E1} Moderado
   - \u{1F7E2} Leve

3. **EXPLICACI\xD3N DE CLASIFICACI\xD3N**: Explica claramente por qu\xE9 se asign\xF3 esa clasificaci\xF3n usando lenguaje sencillo y comprensible.

4. **RECOMENDACIONES PRELIMINARES**: Genera recomendaciones apropiadas seg\xFAn los s\xEDntomas reportados, incluyendo:
   - Medidas generales de cuidado
   - Recomendaciones de descanso o hidrataci\xF3n cuando aplique
   - Sugerencias de vigilancia de s\xEDntomas

5. **IDENTIFICACI\xD3N DE SE\xD1ALES DE RIESGO**: Identifica se\xF1ales de riesgo potencial y recomienda buscar atenci\xF3n m\xE9dica profesional cuando los s\xEDntomas sugieran mayor gravedad.

RESTRICCIONES OBLIGATORIAS:
- NO diagnosticar enfermedades de forma definitiva
- NO asegurar resultados m\xE9dicos
- NO sustituir la evaluaci\xF3n de profesionales de salud
- Evitar lenguaje alarmista
- Siempre mantener tono emp\xE1tico y tranquilizador

FORMATO OBLIGATORIO DE RESPUESTA:

Nivel de prioridad: [Categor\xEDa con emoji]

\u{1F50D} EVALUACI\xD3N INICIAL
[An\xE1lisis breve explicando por qu\xE9 se asign\xF3 esa clasificaci\xF3n]

\u2705 RECOMENDACIONES
\u{1F539} [Recomendaci\xF3n 1]
\u{1F539} [Recomendaci\xF3n 2]
\u{1F539} [Recomendaci\xF3n 3 si aplica]
\u{1F539} [M\xE1s recomendaciones seg\xFAn sea necesario]

\u26A0\uFE0F Esta orientaci\xF3n es \xFAnicamente informativa y no reemplaza la evaluaci\xF3n de un profesional de salud.

CENTROS DE REFERENCIA EN GRANADA:
- Hospital Bautista (hospital general - abierto 24h)
- Centro de Salud S\xF3crates Flores (para casos no graves, cierra a las 8:00 p.m.)
- Hospital Amistad Jap\xF3n Nicaragua (servicios avanzados especializados)
- Emergencias: Llamar al 118

RECUERDA: Siempre finaliza con la advertencia m\xE9dica obligatoria.`;
      const now = /* @__PURE__ */ new Date();
      const localTimeStr = now.toLocaleString("es-NI", { timeZone: "America/Managua", weekday: "long", hour: "2-digit", minute: "2-digit" });
      const timeContext = `

[CONTEXTO TEMPORAL ACTUAL IMPORTANTE PARA TRIAGE]
Hora y d\xEDa actual en Nicaragua: ${localTimeStr}
REGLA ESTRICTA: Los Centros y Puestos de Salud del MINSA atienden \xFAnicamente de Lunes a Viernes de 08:00 AM a 4:00 PM. Si la hora actual de arriba est\xE1 fuera de ese horario (noches o fines de semana), EST\xC1N CERRADOS. En caso de s\xEDntomas preocupantes fuera de horario laboral, debes REFERIR AL PACIENTE EXCLUSIVAMENTE A HOSPITALES, ya que estos s\xED atienden 24/7. Es vital para la seguridad no derivarlos a cl\xEDnicas cerradas.`;
      const finalSystemInstruction = systemInstruction + timeContext;
      const model = client.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: finalSystemInstruction
      });
      const chat = model.startChat({
        history: history && Array.isArray(history) ? history.map((turn) => ({
          role: turn.sender === "user" || turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.text || turn.content || "" }]
        })) : []
      });
      const result = await chat.sendMessage(message);
      const responseText = result.response.text();
      return res.json({
        text: responseText || "No obtuve una respuesta clara del asistente.",
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
    const distPath = import_path.default.resolve(process.cwd(), "dist");
    app.use(import_express.default.static(distPath, { index: false }));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.resolve(distPath, "index.html"));
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

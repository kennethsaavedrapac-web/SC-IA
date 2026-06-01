import { GoogleGenerativeAI } from "@google/generative-ai";

let aiClient = null;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.length < 10) {
    throw new Error("GEMINI_API_KEY is not properly configured");
  }
  
  if (!aiClient) {
    try {
      aiClient = new GoogleGenerativeAI(apiKey);
    } catch (e) {
      console.error("Error creating Gemini client:", e);
      throw e;
    }
  }
  
  return aiClient;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey.length < 10) {
      console.log("API key not configured, returning simulated response");
      return res.status(200).json({
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

    const contents = [];
    
    if (history && Array.isArray(history)) {
      for (const turn of history) {
        contents.push({
          role: turn.sender === "user" || turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.text || turn.content || "" }],
        });
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const model = client.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent({
      contents: contents,
      generationConfig: { temperature: 0.75 },
    });

    const responseAI = await result.response;
    const responseText = responseAI.text();

    return res.status(200).json({
      text: responseText || "No obtuve una respuesta clara del asistente.",
      simulated: false,
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    
    return res.status(500).json({
      error: "Ocurrió un error procesando el triaje virtual con IA.",
      details: error?.message || error || "Error desconocido",
      timestamp: new Date().toISOString(),
    });
  }
}

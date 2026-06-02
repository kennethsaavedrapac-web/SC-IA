const { GoogleGenerativeAI } = require("@google/generative-ai");

let aiClient = null;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.length < 10) {
    return null;
  }
  
  if (!aiClient) {
    try {
      aiClient = new GoogleGenerativeAI(apiKey);
    } catch (e) {
      console.error("Error creating GoogleGenerativeAI client:", e);
      throw e;
    }
  }
  
  return aiClient;
}

const SYSTEM_INSTRUCTION = `Eres "Salud-Conecta IA", un asistente médico virtual y asesor de triaje clínico inteligente para Nicaragua.

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

module.exports = async function handler(req, res) {
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

    const ai = getGeminiClient();
    
    if (!ai) {
      console.error("Failed to initialize Gemini client - API key may be invalid");
      return res.status(500).json({
        error: "No se pudo inicializar el servicio de IA. Verifica la configuración de la API key.",
        details: "GEMINI_API_KEY no está configurada o es inválida",
        timestamp: new Date().toISOString(),
      });
    }

    // Evaluamos la hora actual para inyectarla en el contexto del agente
    const now = new Date();
    const localTimeStr = now.toLocaleString("es-NI", { timeZone: "America/Managua", weekday: 'long', hour: '2-digit', minute: '2-digit' });
    
    const timeContext = `\n\n[CONTEXTO TEMPORAL ACTUAL IMPORTANTE PARA TRIAGE]
Hora y día actual en Nicaragua: ${localTimeStr}
REGLA ESTRICTA: Los Centros y Puestos de Salud del MINSA atienden únicamente de Lunes a Viernes de 08:00 AM a 4:00 PM. Si la hora actual de arriba está fuera de ese horario (noches o fines de semana), ESTÁN CERRADOS. En caso de síntomas preocupantes fuera de horario laboral, debes REFERIR AL PACIENTE EXCLUSIVAMENTE A HOSPITALES, ya que estos sí atienden 24/7. Es vital para la seguridad no derivarlos a clínicas cerradas.`;

    const systemPrompt = SYSTEM_INSTRUCTION + timeContext;

    // Get the model with system instruction
    const model = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    // Build chat with history
    const chat = model.startChat({
      history: history && Array.isArray(history) ? history.map(turn => ({
        role: turn.sender === "user" || turn.role === "user" ? "user" : "model",
        parts: [{ text: turn.text || turn.content || "" }],
      })) : [],
    });

    // Generate response
    const response = await chat.sendMessage(message);
    const responseText = response.response.text();

    return res.status(200).json({
      text: responseText || "No obtuve una respuesta clara del asistente.",
      simulated: false,
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    
    const errorMessage = error?.message || String(error) || "Error desconocido";
    
    let userMessage = "Ocurrió un error procesando el triaje virtual con IA.";
    let shouldUseFallback = false;
    
    if (errorMessage.includes("API_KEY") || errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("PERMISSION")) {
      userMessage = "Error de autenticación con la API de Gemini. Verifica que la API key sea válida.";
    } else if (errorMessage.includes("SAFETY")) {
      userMessage = "La respuesta fue bloqueada por filtros de seguridad. Intenta reformular tu consulta.";
    } else if (errorMessage.includes("quota") || errorMessage.includes("429") || errorMessage.includes("Too Many Requests")) {
      userMessage = "Cuota de API excedida. Usando modo de respuesta simulada para continuar.";
      shouldUseFallback = true;
      console.log("API quota exceeded, switching to simulated mode");
    }
    
    // If quota exceeded, return simulated response instead of error
    if (shouldUseFallback) {
      return res.status(200).json({
        text: `Nivel de prioridad: 🟡 Moderado\n\n🔍 EVALUACIÓN INICIAL\nLos síntomas reportados ("${message}") indican una situación que requiere vigilancia activa. El análisis sugiere que no se detectan signos de emergencia inmediata, pero es fundamental seguir las pautas de cuidado para monitorear que el cuadro no progrese.\n\n✅ RECOMENDACIONES\n🔹 Mantener reposo absoluto y evitar esfuerzos físicos.\n🔹 Hidratación constante con líquidos claros o suero oral.\n🔹 Monitorear síntomas cada 2-4 horas.\n🔹 Si los síntomas persisten o empeoran tras 24 horas, acuda a su centro de salud.\n🔹 Contacte al 118 si presenta dificultad para respirar, dolor severo o cambios de conciencia.\n\n⚠️ Esta orientación es únicamente informativa y no reemplaza la evaluación de un profesional de salud.`,
        simulated: true,
        warning: "Respuesta generada en modo simulado debido a limitaciones temporales de la API."
      });
    }
    
    return res.status(500).json({
      error: userMessage,
      details: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
};

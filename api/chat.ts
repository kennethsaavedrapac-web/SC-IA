import { GoogleGenAI } from "@google/genai";

let aiClient = null;

function getGeminiClient() {
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" || process.env.GEMINI_API_KEY === "MOCK_KEY") {
      console.log("Using simulated response (unconfigured API key).");
      return res.status(200).json({
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
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.75,
      }
    });

    return res.status(200).json({
      text: response.text || "No obtuve una respuesta clara del asistente.",
      simulated: false,
    });

  } catch (error) {
    console.error("Gemini Error:", error);
    return res.status(500).json({
      error: "Ocurrió un error procesando el triaje virtual con IA.",
      details: error?.message || ""
    });
  }
}

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

let aiClient = null;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 10) return null;
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

const DOCUMENT_ANALYSIS_PROMPT = `Eres un asistente médico especializado en interpretar resultados de exámenes de laboratorio clínico. El usuario te ha enviado una imagen de un examen médico (puede ser un examen de sangre, orina, heces, perfil lipídico, perfil hepático, hemograma, química sanguínea, etc.).

TU TAREA:
1. **Identificar el tipo de examen**: Determina qué tipo de examen es (hemograma completo, examen general de orina, perfil lipídico, etc.).
2. **Extraer todos los valores**: Lee cada parámetro visible en la imagen con su valor y unidad de medida.
3. **Interpretar cada resultado**: Para CADA parámetro encontrado, explica:
   - Qué es y qué mide
   - Si el valor está dentro del rango normal, por encima o por debajo
   - Qué podría significar si está alterado
4. **Resumen general**: Proporciona una evaluación general del estado de salud basándose en los resultados.
5. **Recomendaciones**: Sugiere pasos a seguir si hay valores alterados.

FORMATO DE RESPUESTA OBLIGATORIO:

**📋 TIPO DE EXAMEN IDENTIFICADO**
[Nombre del examen]

**🔬 ANÁLISIS DETALLADO DE RESULTADOS**

🔹 **[Nombre del parámetro]**: [Valor encontrado] [Unidad]
   - *¿Qué es?*: [Explicación breve]
   - *Estado*: 🟢 Normal / 🟡 Ligeramente alterado / 🔴 Fuera de rango
   - *Significado*: [Interpretación]

[Repetir para cada parámetro...]

**📊 EVALUACIÓN GENERAL**
[Resumen del estado general según los resultados]

**✅ RECOMENDACIONES**
🔹 [Recomendación 1]
🔹 [Recomendación 2]
🔹 [Recomendación 3 si aplica]

⚠️ Esta interpretación es únicamente orientativa y educativa. NO reemplaza el diagnóstico de un médico o profesional de laboratorio clínico. Consulte siempre con su médico tratante para una evaluación completa.

RESTRICCIONES:
- NO diagnosticar enfermedades de forma definitiva
- NO sugerir medicamentos específicos
- NO asegurar que el paciente tiene o no tiene una enfermedad
- Siempre recomendar consultar con un profesional de salud
- Si la imagen NO es un examen médico o no se puede leer, indica que no se pudo interpretar el documento y solicita una imagen más clara`;

const DOCUMENT_ANALYSIS_PROMPT_EN = `You are a medical assistant specialized in interpreting clinical laboratory test results. The user has sent you an image of a medical exam (it could be a blood test, urine test, stool test, lipid profile, liver profile, complete blood count, blood chemistry, etc.).

YOUR TASK:
1. **Identify the type of exam**: Determine what type of exam it is.
2. **Extract all values**: Read each visible parameter with its value and unit of measurement.
3. **Interpret each result**: For EACH parameter found, explain what it is, whether it's within normal range, and what it could mean if altered.
4. **General summary**: Provide a general health assessment based on the results.
5. **Recommendations**: Suggest next steps if there are altered values.

FORMAT: Use structured format with emojis (🔹, 🟢, 🟡, 🔴, 📋, 🔬, 📊, ✅) and bold headings.

⚠️ This interpretation is for guidance and educational purposes only. It does NOT replace a doctor's or clinical laboratory professional's diagnosis.

RESTRICTIONS:
- Do NOT definitively diagnose diseases
- Do NOT suggest specific medications
- Always recommend consulting with a healthcare professional
- If the image is NOT a medical exam or cannot be read, indicate so and request a clearer image`;

export default async function handler(req, res) {
  const allowedOrigin = process.env.FRONTEND_URL || "*";
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { imageBase64, mimeType, language, userProfile } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Se requiere una imagen para analizar." });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.length < 10) {
      return res.status(200).json({
        text: "**📋 Análisis de Documento Médico**\n\n⚠️ El servicio de análisis de documentos no está disponible en este momento (API key no configurada). Por favor, intente más tarde.\n\nMientras tanto, le recomendamos llevar sus resultados a un profesional de salud para su interpretación.",
        simulated: true,
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: "No se pudo inicializar el servicio de IA.",
        timestamp: new Date().toISOString(),
      });
    }

    // Get AI model from Supabase config
    let aiModel = "gemini-2.5-flash-lite";
    if (supabase) {
      try {
        const { data: configData, error: configError } = await supabase
          .from('app_settings')
          .select('valor')
          .eq('clave', 'global_config')
          .single();

        if (!configError && configData?.valor?.aiModel) {
          aiModel = configData.valor.aiModel;
        }
      } catch (dbErr) {
        console.error("Error fetching dynamic model config:", dbErr);
      }
    }

    // Choose prompt based on language
    let systemPrompt = DOCUMENT_ANALYSIS_PROMPT;
    if (language === "en") {
      systemPrompt = DOCUMENT_ANALYSIS_PROMPT_EN;
    } else if (language === "mi") {
      systemPrompt = DOCUMENT_ANALYSIS_PROMPT + "\n\n[INSTRUCCIÓN DE IDIOMA] Responde en idioma Miskito de la forma más precisa posible, manteniendo el formato estructurado y los emojis.";
    } else if (language === "kr") {
      systemPrompt = DOCUMENT_ANALYSIS_PROMPT + "\n\n[INSTRUCCIÓN DE IDIOMA] Responde en inglés criollo (Kriol nicaragüense), manteniendo el formato estructurado y los emojis.";
    }

    // Add patient context if available
    if (userProfile && typeof userProfile === "object") {
      const safeName = userProfile.name ? String(userProfile.name).substring(0, 200) : "No especificado";
      const safeAge = userProfile.birthDate ? `Fecha de nacimiento: ${String(userProfile.birthDate).substring(0, 20)}` : "";
      const safeSex = userProfile.sex ? `Sexo: ${String(userProfile.sex).substring(0, 20)}` : "";
      const safeConditions = userProfile.healthConditions && userProfile.healthConditions.length > 0
        ? `Condiciones médicas preexistentes: ${userProfile.healthConditions.map(c => String(c).substring(0, 100)).join(', ')}`
        : "";

      if (safeAge || safeSex || safeConditions) {
        systemPrompt += `\n\n[CONTEXTO DEL PACIENTE]\nNombre: ${safeName}\n${safeAge}\n${safeSex}\n${safeConditions}\n\nConsidera este contexto al interpretar los resultados, especialmente las condiciones preexistentes.`;
      }
    }

    const model = ai.getGenerativeModel({
      model: aiModel,
      systemInstruction: systemPrompt,
    });

    // Clean the base64 string - remove the data URL prefix if present
    let cleanBase64 = imageBase64;
    if (cleanBase64.includes(",")) {
      cleanBase64 = cleanBase64.split(",")[1];
    }

    // Determine the MIME type
    const imageMimeType = mimeType || "image/jpeg";

    // Send image to Gemini for analysis
    let response;
    try {
      response = await model.generateContent([
        "Analiza este examen médico de laboratorio. Identifica todos los valores, interpreta cada uno y proporciona una evaluación general.",
        {
          inlineData: {
            data: cleanBase64,
            mimeType: imageMimeType,
          },
        },
      ]);
    } catch (sendErr) {
      console.error("Gemini Vision Error:", sendErr);
      if (sendErr.message?.includes("SAFETY")) {
        return res.status(200).json({
          text: "No se pudo analizar esta imagen por razones de seguridad. Asegúrese de que la imagen sea de un examen médico legible.",
          simulated: false,
        });
      }
      throw sendErr;
    }

    const responseText = response && response.response ? response.response.text() : null;

    // Log interaction to Supabase
    if (supabase) {
      try {
        const userId = userProfile?.id;
        await supabase.from("chat_logs").insert({
          user_id: userId || null,
          message_length: 0,
          created_at: new Date().toISOString(),
        });
      } catch (logErr) {
        console.warn("Could not log document analysis to Supabase:", logErr);
      }
    }

    return res.status(200).json({
      text: responseText || "No se pudo interpretar el documento. Intente con una imagen más clara o de mejor resolución.",
      simulated: false,
    });
  } catch (error) {
    console.error("Document Analysis API Error:", error);

    const errorMessage = error?.message || String(error) || "Error desconocido";

    if (errorMessage.includes("quota") || errorMessage.includes("429")) {
      return res.status(200).json({
        text: "**📋 Análisis de Documento Médico**\n\n⚠️ El servicio de análisis está temporalmente limitado por alta demanda. Por favor, intente nuevamente en unos minutos.\n\nMientras tanto, le recomendamos llevar sus resultados a un profesional de salud para su interpretación.",
        simulated: true,
        warning: "Servicio temporalmente limitado por cuota de API.",
      });
    }

    return res.status(500).json({
      error: "Error al analizar el documento médico. Intente nuevamente.",
      timestamp: new Date().toISOString(),
    });
  }
}

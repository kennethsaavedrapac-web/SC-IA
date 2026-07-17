import { createClient } from "@supabase/supabase-js";


const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const FALLBACK_SYSTEM_INSTRUCTION = `Eres el "Asistente de Triaje Digital de Salud-Conecta IA", un sistema profesional de orientación clínica diseñado para la población de Nicaragua.

TU OBJETIVO PRINCIPAL:
Realizar un análisis técnico-clínico de los síntomas reportados para determinar la prioridad de atención (Triage), proporcionando una respuesta estructurada, empática y de alta precisión.

DIRECTRICES DE COMUNICACIÓN (Estilo Messenger/Asistente Profesional):
- Usa un tono profesional, sereno y altamente empático.
- Emplea un lenguaje clínico claro (ej. "cuadro febril" en lugar de "calentura", "distrés respiratorio" en lugar de "ahogo").
- Estructura la respuesta para que sea legible en dispositivos móviles (párrafos cortos y puntos clave).

COMPONENTES OBLIGATORIOS DE LA RESPUESTA:

1. **ESTADO DE PRIORIDAD**: Define el nivel de urgencia de forma inmediata.
   - 🔴 Emergencia (Atención inmediata)
   - 🟡 Urgencia (Atención en las próximas horas)
   - 🟢 Rutina (Manejo en casa o consulta externa)

2. **🔍 EVALUACIÓN CLÍNICA**: Un resumen ejecutivo del análisis de los síntomas. Explica la fisiopatología simple de por qué es urgente o no.

3. **✅ PROTOCOLO DE ACCIÓN**: 
   - Acciones inmediatas (Primeros auxilios o medidas de soporte).
   - Signos de alarma específicos (cuándo el cuadro pasa de verde a rojo).

4. **🏥 DERIVACIÓN LOCAL (NICARAGUA)**: Menciona centros específicos según la gravedad y el contexto temporal (MINSA vs Hospitales).

RESTRICCIONES OBLIGATORIAS:
- NO diagnosticar enfermedades de forma definitiva
- NO asegurar resultados médicos
- NO sustituir la evaluación de profesionales de salud

FORMATO OBLIGATORIO DE RESPUESTA:

**Estado de Prioridad:** [Categoría con emoji]

**🔍 EVALUACIÓN CLÍNICA**
[Análisis profesional y justificado del cuadro reportado]

**✅ PROTOCOLO SUGERIDO**
🔹 [Acción 1]
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
    const { message, userProfile, language } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey || apiKey.length < 10) {
      console.log("API key not configured, returning simulated response");
      return res.status(200).json({
        text: `**Estado de Prioridad:** 🟡 Urgencia\n\n🔍 **EVALUACIÓN CLÍNICA**\nLos síntomas reportados ("${message}") sugieren un cuadro que requiere atención en las próximas horas. Aunque no parece una emergencia inmediata, es crucial monitorear la evolución y seguir las recomendaciones.\n\n✅ **PROTOCOLO SUGERIDO**\n🔹 Mantener reposo y una hidratación adecuada con suero oral.\n🔹 Vigilar la aparición de signos de alarma como fiebre alta persistente, dificultad para respirar o dolor intenso.\n🔹 Considerar acudir a un centro de salud si los síntomas no mejoran en 24 horas.\n\n⚠️ Esta orientación es únicamente informativa y no reemplaza la evaluación de un profesional de salud.`,
        simulated: true,
      });
    }


    const now = new Date();
    const localTimeStr = now.toLocaleString("es-NI", { timeZone: "America/Managua", weekday: 'long', hour: '2-digit', minute: '2-digit' });

    const timeContext = `\n\n[CONTEXTO TEMPORAL ACTUAL IMPORTANTE PARA TRIAGE]
Hora y día actual en Nicaragua: ${localTimeStr}
REGLA ESTRICTA: Los Centros y Puestos de Salud del MINSA atienden únicamente de Lunes a Viernes de 08:00 AM a 4:00 PM. Si la hora actual de arriba está fuera de ese horario (noches o fines de semana), ESTÁN CERRADOS. En caso de síntomas preocupantes fuera de horario laboral, debes REFERIR AL PACIENTE EXCLUSIVAMENTE A HOSPITALES, ya que estos sí atienden 24/7. Es vital para la seguridad no derivarlos a clínicas cerradas.`;

    // Sanitize user input to prevent prompt injection
    function sanitizeForPrompt(value) {
      if (!value) return 'No especificado';
      return String(value)
        .replace(/[\n\r]/g, ' ')
        .replace(/[<>"']/g, '')
        .substring(0, 200);
    }

    let profileContext = "";
    const safeUserProfile = userProfile && typeof userProfile === 'object' ? userProfile : {};
    if (Object.keys(safeUserProfile).length > 0) {
      const safeName = sanitizeForPrompt(safeUserProfile.name);
      const safeCity = sanitizeForPrompt(safeUserProfile.city);
      const safeBloodType = sanitizeForPrompt(safeUserProfile.bloodType);
      const safeConditions = safeUserProfile.healthConditions && safeUserProfile.healthConditions.length > 0
        ? safeUserProfile.healthConditions.map(c => sanitizeForPrompt(c)).join(', ')
        : 'Ninguna reportada';

      profileContext = `\n\n[CONTEXTO DEL PACIENTE]
Nombre: ${safeName || 'No especificado'}
Ciudad: ${safeCity || 'No especificada'}
Tipo de Sangre: ${safeBloodType || 'No especificado'}
Condiciones Médicas Preexistentes: ${safeConditions}

INSTRUCCIÓN IMPORTANTE: Considera estrictamente estas condiciones médicas preexistentes al evaluar los síntomas y proporcionar recomendaciones. Nunca indiques medicamentos contraindicados.`;
    }

    // 1. Obtener SYSTEM_PROMPT dinámico desde Supabase
    let dynamicSystemPrompt = FALLBACK_SYSTEM_INSTRUCTION;

    if (supabase) {
      try {
        const { data: promptData, error: promptError } = await supabase
          .from('ai_configurations')
          .select('config_value')
          .eq('config_key', 'SYSTEM_PROMPT')
          .single();

        if (!promptError && promptData?.config_value) {
          dynamicSystemPrompt = promptData.config_value;
        }
      } catch (dbErr) {
        console.error("Error fetching SYSTEM_PROMPT from Supabase:", dbErr);
      }
    }

    // Combinar el prompt de la BD con el contexto temporal y el perfil médico
    const languageContext = language === "mi" ? "\n\n[INSTRUCCIÓN DE IDIOMA CRÍTICA]\nEL USUARIO HA SELECCIONADO EL IDIOMA MISKITO. DEBES RESPONDER ABSOLUTAMENTE TODAS TUS EVALUACIONES Y RECOMENDACIONES CLÍNICAS EN IDIOMA MISKITO DE LA FORMA MÁS PRECISA POSIBLE, ADAPTANDO LOS TÉRMINOS MÉDICOS PARA QUE SEAN COMPRENSIBLES EN ESE IDIOMA. MANTÉN EL FORMATO ESTRUCTURADO Y LOS EMOJIS, PERO EL TEXTO DEBE SER EN MISKITO." : language === "kr" ? "\n\n[INSTRUCCIÓN DE IDIOMA CRÍTICA]\nEL USUARIO HA SELECCIONADO EL IDIOMA INGLÉS CRIOLLO (KRIOL NICARAGÜENSE). DEBES RESPONDER ABSOLUTAMENTE TODAS TUS EVALUACIONES Y RECOMENDACIONES CLÍNICAS EN INGLÉS CRIOLLO DE LA FORMA MÁS PRECISA POSIBLE, ADAPTANDO LOS TÉRMINOS MÉDICOS PARA QUE SEAN COMPRENSIBLES EN ESE IDIOMA. MANTÉN EL FORMATO ESTRUCTURADO Y LOS EMOJIS, PERO EL TEXTO DEBE SER EN INGLÉS CRIOLLO (KRIOL)." : "";
    const historyContext = `\n\n[USO DEL HISTORIAL DE TRIAGE]
El historial de conversación puede incluir consultas de los últimos 14 días con fecha y hora. Úsalo SOLO cuando los síntomas actuales parezcan relacionados, sean una continuación, recurrencia o empeoramiento de algo previo. Si los síntomas actuales no tienen relación clara con el historial, ignóralo y evalúa la consulta actual por sí sola. No menciones el historial salvo que aporte valor clínico.`;
    const systemPrompt = dynamicSystemPrompt + timeContext + profileContext + languageContext + historyContext;

    // Obtener aiModel dinámico desde Supabase
    let aiModel = "llama-3.3-70b-versatile";
    if (supabase) {
      try {
        const { data: configData, error: configError } = await supabase
          .from('app_settings')
          .select('valor')
          .eq('clave', 'global_config')
          .single();

        if (!configError && configData?.valor?.aiModel) {
          const dbModel = configData.valor.aiModel;
          if (dbModel && !dbModel.startsWith("gemini")) {
            aiModel = dbModel;
          }
        }
      } catch (dbErr) {
        console.error("Error fetching dynamic model config from Supabase in serverless function:", dbErr);
      }
    }

    // Call Groq API
    let responseText = "";
    try {
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: aiModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          temperature: 0.2,
          max_tokens: 1024
        })
      });

      if (!groqResponse.ok) {
        const errBody = await groqResponse.text();
        throw new Error(`Groq API responded with status ${groqResponse.status}: ${errBody}`);
      }

      const groqData = await groqResponse.json();
      responseText = groqData.choices?.[0]?.message?.content || "";
    } catch (sendErr) {
      console.error("Groq Send Message Error:", sendErr);
      if (sendErr.message?.includes("safety") || sendErr.message?.includes("refuse")) {
        return res.status(200).json({
          text: "Lo siento, no puedo procesar esa consulta por razones de seguridad. Por favor, intenta describir tus síntomas de forma más directa.",
          simulated: false
        });
      }
      throw sendErr;
    }

    // Try to log the chat interaction to the database (fail silently if table doesn't exist)
    if (supabase) {
      try {
        const userId = userProfile?.id;
        await supabase.from('chat_logs').insert({
          user_id: userId || null,
          message_length: message.length,
          created_at: new Date().toISOString()
        });
      } catch (logErr) {
        console.warn("Could not log chat interaction to Supabase in serverless function:", logErr);
      }
    }

    return res.status(200).json({
      text: responseText || "El asistente recibió la consulta pero no pudo generar una respuesta clara.",
      simulated: false,
    });
  } catch (error) {
    console.error("Chat API Error:", error);

    const errorMessage = error?.message || String(error) || "Error desconocido";
    const userMessageBody = req.body?.message || "los síntomas descritos";

    let userMessage = "Ocurrió un error procesando el triaje virtual con IA.";
    let shouldUseFallback = false;

    if (errorMessage.includes("API_KEY") || errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("PERMISSION")) {
      userMessage = "Error de autenticación con la API de Groq. Verifica que la API key sea válida.";
    } else if (errorMessage.includes("SAFETY")) {
      userMessage = "La respuesta fue bloqueada por filtros de seguridad. Intenta reformular tu consulta.";
    } else if (errorMessage.includes("quota") || errorMessage.includes("429") || errorMessage.includes("Too Many Requests")) {
      userMessage = "Cuota de API excedida. Usando modo de respuesta simulada para continuar.";
      shouldUseFallback = true;
      console.log("API quota exceeded, switching to simulated mode");
    }

    if (shouldUseFallback) {
      return res.status(200).json({
        text: `**Estado de Prioridad:** 🟡 Urgencia\n\n🔍 **EVALUACIÓN CLÍNICA**\nLos síntomas reportados ("${userMessageBody}") sugieren un cuadro que requiere atención en las próximas horas. Aunque no parece una emergencia inmediata, es crucial monitorear la evolución y seguir las recomendaciones.\n\n✅ **PROTOCOLO SUGERIDO**\n🔹 Mantener reposo y una hidratación adecuada con suero oral.\n🔹 Vigilar la aparición de signos de alarma como fiebre alta persistente, dificultad para respirar o dolor intenso.\n🔹 Considerar acudir a un centro de salud si los síntomas no mejoran en 24 horas.\n\n⚠️ Esta orientación es únicamente informativa y no reemplaza la evaluación de un profesional de salud.`,
        simulated: true,
        warning: "Respuesta generada en modo simulado debido a limitaciones temporales de la API."
      });
    }

    return res.status(500).json({
      error: userMessage,
      timestamp: new Date().toISOString(),
    });
  }
}

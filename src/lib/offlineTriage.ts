import { TRIAGE_DATABASE, TriageRecord } from "../data/triageDatabase";
import { UserProfile } from "../types";

function normalize(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const STOP_WORDS = new Set(["tengo", "me", "duele", "siento", "un", "una", "el", "la", "los", "las", "con", "de", "en", "por", "para", "mucho", "mucha", "poco", "que", "hace", "dias", "horas", "estoy", "muy", "fuerte"]);

export function getOfflineTriageResponse(query: string, userProfile: UserProfile): string {
  const normalizedQuery = normalize(query);
  const words = normalizedQuery.split(/\W+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  
  if (words.length === 0) {
    words.push(...normalizedQuery.split(/\W+/).filter(w => w.length > 3));
  }

  let bestMatch: TriageRecord | null = null;
  let maxScore = 0;

  for (const record of TRIAGE_DATABASE) {
    let score = 0;
    
    for (const symptom of record.symptoms) {
      if (normalizedQuery.includes(normalize(symptom))) {
        score += 10;
      }
    }

    for (const word of words) {
      for (const keyword of record.keywords) {
        const normKey = normalize(keyword);
        if (normKey === word) {
          score += 5;
        } else if (normKey.includes(word) || word.includes(normKey)) {
          score += 2;
        }
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = record;
    }
  }

  if (!bestMatch || maxScore < 2) {
    return `Nivel de prioridad: 🟡 Moderado\n\n🔍 EVALUACIÓN INICIAL\nNo he podido identificar un patrón claro para tus síntomas ("${query}") en mi base de datos sin conexión. Sin embargo, cualquier malestar desconocido debe ser monitoreado cuidadosamente.\n\n✅ RECOMENDACIONES\n🔹 Mantente hidratado y en reposo absoluto.\n🔹 Observa si aparece fiebre alta, dificultad para respirar o dolor intenso.\n🔹 Si los síntomas empeoran rápidamente, busca ayuda médica de inmediato.\n\n⚠️ Esta orientación es únicamente informativa y no reemplaza la evaluación de un profesional de salud.\n\nCENTROS DE REFERENCIA EN GRANADA:\n- Hospital Bautista (hospital general - abierto 24h)\n- Centro de Salud Sócrates Flores (para casos no graves, cierra a las 8:00 p.m.)\n- Hospital Amistad Japón Nicaragua (servicios avanzados especializados)\n- Emergencias: Llamar al 118`;
  }

  let emoji = "🟢 Leve";
  if (bestMatch.severity === "emergencia") emoji = "🔴 Alta urgencia";
  else if (bestMatch.severity === "urgencia") emoji = "🟡 Moderado";

  let response = `Nivel de prioridad: ${emoji}\n\n`;

  response += `🔍 EVALUACIÓN INICIAL\n`;
  response += `El análisis de los síntomas sin conexión indica posibles coincidencias con **${bestMatch.symptoms[0]}**. `;
  response += `Las posibles causas asociadas a este cuadro son: ${bestMatch.possibleCauses.join(", ")}.\n\n`;

  response += `✅ RECOMENDACIONES\n`;
  response += bestMatch.recommendations.map(r => `🔹 ${r}`).join("\n") + "\n";
  if (bestMatch.warningSigns.length > 0) {
    response += `🔹 Señales de alarma a vigilar: ${bestMatch.warningSigns.join(", ")}\n`;
  }
  response += "\n";

  response += `⚠️ Esta orientación es únicamente informativa y no reemplaza la evaluación de un profesional de salud.\n\n`;

  response += `CENTROS DE REFERENCIA EN GRANADA:\n`;
  response += `- Hospital Bautista (hospital general - abierto 24h)\n`;
  response += `- Centro de Salud Sócrates Flores (para casos no graves, cierra a las 8:00 p.m.)\n`;
  response += `- Hospital Amistad Japón Nicaragua (servicios avanzados especializados)\n`;
  response += `- Emergencias: Llamar al 118`;

  return response;
}

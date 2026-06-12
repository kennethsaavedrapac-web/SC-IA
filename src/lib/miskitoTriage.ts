// ═══════════════════════════════════════════════════════════════════════════════
// MOTOR DE TRIAJE EN IDIOMA MISKITO
// ═══════════════════════════════════════════════════════════════════════════════
// Este motor se activa EXCLUSIVAMENTE cuando language === 'mi' (Miskito).
// Cuando está activo, la app NO llama a la API de IA — usa la base de datos
// local miskitoTriageDatabase.ts para generar respuestas completamente en Miskito.
// ═══════════════════════════════════════════════════════════════════════════════

import { MISKITO_TRIAGE_DATABASE, MiskitoTriageRecord } from "../data/miskitoTriageDatabase";
import { UserProfile } from "../types";

/**
 * Normaliza un string removiendo acentos y convirtiendo a minúsculas.
 * Miskito usa caracteres especiales como î, pero la normalización
 * permite matching más flexible.
 */
function normalize(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Stop words en Miskito — palabras muy comunes que no aportan
 * significado clínico para el matching de síntomas.
 */
const MISKITO_STOP_WORDS = new Set([
  // Pronombres y artículos
  "yang", "man", "witin", "yawan", "nani", "ba", "ra", "wal",
  "wina", "kata", "sa", "kan", "kum", "kumi", "baha", "naha",
  // Verbos auxiliares comunes
  "brisna", "brisa", "brisma", "brin", "daukisna", "daukisa",
  "lukisna", "lukisa", "takisa", "sna", "sma",
  // Adverbios y preposiciones comunes
  "pali", "tara", "sampi", "pain", "saura", "ailal",
  // Palabras de conexión
  "bara", "kaka", "dukiara", "baku", "sin", "kli",
  // Español mezclado común en conversación
  "tengo", "me", "duele", "siento", "estoy", "muy", "mucho",
  "que", "con", "por", "para", "una", "los", "las",
  // Inglés común
  "have", "feel", "lot", "very", "the", "and"
]);

/**
 * Motor principal de triaje en Miskito.
 * Analiza el texto del usuario, busca coincidencias en la base de datos
 * de triaje Miskito, y genera una respuesta completa en idioma Miskito.
 */
export function getMiskitoTriageResponse(query: string, userProfile: UserProfile): string {
  const normalizedQuery = normalize(query);
  const words = normalizedQuery
    .split(/\W+/)
    .filter(w => w.length > 2 && !MISKITO_STOP_WORDS.has(w));

  // Si después de filtrar stop words no quedan palabras, usar palabras más largas
  if (words.length === 0) {
    words.push(...normalizedQuery.split(/\W+/).filter(w => w.length > 3));
  }

  let bestMatch: MiskitoTriageRecord | null = null;
  let maxScore = 0;

  for (const record of MISKITO_TRIAGE_DATABASE) {
    let score = 0;

    // Match por síntomas completos (peso alto)
    for (const symptom of record.symptoms) {
      if (normalizedQuery.includes(normalize(symptom))) {
        score += 12;
      }
    }

    // Match por palabras clave individuales
    for (const word of words) {
      for (const keyword of record.keywords) {
        const normKey = normalize(keyword);
        if (normKey === word) {
          score += 6; // Match exacto
        } else if (normKey.includes(word) || word.includes(normKey)) {
          score += 3; // Match parcial
        }
      }
    }

    // Match por síntomas parciales (palabras individuales del síntoma)
    for (const symptom of record.symptoms) {
      const symptomWords = normalize(symptom).split(/\W+/).filter(w => w.length > 2);
      for (const word of words) {
        for (const sw of symptomWords) {
          if (sw === word) {
            score += 4;
          } else if (sw.includes(word) || word.includes(sw)) {
            score += 1;
          }
        }
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = record;
    }
  }

  // Si no hay coincidencia suficiente, dar respuesta genérica en Miskito
  if (!bestMatch || maxScore < 2) {
    return formatNoMatchResponse(query);
  }

  return formatMatchedResponse(bestMatch);
}

/**
 * Formatea la respuesta cuando se encontró una coincidencia en la base de datos.
 */
function formatMatchedResponse(record: MiskitoTriageRecord): string {
  // Determinar emoji y texto de severidad en Miskito
  let severityEmoji = "🟢 Sampi";
  let severityText = "Rutina — duktur ra waia sip sa taim brisma kaka";
  if (record.severity === "emergencia") {
    severityEmoji = "🔴 Emergencia tara";
    severityText = "IMPLIK duktur ra waia sa — taim swiaia apia";
  } else if (record.severity === "urgencia") {
    severityEmoji = "🟡 Urgencia";
    severityText = "Duktur ra implik waia sa — yu kumi ra";
  }

  let response = `Prioridad nivel: ${severityEmoji}\n`;
  response += `${severityText}\n\n`;

  // Evaluación inicial
  response += `🔍 EVALUACIÓN PAS (Kaikanka Pas)\n`;
  response += `Siknis kaikanka ba **${record.symptoms[0]}** wal prukisa. `;
  response += `Naha siknis nani lakara sip sa: ${record.possibleCauses.join(", ")}.\n\n`;

  // Recomendaciones
  response += `✅ REKOMENDASHON NANI (Nahki daukaia)\n`;
  response += record.recommendations.map(r => `🔹 ${r}`).join("\n") + "\n";

  // Señales de alarma
  if (record.warningSigns.length > 0) {
    response += `\n⚠️ ALART SEÑAL NANI (Kaiki kaia sa)\n`;
    response += record.warningSigns.map(w => `🚨 ${w}`).join("\n") + "\n";
  }

  response += "\n";

  // Disclaimer en Miskito
  response += `⚠️ Naha ba informeshan baman sa — duktur evaluación ba remplais munras.\n\n`;

  // Centros de referencia
  response += `SIKNIS WATLA NANI GRANADA RA:\n`;
  response += `🏥 Hospital Bautista (hospital general — 24h kan)\n`;
  response += `🏥 Centro de Salud Sócrates Flores (siknis sampi nani dukiara — 8:00 p.m. kat)\n`;
  response += `🏥 Hospital Amistad Japón Nicaragua (siknis tara nani dukiara)\n`;
  response += `📞 Emergencia: 128 ra aisas`;

  return response;
}

/**
 * Respuesta genérica cuando no se encuentra coincidencia — en Miskito.
 */
function formatNoMatchResponse(query: string): string {
  return `Prioridad nivel: 🟡 Urgencia sampi\n\n` +
    `🔍 EVALUACIÓN PAS (Kaikanka Pas)\n` +
    `Man siknis "${query}" ba yang base de datos ra sakaia sip apia. ` +
    `Bankra, siknis kum sin nu takras ba pain kaiki kaia sa.\n\n` +
    `✅ REKOMENDASHON NANI (Nahki daukaia)\n` +
    `🔹 Li ailal dis bara ayan pali mangkaia.\n` +
    `🔹 Kaiks — wina urwanka tara takisa kaka, pasa sakaia trabil kaka, prukanka tara kaka.\n` +
    `🔹 Siknis ba kli kli tara takisa kaka, implik duktur ra waia sa.\n` +
    `🔹 Man siknis ba Miskito ra aisas — yang pain kaikaia trai muni.\n\n` +
    `⚠️ Naha ba informeshan baman sa — duktur evaluación ba remplais munras.\n\n` +
    `SIKNIS WATLA NANI GRANADA RA:\n` +
    `🏥 Hospital Bautista (hospital general — 24h kan)\n` +
    `🏥 Centro de Salud Sócrates Flores (siknis sampi nani dukiara — 8:00 p.m. kat)\n` +
    `🏥 Hospital Amistad Japón Nicaragua (siknis tara nani dukiara)\n` +
    `📞 Emergencia: 128 ra aisas`;
}

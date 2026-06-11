import Fuse from "fuse.js";
import { TRIAGE_DATABASE, TriageRecord } from "../data/triageDatabase";
import { UserProfile } from "../types";

const fuseOptions = {
  keys: ["keywords", "symptoms"],
  threshold: 0.4, // Lower is more strict. 0.4 allows some fuzziness
  includeScore: true,
  ignoreLocation: true, // Don't restrict search to start of the string
};

const fuse = new Fuse(TRIAGE_DATABASE, fuseOptions);

export function getOfflineTriageResponse(query: string, userProfile: UserProfile): string {
  const results = fuse.search(query);
  
  if (results.length === 0) {
    return "No pude encontrar una coincidencia exacta para tus síntomas en mi base de datos sin conexión. Por favor, asegúrate de descansar, mantenerte hidratado y buscar ayuda médica si los síntomas empeoran o son severos.";
  }

  const bestMatch = results[0].item as TriageRecord;

  let emoji = "🟢 Leve";
  if (bestMatch.severity === "emergencia") emoji = "🔴 Alta urgencia";
  else if (bestMatch.severity === "urgencia") emoji = "🟡 Moderado";

  let response = `Nivel de prioridad: ${emoji}\n\n`;

  response += `🔍 EVALUACIÓN INICIAL\n`;
  response += `El análisis de los síntomas sin conexión indica posibles coincidencias con **${bestMatch.symptoms[0].toLowerCase()}**. `;
  response += `Las posibles causas reportadas usualmente bajo este cuadro son: ${bestMatch.possibleCauses.join(", ")}.\n\n`;

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

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

  let response = `He analizado tus síntomas desde mi base de datos sin conexión y encontré coincidencias con **${bestMatch.symptoms[0]}**.\n\n`;
  
  response += "### 💡 Posibles causas comunes:\n";
  response += bestMatch.possibleCauses.map(c => `- ${c}`).join("\n") + "\n\n";

  response += "### ✅ Recomendaciones iniciales:\n";
  response += bestMatch.recommendations.map(r => `- ${r}`).join("\n") + "\n\n";

  response += "### ⚠️ Señales de alarma (Busca ayuda si presentas):\n";
  response += bestMatch.warningSigns.map(w => `- ${w}`).join("\n") + "\n\n";

  if (bestMatch.severity === "emergencia") {
    response += "**🚨 URGENCIA MÉDICA:** Por los síntomas descritos, te sugiero buscar atención médica de emergencia de inmediato.";
  } else if (bestMatch.severity === "urgencia") {
    response += "**⚠️ ATENCIÓN REQUERIDA:** Sería recomendable que un médico evalúe estos síntomas pronto si no mejoran.";
  } else {
    response += "**ℹ️ NOTA:** Estos son consejos médicos generales offline. Si los síntomas persisten, contacta a un profesional de la salud.";
  }

  return response;
}

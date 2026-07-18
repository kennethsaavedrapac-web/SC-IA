







import { MISKITO_TRIAGE_DATABASE, MiskitoTriageRecord } from "../data/miskitoTriageDatabase";
import { UserProfile } from "../types";

function normalize(str: string = ""): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Stop words extendidas en Miskito y español/inglés mezclado.
 */
const MISKITO_STOP_WORDS = new Set([
  // Miskito
  "yang", "man", "witin", "yawan", "nani", "ba", "ra", "wal",
  "wina", "kata", "sa", "kan", "kum", "kumi", "baha", "naha",
  "brisna", "brisa", "brisma", "brin", "daukisna", "daukisa",
  "lukisna", "lukisa", "takisa", "sna", "sma",
  "pali", "tara", "sampi", "pain", "saura", "ailal",
  "bara", "kaka", "dukiara", "baku", "sin", "kli",

  "tengo", "me", "duele", "siento", "estoy", "muy", "mucho",
  "que", "con", "por", "para", "una", "los", "las", "el", "la",

  "have", "feel", "lot", "very", "the", "and", "with"
]);


interface PreProcessedRecord extends MiskitoTriageRecord {
  normSymptoms: string[];
  normKeywords: string[];
  symptomWordsList: string[];
}

let cachedDatabase: PreProcessedRecord[] | null = null;

function getOptimizedDatabase(): PreProcessedRecord[] {
  if (!cachedDatabase) {
    cachedDatabase = MISKITO_TRIAGE_DATABASE.map(record => ({
      ...record,
      normSymptoms: record.symptoms.map(normalize),
      normKeywords: record.keywords.map(normalize),
      symptomWordsList: record.symptoms.flatMap(s =>
        normalize(s).split(/\W+/).filter(w => w.length > 2)
      )
    }));
  }
  return cachedDatabase;
}

export function getMiskitoTriageResponse(query: string, userProfile: UserProfile): string {
  const normalizedQuery = normalize(query);
  let words = normalizedQuery
    .split(/\W+/)
    .filter(w => w.length > 2 && !MISKITO_STOP_WORDS.has(w));


  if (words.length === 0) {
    words = normalizedQuery.split(/\W+/).filter(w => w.length > 3);
  }

  const database = getOptimizedDatabase();
  let bestMatch: PreProcessedRecord | null = null;
  let maxScore = 0;


  for (let i = 0; i < database.length; i++) {
    const record = database[i];
    let score = 0;


    for (let j = 0; j < record.normSymptoms.length; j++) {
      if (normalizedQuery.includes(record.normSymptoms[j])) {
        score += 15;
      }
    }


    for (let w = 0; w < words.length; w++) {
      const word = words[w];


      for (let k = 0; k < record.normKeywords.length; k++) {
        const normKey = record.normKeywords[k];
        if (normKey === word) {
          score += 8;
        } else if (normKey.includes(word) || word.includes(normKey)) {
          score += 3;
        }
      }


      for (let sw = 0; sw < record.symptomWordsList.length; sw++) {
        const symptomWord = record.symptomWordsList[sw];
        if (symptomWord === word) {
          score += 5;
        } else if (symptomWord.includes(word) || word.includes(symptomWord)) {
          score += 2;
        }
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = record;
    }
  }


  if (!bestMatch || maxScore < 4) {
    return formatNoMatchResponse(query);
  }

  return formatMatchedResponse(bestMatch);
}

function formatMatchedResponse(record: MiskitoTriageRecord): string {
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

  response += `🔍 EVALUACIÓN PAS (Kaikanka Pas)\n`;
  response += `Siknis kaikanka ba **${record.symptoms[0]}** wal prukisa. `;
  response += `Naha siknis nani lakara sip sa: ${record.possibleCauses.join(", ")}.\n\n`;

  response += `✅ REKOMENDASHON NANI (Nahki daukaia)\n`;
  response += record.recommendations.map(r => `🔹 ${r}`).join("\n") + "\n";

  if (record.warningSigns.length > 0) {
    response += `\n⚠️ ALART SEÑAL NANI (Kaiki kaia sa)\n`;
    response += record.warningSigns.map(w => `🚨 ${w}`).join("\n") + "\n";
  }

  response += `\n⚠️ Naha ba informeshan baman sa — duktur evaluación ba remplais munras.\n\n`;

  response += `SIKNIS WATLA NANI GRANADA RA:\n`;
  response += `🏥 Hospital Bautista (hospital general — 24h kan)\n`;
  response += `🏥 Centro de Salud Sócrates Flores (siknis sampi nani dukiara — 8:00 p.m. kat)\n`;
  response += `🏥 Hospital Amistad Japón Nicaragua (siknis tara nani dukiara)\n`;
  response += `📞 Emergencia: 128 ra aisas`;

  return response;
}

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

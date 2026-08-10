import { KRIOL_TRIAGE_DATABASE, KriolTriageRecord } from "../data/kriolTriageDatabase";
import { UserProfile } from "../types";

function normalize(str: string = ""): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Stop words extendidas en Kriol y español/inglés mezclado.
 */
const KRIOL_STOP_WORDS = new Set([
  // Kriol / English
  "mi", "yu", "yuh", "im", "ih", "shi", "wi", "dem", "di", "ah", "inna", "pan", "pon", "wid", "fi", "to", "and", "or", "but", "so", "dat", "dis",
  "have", "feel", "lot", "very", "the", "with", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "bad", "good", "much", "too", "really",

  // Español
  "tengo", "me", "duele", "siento", "estoy", "muy", "mucho",
  "que", "con", "por", "para", "una", "los", "las", "el", "la"
]);


interface PreProcessedRecord extends KriolTriageRecord {
  normSymptoms: string[];
  normKeywords: string[];
  symptomWordsList: string[];
}

let cachedDatabase: PreProcessedRecord[] | null = null;

function getOptimizedDatabase(): PreProcessedRecord[] {
  if (!cachedDatabase) {
    cachedDatabase = KRIOL_TRIAGE_DATABASE.map(record => ({
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

export function getKriolTriageResponse(query: string, userProfile: UserProfile): string {
  const normalizedQuery = normalize(query);
  let words = normalizedQuery
    .split(/\W+/)
    .filter(w => w.length > 2 && !KRIOL_STOP_WORDS.has(w));


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

function formatMatchedResponse(record: KriolTriageRecord): string {
  let severityEmoji = "🟢 Low";
  let severityText = "Routine — yuh can go see docta when yuh get time";
  if (record.severity === "emergencia") {
    severityEmoji = "🔴 Emergency bad";
    severityText = "GO DA HOSPITAL RIGHT NOW — nuh waste time";
  } else if (record.severity === "urgencia") {
    severityEmoji = "🟡 Urgent";
    severityText = "Yuh need fi see docta soon — inna 24 hours";
  }

  let response = `Priority level: ${severityEmoji}\n`;
  response += `${severityText}\n\n`;

  response += `🔍 FIRST LOOK (Evaluación)\n`;
  response += `Di sickness yuh have look like **${record.symptoms[0]}**. `;
  response += `Dis could be: ${record.possibleCauses.join(", ")}.\n\n`;

  response += `✅ WHA YUH FI DO (Recomendaciones)\n`;
  response += record.recommendations.map(r => `🔹 ${r}`).join("\n") + "\n";

  if (record.warningSigns.length > 0) {
    response += `\n⚠️ WATCH OUT FI DIS (Señales de Alerta)\n`;
    response += record.warningSigns.map(w => `🚨 ${w}`).join("\n") + "\n";
  }

  response += `\n⚠️ Dis a jus information — yuh still need docta fi check yuh propa.\n\n`;

  response += `HOSPITAL DEM INNA GRANADA:\n`;
  response += `🏥 Hospital Bautista (general hospital — open 24h)\n`;
  response += `🏥 Centro de Salud Sócrates Flores (fi light sickness — open till 8:00 p.m.)\n`;
  response += `🏥 Hospital Amistad Japón Nicaragua (fi serious sickness)\n`;
  response += `📞 Emergency: Call 128`;

  return response;
}

function formatNoMatchResponse(query: string): string {
  return `Priority level: 🟡 Urgent (Not sure)\n\n` +
    `🔍 FIRST LOOK (Evaluación)\n` +
    `Mi caan find exactly wha dat "${query}" mean inna mi system right now. ` +
    `But yuh still need fi tek care a yuhself.\n\n` +
    `✅ WHA YUH FI DO (Recomendaciones)\n` +
    `🔹 Drink nuff wata an rest yuh badi.\n` +
    `🔹 Watch out if yuh get high fever, caan breath good, or severe pain.\n` +
    `🔹 If yuh feel worst, yuh beta go da hospital quick.\n` +
    `🔹 Yuh can try splain yuh sickness again inna Kriol — mi a go try ondastan.\n\n` +
    `⚠️ Dis a jus information — yuh still need docta fi check yuh propa.\n\n` +
    `HOSPITAL DEM INNA GRANADA:\n` +
    `🏥 Hospital Bautista (general hospital — open 24h)\n` +
    `🏥 Centro de Salud Sócrates Flores (fi light sickness — open till 8:00 p.m.)\n` +
    `🏥 Hospital Amistad Japón Nicaragua (fi serious sickness)\n` +
    `📞 Emergency: Call 128`;
}

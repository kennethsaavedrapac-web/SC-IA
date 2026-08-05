export interface KriolTriageRecord {
  id: string;
  symptoms: string[];
  keywords: string[];
  severity: "rutina" | "urgencia" | "emergencia";
  possibleCauses: string[];
  recommendations: string[];
  warningSigns: string[];
}

export const KRIOL_TRIAGE_DATABASE: KriolTriageRecord[] = [
  {
    id: "fever_high",
    symptoms: ["High fever", "Body feel hot hot", "Chills an sweat", "Headache wid di fever"],
    keywords: ["fever", "hot", "burn", "sweat", "chills", "calentura", "fiebre", "body", "sick", "warm", "badi"],
    severity: "urgencia",
    possibleCauses: ["Viral infection", "Flu", "Dengue", "Malaria"],
    recommendations: ["Tek some Paracetamol fi drop di fever.", "Drink nuff wata or coconut wata.", "Put a wet rag pon yuh forehead.", "Res yuh badi in a cool place."],
    warningSigns: ["Fever nuh drop afta 3 days.", "Yuh caan breath good.", "Yuh feel confuse or dizzy."]
  },
  {
    id: "stomach_pain",
    symptoms: ["Belly hurt bad", "Stomach ache", "Cramp inna belly", "Belly feel swell up"],
    keywords: ["belly", "stomach", "pain", "cramp", "hurt", "byara", "panza", "dolor", "ache", "swell"],
    severity: "urgencia",
    possibleCauses: ["Food poison", "Gastritis", "Appendix problem", "Gastroenteritis"],
    recommendations: ["Nuh nyam nuh heavy food right now.", "Drink sips of wata or oral serum.", "Rest yuh belly an lie dung.", "Nuh tek strong pain pill without docta."],
    warningSigns: ["Pain start side right lowa belly (appendix).", "Yuh a vomit blood or look like coffee ground.", "Yuh belly feel hard like board."]
  },
  {
    id: "breathing_problem",
    symptoms: ["Caan catch breath", "Chest feel tight", "Breath a whistle", "Shortness of breath"],
    keywords: ["breath", "chest", "air", "whistle", "tight", "asthma", "breathe", "lungs", "pecho", "pasa", "asma", "choke"],
    severity: "emergencia",
    possibleCauses: ["Asthma attack", "Pneumonia", "Heart problem", "Severe allergy"],
    recommendations: ["Sit up straight, nuh lie dung.", "Use inhaler if yuh have one.", "Loose up any tight clothes round yuh neck.", "GO DA HOSPITAL RIGHT NOW."],
    warningSigns: ["Yuh lip or nail dem turn blue or grey.", "Yuh caan talk cause yuh a gasp fi air.", "Yuh chest hurt wid di breathing problem."]
  },
  {
    id: "cut_bleeding",
    symptoms: ["Deep cut", "Bleeding nuh stop", "Machete cut", "Blood a run"],
    keywords: ["cut", "blood", "bleed", "wound", "machete", "knife", "tala", "sangre", "herida", "corte", "chop"],
    severity: "urgencia",
    possibleCauses: ["Accident", "Tool injury", "Fall"],
    recommendations: ["Wash di cut wid wata an soap.", "Press a clean cloth hard pon di cut fi 10-15 mins.", "Raise di arm or leg higha dan yuh heart.", "Nuh tek off di cloth if blood soak it, put anoda one on top."],
    warningSigns: ["Blood a squirt out like pump (artery cut).", "Yuh can see bone or deep meat.", "Di bleeding neva stop afta 20 mins of pressing."]
  },
  {
    id: "diarrhea_vomiting",
    symptoms: ["Runny belly", "Vomiting", "Caan keep food dung", "Watery stool"],
    keywords: ["diarrhea", "vomit", "runny", "belly", "throw up", "watery", "stool", "sick", "nausea", "kwih", "li"],
    severity: "rutina",
    possibleCauses: ["Gastroenteritis", "Food poison", "Parasites"],
    recommendations: ["Drink nuff oral serum (Suero Oral).", "Nyam dry food like plain rice or cracker.", "Nuh drink milk or nyam greasy food.", "Wait 30 mins afta vomit fi drink wata."],
    warningSigns: ["Yuh pass out blood inna yuh stool.", "Yuh caan pee cause yuh dry out (dehydrated).", "Vomit nuh stop fi 24 hours."]
  }
];

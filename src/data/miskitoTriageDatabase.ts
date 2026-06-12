// ═══════════════════════════════════════════════════════════════════════════════
// BASE DE DATOS COMPLETA DE TRIAJE MÉDICO EN IDIOMA MISKITO
// ═══════════════════════════════════════════════════════════════════════════════
// Esta base de datos se usa EXCLUSIVAMENTE cuando la app detecta que el idioma
// seleccionado es Miskito ("mi"). Cuando está en Miskito, la app NO llama a la
// API de IA (Gemini) — en su lugar usa esta base de datos local para generar
// respuestas de triaje directamente en Miskito.
//
// Contiene 25+ condiciones médicas comunes en la Costa Caribe de Nicaragua,
// cada una con: síntomas, palabras clave, severidad, posibles causas,
// recomendaciones detalladas y señales de alarma — TODO en idioma Miskito.
// ═══════════════════════════════════════════════════════════════════════════════

export interface MiskitoTriageRecord {
  id: string;
  symptoms: string[];
  keywords: string[];
  severity: "rutina" | "urgencia" | "emergencia";
  possibleCauses: string[];
  recommendations: string[];
  warningSigns: string[];
}

export const MISKITO_TRIAGE_DATABASE: MiskitoTriageRecord[] = [
  // ═══════════════════════════════════════════════════════════════════
  // 1. WINA URWANKA TARA — Fiebre Alta
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "wina_urwanka_tara",
    symptoms: [
      "Wina urwanka tara",
      "Temperatura pura manas",
      "Kupia kli prukanka",
      "Kupia puski tara",
      "Wina laihwan"
    ],
    keywords: [
      "wina", "urwanka", "temperatura", "laihwan", "puski", "kli",
      "fiebre", "calentura", "urwan", "laih", "pali", "arder",
      "kupia", "kyama", "taya", "angki", "hirviendo", "caliente",
      "escalofrio", "sudor", "frio", "quema", "hot", "fever"
    ],
    severity: "urgencia",
    possibleCauses: [
      "Virus infekshan",
      "Gripe (Influenza)",
      "Bakteria infekshan",
      "Covid-19",
      "Dengue"
    ],
    recommendations: [
      "Paracetamol (acetaminofén) dis, wina urwanka mayunaia dukiara.",
      "Li ailal dis — li, suero oral, bara fruta juice nani dis. Dihidrateshan lakara kaia apia dukiara.",
      "Paña liwan wal man lal ra, kyama munhtara, bara kuyus ra mangks — wina urwanka klakaia dukiara.",
      "Tasba kumi pasa ra, pasa pain bara wingka laka ra ayan.",
      "Wina urwanka ba 38.5°C purara kaka, duktur ra waia sa."
    ],
    warningSigns: [
      "Wina urwanka 39.5°C purara ba, midisin wal sin klahwras kaka.",
      "Pasa sakaia trabil brisma kaka, bara lal kuyus kyama tara prukisa kaka.",
      "Luki trabil tara, luki dahra pain sakras kaka, bara wina prukanka tara brisma kaka."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 2. DENGUE / ZIKA / CHIKUNGUNYA
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "dengue_zika_chikungunya",
    symptoms: [
      "Dusa prukanka tara",
      "Nakra nina prukanka",
      "Taya ra manka pauni nani",
      "Wina urwanka dusa prukanka wal",
      "Kyama prukanka ailal"
    ],
    keywords: [
      "dengue", "zika", "chikungunya", "dusa", "nakra", "manka",
      "zancudo", "mosquito", "wasla", "kyama", "wina", "prukanka",
      "taya", "pauni", "sarpullido", "manchas", "huesos", "ojos",
      "articulaciones", "cuerpo", "rompehuesos"
    ],
    severity: "urgencia",
    possibleCauses: [
      "Dengue (wasla ikan wina)",
      "Chikungunya",
      "Zika"
    ],
    recommendations: [
      "Paracetamol baman dis. ¡ASPIRINA, IBUPROFENO, NAPROXENO DIMA APIA! (tala taki sip ba dukiara).",
      "Li ailal pali dis — suero oral, li, coco li — dihidrateshan tara lakara kaia apia dukiara.",
      "Ayan pali, watla ra, mosquitero munhtara ayan.",
      "Wasla (zancudo) nani klahwaia dukiara li kan nani sut sakaia sa.",
      "Duktur ra was, tala test daukaia dukiara."
    ],
    warningSigns: [
      "Byara prukanka tara, swi takras ba.",
      "Tala takisa — napa tala, kakma tala, bara taya ra manka tihmia nani (petequias) takisa kaka.",
      "Kupia kriwan pali pali, bara luki trabil brisma kaka."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 3. MALARIA (PALUDISMO)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "malaria_paludismo",
    symptoms: [
      "Kupia kli prukanka tara tara",
      "Kupia puski ailal",
      "Wina urwanka kli kli takisa",
      "Wina kyama tara",
      "Kupia kli tara"
    ],
    keywords: [
      "malaria", "paludismo", "kyama", "terciana", "kupia", "kli",
      "puski", "sudar", "zancudo", "wasla", "unta", "selva",
      "temblor", "escalofrio", "frio", "sudor"
    ],
    severity: "urgencia",
    possibleCauses: [
      "Malaria (Paludismo) — wasla ikan wina takisa"
    ],
    recommendations: [
      "Malaria ba siknis watla ra diagnóstico daukaia sa — tala test (gota gruesa) wal.",
      "Li ailal dis, bara wina urwanka ba paracetamol wal klakaia trai muns.",
      "Implik pali, siknis watla lamara ba ra was.",
      "Malaria midisin ba duktur baman yabaia sip sa — man baman dima apia."
    ],
    warningSigns: [
      "Wina urwanka tara tara, bara nakra bara taya lalahni (ictericia) takisa kaka.",
      "Wina swahwanka tara, taukaia sin sip apia kaka.",
      "Pasa sakaia trabil brisma kaka."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 4. LEL PRUKANKA — Dolor de Cabeza
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "lel_prukanka",
    symptoms: [
      "Lel prukanka",
      "Migraña",
      "Lel ra prukanka tara",
      "Lel ra pik pik prukisa",
      "Lel tara prukanka"
    ],
    keywords: [
      "lel", "prukanka", "migraña", "cefalea", "cabeza", "dolor",
      "presion", "punzadas", "nuca", "cerebro", "lal", "pik",
      "headache", "head"
    ],
    severity: "rutina",
    possibleCauses: [
      "Tension — wark tara bara trabil ailal wina",
      "Migraña",
      "Li dis apia — dihidrateshan",
      "Yapaia pain apia — yap apia",
      "Nakra kaikaia trabil — nakra lens",
      "Kupia trabil (estrés)"
    ],
    recommendations: [
      "Watla tihmia kum ra ayan, saun apia, pantalla nani sin apia.",
      "Paracetamol kaka ibuprofeno kum dis — prukanka klakaia dukiara.",
      "Li glas wal kaka yuhmpa dis — dihidrateshan lakara kaia apia dukiara kaiki.",
      "Paña tahpla kum lal ra mangks, kaka lal nina ra — prukanka klakaia dukiara."
    ],
    warningSigns: [
      "Lel prukanka 'tara pali pali' ba, pat kli witin tanka apia — implik takisa kaka.",
      "Nakra kaikaia sip apia kaka, wina pali kum swahwan kaka, bara aisaia trabil brisma kaka.",
      "Wina urwanka tara bara lal kuyus kyama tara prukisa kaka."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 5. KUPIA SIKNIS — Dificultad Respiratoria
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "kupia_siknis_pasa",
    symptoms: [
      "Pasa sakaia trabil",
      "Pasa sip apia",
      "Kupia siknis tara",
      "Kupia tara krukisa",
      "Pasa ba whistle baku aisisa"
    ],
    keywords: [
      "pasa", "sakaia", "respirar", "ahogo", "asfixia", "kupia",
      "pulmones", "asma", "ahogando", "sofoco", "silbido", "aire",
      "pecho", "trabil", "sip", "apia", "breath", "whistle"
    ],
    severity: "emergencia",
    possibleCauses: [
      "Asma atake",
      "Alergia tara (reacción alérgica severa)",
      "Neumonía (pulmones infekshan)",
      "Kupia trabil (problema cardíaco)",
      "EPOC"
    ],
    recommendations: [
      "Kupia krukras — ayan, iwi, kyam pura ra wapni ba baku.",
      "Inhalador (salbutamol) brisma kaka, naha taim yus muns.",
      "Kwala tara tara ba — lal, kupia lamara — tnata saks.",
      "IMPLIK hilp makabas — emergencia ra brih waia dukiara.",
      "Man wina baman kaia apia sa — upla wala makabas hilp maikaia."
    ],
    warningSigns: [
      "Bilam, lal, bara kuhma nani ba blue kaka grey kolor takisa kaka.",
      "Bila kumi sin pain aisaia sip apia kaka — pasa apia dukiara.",
      "Kupia ba dimaia dimi takisa pasa sakaia taim."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 6. KUPIA PRUKANKA — Dolor de Pecho
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "kupia_prukanka",
    symptoms: [
      "Kupia prukanka",
      "Kupia ra prukanka tara",
      "Kupia ra pik pik prukisa",
      "Kupia angki ba"
    ],
    keywords: [
      "kupia", "prukanka", "corazon", "infarto", "pecho",
      "opresion", "punzada", "ardor", "brazo", "izquierdo",
      "torax", "taquicardia", "heart", "chest", "pain"
    ],
    severity: "emergencia",
    possibleCauses: [
      "Infarto agudo — kupia tala pali daura sip apia ba",
      "Angina de pecho",
      "Byara acid (reflujo gastroesofágico) tara",
      "Kupia sîbri (ataque de ansiedad/pánico)"
    ],
    recommendations: [
      "Sut swis — wark apia, iwi ayan pali.",
      "Kupia midisin (nitroglicerina) brisma kaka, dis.",
      "Aspirina (300mg) kum dimaia sip sa — infarto ba lukisma kaka bara alergia apia kaka.",
      "IMPLIK EMERGENCIA RA AISAS — KAKA HOSPITAL RA BRIH WAIA SA."
    ],
    warningSigns: [
      "Prukanka tara ba kupia wina mihta smihka ra, lal ra, kaka byara ra wisa kaka.",
      "Kupia puski tahpla, kupia kriwan, lel prukanka tara, kaka pawi baku lukisa kaka.",
      "Pasa sakaia trabil brisma kaka kupia prukanka wal."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 7. BYARA PRUKANKA — Dolor Abdominal
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "byara_prukanka",
    symptoms: [
      "Byara prukanka",
      "Tanira prukanka",
      "Koliko tara",
      "Byara ra prukanka tara tara"
    ],
    keywords: [
      "byara", "tanira", "estomago", "barriga", "abdomen", "panza",
      "colico", "koliko", "apendice", "gastritis", "ulceras",
      "prukanka", "stomach", "belly", "dolor"
    ],
    severity: "urgencia",
    possibleCauses: [
      "Gastroenteritis — byara infekshan",
      "Apendicitis",
      "Plun saura dimi — intoxicación",
      "Tala watla tara nani (cálculos biliares)",
      "Tanira infekshan"
    ],
    recommendations: [
      "Plun tara dima apia — awarka nani baman.",
      "Li sampi sampi dis — suero oral.",
      "⚠️ Midisin tara tara dima APIA — prukanka tara kaka, apendice lakara lukaia sip ba dukiara.",
      "Paña laihni kum byara ra mangks — koliko kaka gas baman kaka."
    ],
    warningSigns: [
      "Prukanka tara pali ba smihka pali munhtara byara ra ba — apendice lakara sip ba.",
      "Byara taya ba tara pali, dus baku ba.",
      "Kupia kriwan tala wal kaka kwih tihmia pali (negra) ba."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 8. KUPIA KRIWAN — Náuseas / Vómitos
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "kupia_kriwan",
    symptoms: [
      "Kupia kriwan",
      "Kupia saura",
      "Plun sakaia",
      "Plun kli takisa",
      "Kupia kriwan pali"
    ],
    keywords: [
      "kupia", "kriwan", "nauseas", "vomito", "asco", "mareo",
      "estomago", "comida", "devolver", "bomitar", "plun", "sakaia",
      "saura", "nausea", "vomit", "sick"
    ],
    severity: "rutina",
    possibleCauses: [
      "Plun saura dimi — intoxicación alimentaria",
      "Virus infekshan (gripe estomacal)",
      "Tukta brih ba (embarazo)",
      "Duri ra sakaia wina — mareo"
    ],
    recommendations: [
      "Plun sakaia ningkara, 30-60 minit bila kaiki, baha ningkara li sampi dis.",
      "Li sampi sampi suero oral dis, kaka coco li, 10 minit kat.",
      "Plun mairin nani sampi sampi dis — rais pihni, pan angkan, kompota.",
      "Iwi ayan, kupia pura ra ba baku."
    ],
    warningSigns: [
      "Li sin dimi sakaia sip apia kaka — 12-24 hor purara.",
      "Plun sakaia ba kolor green tihmia, kaka 'café' baku, kaka tala pauni wal.",
      "Dihidrateshan tara: chistata tihmia pali, nakra laya apia, luki trabil."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 9. ALERGIA — Reacción Alérgica
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "alergia_reakshan",
    symptoms: [
      "Alergia",
      "Taya ra manka pauni nani",
      "Taya rih tara",
      "Taya puhban implik"
    ],
    keywords: [
      "alergia", "ronchas", "manka", "picazon", "rih", "puhban",
      "taya", "rojo", "sarpullido", "alergico", "intoxicacion",
      "hives", "itch", "swelling", "pauni"
    ],
    severity: "urgencia",
    possibleCauses: [
      "Kiangka ikan (abeja, avispa) wina",
      "Plun alergia (inska tara, maní)",
      "Midisin alergia",
      "Kemikol wina"
    ],
    recommendations: [
      "Antihistamínico kum dis — loratadina, cetirizina, kaka clorfeniramina.",
      "Paña tahpla kum taya rih pali ra mangks.",
      "Kiangka ikan kaka, stinger ba kaiks bara tarjeta kum wal saks (klukras).",
      "Taya rih ba kîs munras — infekshan lakara kaia apia dukiara."
    ],
    warningSigns: [
      "Bilam, twisa, karmak, kaka nakra pura ba implik puhban takisa kaka.",
      "Pasa sakaia trabil implik, dimaia trabil, kaka karmak ra prukanka tara kaka.",
      "Lel prukanka tara, luki trabil, kaka pawi lakara lukisa kaka (Anafilaxia)."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 10. TALA TAKISA — Trauma / Cortes / Sangrado
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "tala_takisa",
    symptoms: [
      "Klaki daukan tara",
      "Tala takisa",
      "Tala ailal takisa",
      "Taya ra klaki"
    ],
    keywords: [
      "tala", "klaki", "herida", "sangre", "corte", "raspon",
      "caida", "cuchillo", "machete", "sangrando", "hemorragia",
      "daukan", "takisa", "blood", "cut", "wound"
    ],
    severity: "urgencia",
    possibleCauses: [
      "Watla ra trabil — accidente doméstico",
      "Kauhwan — caída",
      "Wark dukia wal — herramientas",
      "Kara trabil — accidente de tránsito"
    ],
    recommendations: [
      "Mihtam nani klin muns — klaki kaiki kainara.",
      "Paña klin kum wal PRAIS TARA mangks klaki ra — 10-15 minit swi takras.",
      "Paña tala wal aibahwan kaka, wala kum pura ra mangks — pas ba sakras.",
      "Mihta kaka mina ba pura ra buki — tala sampi takaia dukiara."
    ],
    warningSigns: [
      "Tala ba pik pik takisa (pulsátil) kaka 15 minit ningkara sin swi takras kaka.",
      "Klaki ba tara pali, dusa/kyama/taya saura kaikisa kaka.",
      "Klaki munhtara mina ba pri apia kaka, kaka taukaia sip apia kaka."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 11. TAYA ANGKAN — Quemaduras
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "taya_angkan",
    symptoms: [
      "Taya angkan",
      "Pauta wal angkan",
      "Li laih wal angkan",
      "Ampolla taya ra"
    ],
    keywords: [
      "taya", "angkan", "quemadura", "fuego", "pauta", "calor",
      "li", "laih", "aceite", "sol", "ampolla", "burn",
      "plancha", "queme", "quemo", "hirviendo"
    ],
    severity: "urgencia",
    possibleCauses: [
      "Li laih — líquidos hirviendo",
      "Pauta — fuego directo",
      "Dukia laih (plancha, moto escape)",
      "Kemikol kaka electric angkan"
    ],
    recommendations: [
      "IMPLIK li tihmu wal (tahpla, ice apia) 15 minit kat angkan ba ra mangks.",
      "⚠️ ICE, pasta dental, butter, café — naha nani MANGKRAS. Taya saura pali daukisa.",
      "Gasa klin kum wal, tniahni, angkan ba ra mangks.",
      "Ampolla nani KRUKRAS — infekshan lakara sip ba dukiara."
    ],
    warningSigns: [
      "Angkan ba lal ra, mihta ra, mina ra, kaka kyama tara nani ra kaka.",
      "Angkan tara pali (3er grado) — taya pihni, siksa, kaka prukanka sin apia kupia ra.",
      "Electric kaka kemikol saura wal angkan ba."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 12. KARMAK PRUKANKA — Dolor de Garganta
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "karmak_prukanka",
    symptoms: [
      "Karmak prukanka",
      "Dimaia angki",
      "Karmak tahwan",
      "Karmak ra iriteshan",
      "Anginas tara"
    ],
    keywords: [
      "karmak", "prukanka", "garganta", "tragar", "dimaia",
      "anginas", "amigdalas", "ardor", "ronquera", "tos",
      "carraspera", "saliva", "sore", "throat", "angki"
    ],
    severity: "rutina",
    possibleCauses: [
      "Faringitis viral — virus wina",
      "Amigdalitis bakteria — bakteria wina",
      "Alergia",
      "Acid (reflujo nocturno)",
      "Wingka tahwan"
    ],
    recommendations: [
      "Li laihni salt wal karmak rins muns — (salt sampi glas kumira) — yu kumira pyua ailal.",
      "Li laihni ailal dis — miel kaka limón wal.",
      "Pastilla anestésica nani yus muns — karmak prukanka klakaia.",
      "Aisaia ailal apia, bara tobacco smok kaka dust wina klahwaia."
    ],
    warningSigns: [
      "Dimaia trabil tara pali — man saliva sin dimaia sip apia kaka.",
      "Pasa sakaia trabil kaka bila kwahkaia sip apia kaka.",
      "Wina urwanka tara pali, amígdalas ra pus pihni kaikisa kaka, bara kuyus puhban."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 13. GRIPE / RESFRIADO
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "gripe_resfriado",
    symptoms: [
      "Kakma prukanka",
      "Umpira",
      "Umpira tara",
      "Wina prais tara",
      "Wina saura pali"
    ],
    keywords: [
      "gripe", "resfriado", "umpira", "kakma", "nariz", "estornudo",
      "catarro", "congestion", "mocos", "tupida", "virus", "moco",
      "cold", "flu", "sneeze", "nose"
    ],
    severity: "rutina",
    possibleCauses: [
      "Rinovirus — resfriado",
      "Influenza — gripe",
      "Covid-19",
      "Alergia estacional"
    ],
    recommendations: [
      "Ayan pali — wina mawan pain kaia dukiara.",
      "Kakma ba suero fisiológico wal klin muns — pasa pain kaia dukiara.",
      "Li laihni ailal dis — sopa, té, limón laihni.",
      "Vapor (vaporizaciones) dimaia sip sa — kakma pain kaia dukiara. Angkras ba pain kaikaia."
    ],
    warningSigns: [
      "Wina urwanka tara 3 yu purara swi takras kaka.",
      "Pasa sakaia trabil, kupia ra pik prukisa kuhpaia taim.",
      "Lal ra kaka lal pura ra prukanka tara (senos paranasales), umpira saura smol wal."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 14. DIARREA
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "diarrea",
    symptoms: [
      "Diarrea",
      "Tanira trabil — li baku",
      "Latrine ra ailal waia",
      "Kwih li baku"
    ],
    keywords: [
      "diarrea", "liquido", "latrine", "infeccion", "deposiciones",
      "chorro", "aguado", "curso", "tanira", "kwih", "li",
      "baño", "loose", "watery", "stool"
    ],
    severity: "rutina",
    possibleCauses: [
      "Gastroenteritis viral — byara virus",
      "Ameba kaka parásito nani",
      "Plun saura dimi — intoxicación",
      "Antibiótico midisin yus muni wina"
    ],
    recommendations: [
      "DUKIA TARA PALI BA: Li ailal dis — Suero de Rehidratación Oral sampi sampi dis.",
      "Plun pain nani baman dis — rais pihni, siksa laya, apple taya apia, kalila ihbikan.",
      "Milk, grasa, plun fried, azúcar ailal, bara fibra tara — dima APIA.",
      "Loperamida DIMA APIA — duktur aisras kaka — infekshan ba dimira takisa dukiara."
    ],
    warningSigns: [
      "Diarrea 3-4 yu purara, pain takras kaka.",
      "Kwih ra tala pauni kaka mukus tara kaikisa kaka.",
      "Dihidrateshan tara: twisa tahwan, lel prukanka tara, chistata sampi pali bara tihmia."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 15. KUPIA SARI — Ansiedad / Estrés
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "kupia_sari",
    symptoms: [
      "Kupia sari tara",
      "Sîbri tara",
      "Kupia trabil tara",
      "Kupia pik pik implik",
      "Sîbri ailal pali"
    ],
    keywords: [
      "kupia", "sari", "ansiedad", "estres", "panico", "sîbri",
      "palpitaciones", "nervios", "miedo", "angustia", "desespero",
      "anxiety", "stress", "panic", "fear", "trabil", "scared"
    ],
    severity: "rutina",
    possibleCauses: [
      "Ataque de pánico",
      "Kupia trabil tara — ansiedad aguda",
      "Café kaka energy drink ailal dimi",
      "Kupia trabil emosional — estrés"
    ],
    recommendations: [
      "Plais kumi kupia krukaia ra waia — ayan iwi. Naha ba swiaia sa — taim sampi wal.",
      "Pasa sakaia '4-7-8': Pasa dimaia 4 segund, 7 segund swih kabia, 8 segund wal bilam wina sakaia.",
      "Lal li tahpla wal klin muns kaka ice kumi brih — wina 'reset' daukaia dukiara.",
      "Tékniko 5-4-3-2-1: Dukia 5 kaikisma, 4 alkisma, 3 walisisma, 2 smolisma, bara 1 tastisma — naha nani aisas."
    ],
    warningSigns: [
      "Kupia ra prukanka tara ba mihta smihka ra wisa kaka, kupia puski tahpla wal (naha ba kupia trabil sip sa — ansiedad apia).",
      "Episodio nani ailal pali ba, wark daukaia sin sip apia kaka.",
      "Lukanka tara saura — man wina trabil daukaia lukisma kaka."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 16. PYUTA IKAN — Mordedura de Serpiente
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "pyuta_ikan",
    symptoms: [
      "Pyuta ikan",
      "Limi pyuta ikan",
      "Prukanka tara pali mihta kaka mina ra",
      "Napa marka wal — colmillos"
    ],
    keywords: [
      "pyuta", "ikan", "serpiente", "culebra", "mordedura", "limi",
      "veneno", "vibora", "cascabel", "barba", "amarilla", "coral",
      "snake", "bite", "colmillos"
    ],
    severity: "emergencia",
    possibleCauses: [
      "Limi pyuta ikan (serpiente venenosa)",
      "Pyuta limi apia ikan (serpiente no venenosa)"
    ],
    recommendations: [
      "Upla ba TAUKRAS — pri apia mangkaia sa, limi implik pali wiras apia dukiara.",
      "Klaki ba li bara jabón wal sampi klin muns.",
      "Anillo, reloj, kwala tara — mihta kaka mina wina sakaia sa, puhban tara takaia dukiara.",
      "IMPLIK HOSPITAL RA WAIA — suero antiofídico briaia dukiara.",
      "⚠️ APIA DUKIA NANI: torniquete DAUKRAS, klaki DAKBRAS, limi sorbras, ice MANGKRAS."
    ],
    warningSigns: [
      "Nicaragua ra pyuta ikan sut ba EMERGENCIA sa — duktur baman aisaia sip ba apia kaka.",
      "Tala pali klaki ra takisa kaka, napa tala sin.",
      "Pasa sakaia trabil, nakra pura kauhwan, kaka wina pri apia (limi neurotóxico)."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 17. ALACRÁN / ESCORPIÓN IKAN — Picadura de Alacrán
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "alacran_ikan",
    symptoms: [
      "Alacrán ikan",
      "Escorpión ikan",
      "Taya pri apia — adormecimiento",
      "Prukanka angki laih — dolor quemante"
    ],
    keywords: [
      "alacran", "escorpion", "ikan", "picadura", "pico",
      "adormecimiento", "twisa", "hormigueo", "limi", "veneno",
      "scorpion", "sting"
    ],
    severity: "urgencia",
    possibleCauses: [
      "Escorpión / alacrán ikan"
    ],
    recommendations: [
      "Li bara jabón wal klin muns ikan pliska ra.",
      "Ice paña wal mangks ikan pliska ra (10 minit kat baman).",
      "Ikan pliska ba pri apia mangkaia.",
      "Paracetamol kaka ibuprofeno dis prukanka dukiara."
    ],
    warningSigns: [
      "Tuktan 5 mani munhtara bara almuk nani — HOSPITAL RA IMPLIK WAIA SA.",
      "Bilam, twisa, kaka lal ra hormigueo pri apia lukisa kaka.",
      "Nakra implik pali prukisa, saliva ailal, kaka pasa sakaia trabil."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 18. LAPTA PRUKANKA — Insolación / Golpe de Calor
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "lapta_prukanka",
    symptoms: [
      "Lapta prukanka — insolación",
      "Yu laih tara — golpe de calor",
      "Lel prukanka tara yu laih wina",
      "Taya pauni bara tahwan",
      "Pawi yu laih wina"
    ],
    keywords: [
      "lapta", "yu", "sol", "calor", "insolacion", "desmayo",
      "sofocado", "bochorno", "taya", "pauni", "tahwan",
      "temperatura", "pawi", "heat", "sun", "faint"
    ],
    severity: "emergencia",
    possibleCauses: [
      "Yu laih tara — golpe de calor",
      "Dihidrateshan tara yu laih wina",
      "Swahwanka tara yu laih wina"
    ],
    recommendations: [
      "Upla ba IMPLIK plais tahpla ra, sîkan munhtara, wingka pain ra brih waia.",
      "Kwala tara nani saks kaka tnata saks.",
      "Taya ba implik li tihmu (ice APIA!) wal liwan bara wingka yabaia — taya tahpla kaia dukiara.",
      "Upla ba luki pain kaka, li tihmu sampi sampi dis, kaka suero oral."
    ],
    warningSigns: [
      "Taya laih pali, pauni, bara TAHWAN — kupia puski sin apia yu laih taim.",
      "Pawi, luki trabil tara, kaka wina prukanka tara.",
      "Wina temperatura tara pali alkisma kaka."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 19. NAPA PRUKANKA — Dolor de Muela
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "napa_prukanka",
    symptoms: [
      "Napa prukanka",
      "Napa siknis",
      "Lal taya puhban",
      "Napa sensible — dimaia laih tahpla wal"
    ],
    keywords: [
      "napa", "prukanka", "muela", "diente", "caries", "encias",
      "dentista", "hinchazon", "cara", "mandibula", "siknis",
      "tooth", "dental", "toothache"
    ],
    severity: "rutina",
    possibleCauses: [
      "Caries tara — napa saura",
      "Absceso dental — napa tala pus",
      "Gingivitis tara — napa taya siknis",
      "Napa wisdom impactada"
    ],
    recommendations: [
      "Li laihni salt wal rins muns — napa lamara klin kaia dukiara.",
      "Hilo dental wal sampi klin muns — plun takaskanka napa taya ra ba sakaia.",
      "Ibuprofeno dis — prukanka bara puhban klakaia dukiara.",
      "Paña tahpla kum lal taya lata wina (laih APIA — infekshan brisma kaka)."
    ],
    warningSigns: [
      "Lal taya puhban tara — byara, lal, kaka kuyus ra.",
      "Wina urwanka tara napa prukanka wal.",
      "Bila kwahkaia trabil kaka dimaia trabil."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 20. CHISTATA PRUKANKA — Infección Urinaria
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "chistata_prukanka",
    symptoms: [
      "Chistata angki — ardor al orinar",
      "Chistata ailal pali waia",
      "Byara munhtara prukanka",
      "Chistata tihmia smol saura wal"
    ],
    keywords: [
      "chistata", "orinar", "ardor", "orina", "angki",
      "vejiga", "riñones", "olor", "smol", "pipi",
      "urinary", "pee", "burning", "kidney"
    ],
    severity: "urgencia",
    possibleCauses: [
      "Infekshan chistata watla (Cistitis)",
      "Walpaia tara nani (cálculos renales)",
      "Infekshan riñón (Pielonefritis)"
    ],
    recommendations: [
      "Li pura ailal dis — chistata watla klin kaia dukiara.",
      "Café, alcohol, bara azúcar ailal — DIMA APIA.",
      "Paña laihni kum byara munhtara mangks — prukanka klakaia.",
      "Duktur ra waia — chistata test daukaia; antibiótico briaia sa kainara."
    ],
    warningSigns: [
      "Wina urwanka tara bara kupia kli prukanka tara.",
      "Prukanka tara byara nina kaka pali nani ra (zona lumbar).",
      "Chistata ra tala pauni kaikisa kaka."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 21. LIMI DIMI — Intoxicación Química
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "limi_dimi",
    symptoms: [
      "Limi dimi — intoxicación",
      "Limi din — veneno inhalado",
      "Kemikol din — químicos inhalados",
      "Pesticida smol"
    ],
    keywords: [
      "limi", "dimi", "veneno", "intoxicado", "pesticida", "cloro",
      "quimico", "kemikol", "agroquimico", "din", "bebió", "tomó",
      "poison", "toxic", "chemical"
    ],
    severity: "emergencia",
    possibleCauses: [
      "Limi dimi — man baman kaka trabil wina",
      "Limi din — kemikol puski saura (agroquímicos)"
    ],
    recommendations: [
      "Botella kaka etiqueta ba pliki — duktur ra marikaia dukiara.",
      "⚠️ PLUN SAKAIA APIA DAUKAIA DUKIA RA — ácido, cloro, dukia saura kaka, takaia kli angkisa dukiara.",
      "Milk kaka li YABRAS — Toxicología Centro aisras kaka.",
      "IMPLIK hospital emergencia ra brih waia sa."
    ],
    warningSigns: [
      "Limi dimi sut ba EMERGENCIA MÉDICA sa — taim ailal swiaia sip apia.",
      "Bilam kaka bila ra angkan kaikisa kaka.",
      "Pasa sakaia trabil, wina prukanka tara, kaka pawi."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 22. TUKTAN SIKNIS — Enfermedades Infantiles Comunes
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "tuktan_siknis",
    symptoms: [
      "Tuktan wina urwanka",
      "Tuktan kuhpanka",
      "Tuktan byara prukanka",
      "Tuktan taya ra manka nani",
      "Tuktan plun sakaia"
    ],
    keywords: [
      "tuktan", "luhpia", "baby", "niño", "niña", "bebe",
      "child", "kids", "infant", "pediatric", "siknis",
      "wina", "urwanka", "kuhpanka", "plun"
    ],
    severity: "urgencia",
    possibleCauses: [
      "Tuktan gripe kaka virus",
      "Tuktan byara infekshan",
      "Tuktan taya siknis (sarampión, varicela)",
      "Tuktan diarrea dihidrateshan wal"
    ],
    recommendations: [
      "Tuktan wina urwanka kaka — paracetamol pediátrico BAMAN dis (dosis tuktan pesa kat).",
      "Li ailal yabaia — suero oral, breast milk (tuktan sampi kaka).",
      "Tuktan ba ayan mangkaia, watla tahpla ra.",
      "Tuktan taya ra manka nani kaka — duktur ra implik waia sa.",
      "⚠️ ASPIRINA kaka IBUPROFENO tuktan sampi nani ra YABRAS."
    ],
    warningSigns: [
      "Tuktan 3 kati munhtara wina urwanka tara kaka — IMPLIK hospital ra waia.",
      "Tuktan plun dimaia apia kaka, nakra laya apia kaka (dihidrateshan).",
      "Tuktan yapras, kupia krukras kaka, wina prukanka tara."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 23. TAYA SIKNIS — Problemas de la Piel
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "taya_siknis",
    symptoms: [
      "Taya siknis",
      "Taya rih tara",
      "Taya pauni manka nani",
      "Taya pus wal",
      "Taya tahwan pali"
    ],
    keywords: [
      "taya", "siknis", "rih", "manka", "skin", "rash",
      "piel", "rojo", "pus", "grano", "acne", "eczema",
      "hongos", "fungus", "dermatitis", "pauni", "tahwan"
    ],
    severity: "rutina",
    possibleCauses: [
      "Dermatitis — taya iriteshan",
      "Hongos — taya fungus",
      "Infekshan bakteria — taya infekshan",
      "Eczema",
      "Alergia taya ra"
    ],
    recommendations: [
      "Taya ba li bara jabón suave wal klin muns — yu kat.",
      "Taya rih kaka — crema hidrocortisona 1% mangks.",
      "Hongos lukisma kaka — crema clotrimazol kaka ketoconazol mangks.",
      "Taya ba tahwan mangkaia — li wal kwala klin nani yus muns.",
      "Taya ra pus kaikisa kaka — duktur ra waia antibiótico briaia dukiara."
    ],
    warningSigns: [
      "Taya siknis ba implik pali wisa — wina kumi wina sut ra.",
      "Wina urwanka tara taya siknis wal.",
      "Taya ra manka tihmia nani kli kli takisa, pus wal, kaka prukanka tara."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 24. NAKRA SIKNIS — Problemas Oculares
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "nakra_siknis",
    symptoms: [
      "Nakra siknis",
      "Nakra prukanka",
      "Nakra pauni",
      "Nakra wina li takisa",
      "Nakra kaikaia trabil"
    ],
    keywords: [
      "nakra", "siknis", "eye", "ojos", "rojo", "pauni",
      "vision", "kaikaia", "conjuntivitis", "dolor",
      "prukanka", "lagrimeo", "ardor", "li"
    ],
    severity: "rutina",
    possibleCauses: [
      "Conjuntivitis — nakra infekshan",
      "Nakra tahwan — ojo seco",
      "Alergia nakra ra",
      "Nakra ra dukia dimi",
      "Nakra presión tara (glaucoma)"
    ],
    recommendations: [
      "Nakra ba li klin (suero fisiológico) wal sampi klin muns.",
      "Nakra pauni kaka — lágrimas artificiales yus muns.",
      "Nakra rih kaka — mihta wal kîsras. Infekshan tara takaia sip sa.",
      "Nakra conjuntivitis kaka — paña klin man baman yus muns, upla wala yabras.",
      "Pantalla nani (phone, computer) wina ayan yabaia — nakra pain kaia dukiara."
    ],
    warningSigns: [
      "Nakra kaikaia implik trabil — sampi kaka sut kaikras kaka.",
      "Nakra prukanka tara tara wal, lait kaikaia sip apia kaka.",
      "Nakra ra dukia kum dimi bara sakaia sip apia kaka."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 25. KYAMA PRUKANKA — Dolor Muscular / Articular
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "kyama_prukanka",
    symptoms: [
      "Kyama prukanka",
      "Wina prukanka tara",
      "Kyama tara tara",
      "Wina pri apia — entumecimiento",
      "Kyama puhban"
    ],
    keywords: [
      "kyama", "prukanka", "muscular", "articular", "wina",
      "cuerpo", "espalda", "rodilla", "cadera", "hombro",
      "cuello", "muscle", "joint", "pain", "stiff", "puhban"
    ],
    severity: "rutina",
    possibleCauses: [
      "Wark tara — sobreesfuerzo",
      "Kyama tara prais — esguince/torcedura",
      "Artritis — kyama siknis",
      "Wina pri apia yapaia trabil wina — mala postura",
      "Fibromialgia"
    ],
    recommendations: [
      "Ayan mangkaia — kyama ba wark yabras.",
      "Ice paña wal 15-20 minit mangks (pas 48 hor ra) — puhban klakaia.",
      "Baha ningkara — paña laihni mangks — tala pain waia dukiara.",
      "Ibuprofeno kaka diclofenaco dis — prukanka bara puhban klakaia.",
      "Kyama ba sampi sampi pri kli daukaia — stretching."
    ],
    warningSigns: [
      "Kyama ba implik puhban tara, taukaia sin sip apia kaka.",
      "Wina pri apia kaka hormigueo pali mihta kaka mina ra.",
      "Prukanka tara 2 wiki purara klahwras kaka — duktur ra waia sa."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 26. KUHPANKA — Tos Persistente
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "kuhpanka",
    symptoms: [
      "Kuhpanka tara",
      "Kuhpanka swi takras",
      "Kuhpanka tala wal",
      "Kuhpanka tihmia taim",
      "Kuhpanka kupia prukanka wal"
    ],
    keywords: [
      "kuhpanka", "tos", "cough", "kupia", "pasa",
      "flema", "sangre", "tala", "tihmia", "noche",
      "seca", "tahwan", "productiva", "persistente"
    ],
    severity: "rutina",
    possibleCauses: [
      "Gripe kaka resfriado wina",
      "Bronquitis — pasa paikra infekshan",
      "Alergia — dust, smok wina",
      "Asma",
      "Reflujo (ácido byara wina)"
    ],
    recommendations: [
      "Li laihni ailal dis — miel wal (tuktan 1 mani purara miel yabras).",
      "Watla ra wingka liwan mangkaia — humedad yabaia dukiara.",
      "Yapaia taim kupia pura ra buki — ácido reflujo klakaia dukiara.",
      "Smok nani wina klahwaia — tobacco, pauta saura, dust.",
      "Kuhpanka 2 wiki purara swi takras kaka — duktur ra waia sa."
    ],
    warningSigns: [
      "Kuhpanka tala wal — tala pauni kaikisa kaka.",
      "Pasa sakaia trabil kuhpanka wal.",
      "Wina pesa tara sakaia (bajar de peso) kuhpanka wal.",
      "Wina urwanka tara kuhpanka wal 2 wiki purara."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 27. LI LAIH ANGKAN — Golpe de Calor por Trabajo
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "swahwanka_tara",
    symptoms: [
      "Swahwanka tara pali",
      "Wina swahwan — agotamiento",
      "Lel prukanka tara wark ningkara",
      "Kupia pik pik — palpitaciones",
      "Wina kyama tara"
    ],
    keywords: [
      "swahwanka", "swahwan", "cansancio", "agotamiento", "fatiga",
      "wark", "trabajo", "kyama", "debil", "exhausto",
      "tired", "fatigue", "weak", "exhausted"
    ],
    severity: "rutina",
    possibleCauses: [
      "Wark tara pali — sobreesfuerzo",
      "Yap apia — falta de sueño",
      "Plun pain apia dimi — mala nutrición",
      "Anemia — tala sampi",
      "Dihidrateshan"
    ],
    recommendations: [
      "Ayan mangkaia — wina ba ayan briaia sa.",
      "Li ailal dis — suero oral, li, fruta juice.",
      "Plun pain nani dis — protein, fruta, verdura.",
      "Yap pain mangkaia — 7-8 hor tihmia ra.",
      "Swahwanka ba swi takras kaka — duktur ra waia tala test daukaia dukiara."
    ],
    warningSigns: [
      "Swahwanka tara pali yu kat kli kli ba — anemia kaka siknis wala lakara sip sa.",
      "Wina pesa tara sakaia swahwanka wal.",
      "Kupia pik pik tara bara pasa sakaia trabil."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 28. PASA LALMA PRUKANKA — Dolor de Oído
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "pasa_lalma_prukanka",
    symptoms: [
      "Pasa lalma prukanka — dolor de oído",
      "Pasa lalma wina li takisa",
      "Walisma saura — escuchar mal",
      "Pasa lalma rih"
    ],
    keywords: [
      "pasa", "lalma", "oido", "ear", "dolor", "prukanka",
      "infeccion", "otitis", "sordo", "walisma", "escuchar",
      "zumbido", "hearing", "earache"
    ],
    severity: "rutina",
    possibleCauses: [
      "Otitis — pasa lalma infekshan",
      "Wax tara — cerumen impactado",
      "Li dimisa — agua en el oído",
      "Gripe/resfriado wina",
      "Presión cambio (avión, montaña)"
    ],
    recommendations: [
      "Paracetamol kaka ibuprofeno dis — prukanka klakaia.",
      "Paña laihni kum pasa lalma lata ra mangks.",
      "Pasa lalma ra dukia kum MANGKRAS — cotton bud sin apia.",
      "Li dimi kaka — lal pali ra mangks li sakaia dukiara.",
      "Pasa lalma wina li kaka pus takisa kaka — duktur ra implik waia."
    ],
    warningSigns: [
      "Pasa lalma wina pus kaka tala takisa kaka.",
      "Wina urwanka tara pasa lalma prukanka wal.",
      "Walisma sut sip apia kaka — sordera implik."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 29. BYARA WAHBI — Dolor de Espalda
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "byara_wahbi_prukanka",
    symptoms: [
      "Byara wahbi prukanka — dolor de espalda",
      "Byara wahbi prukanka tara pali",
      "Byara wahbi kyama tara",
      "Mina ra pri apia wisa — ciática"
    ],
    keywords: [
      "byara", "wahbi", "espalda", "back", "lumbar", "columna",
      "ciatica", "disco", "prukanka", "kyama", "tara",
      "spine", "lower", "sciatic"
    ],
    severity: "rutina",
    possibleCauses: [
      "Kyama trabil — contractura muscular",
      "Disco herniado",
      "Ciática — nahwa prukanka",
      "Yapaia postura saura",
      "Wark tara pali — sobreesfuerzo"
    ],
    recommendations: [
      "Ayan mangkaia — kyama ba wark yabras 24-48 hor.",
      "Ice paña wal pas 48 hor ra — puhban klakaia. Baha ningkara paña laihni.",
      "Ibuprofeno kaka naproxeno dis — prukanka bara puhban klakaia.",
      "Yapaia postura pain mangkaia — kupia pura ra, mina nani taya ra.",
      "Stretching sampi sampi daukaia — kyama pain kaia dukiara."
    ],
    warningSigns: [
      "Mina nani pri apia kaka swahwan kaka — taukaia trabil.",
      "Chistata kaka kwih kontrolaia sip apia kaka.",
      "Prukanka tara tara 2 wiki purara klahwras kaka."
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // 30. MAIRIN TUKTA — Problemas del Embarazo
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "mairin_tukta",
    symptoms: [
      "Mairin tukta brih — embarazo trabil",
      "Tala takisa tukta brih taim",
      "Byara prukanka tara tukta brih taim",
      "Kupia prukanka pali — preeclampsia lakara"
    ],
    keywords: [
      "mairin", "tukta", "embarazo", "pregnant", "pregnancy",
      "tala", "byara", "prukanka", "prenatal", "bebe",
      "parto", "labor", "contracción", "sangrado"
    ],
    severity: "emergencia",
    possibleCauses: [
      "Tala takisa — aborto amenaza kaka placenta trabil",
      "Preeclampsia — presión tara tukta brih taim",
      "Parto implik — contracciones",
      "Embarazo ectópico — trabil tara"
    ],
    recommendations: [
      "Tala takisa kaka — IMPLIK hospital ra waia. Ayan mangkaia.",
      "Byara prukanka tara kaka — pali smihka ra ayan mangkaia, hospital ra implik waia.",
      "Lel prukanka tara, nakra kaikaia trabil kaka — preeclampsia lakara sip, IMPLIK duktur ra waia.",
      "Midisin kum sin dima apia — duktur aisras kaka.",
      "Li ailal dis, ayan mangkaia, stress klahwaia."
    ],
    warningSigns: [
      "Tala takisa tukta brih taim — SIEMBRE emergencia sa.",
      "Lel prukanka tara tara, nakra kaikaia trabil, kaka wina puhban implik.",
      "Byara prukanka tara kli kli ba — contracciones regulares.",
      "Li tara sakaia — fuente rompida sip sa."
    ]
  }
];

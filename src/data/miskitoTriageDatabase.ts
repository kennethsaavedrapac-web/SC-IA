








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
  
  {
    id: "wina_urwanka_tara",
    symptoms: ["Wina urwanka tara", "Temperatura pura manas", "Kupia kli prukanka", "Kupia puski tara", "Wina laihwan"],
    keywords: ["wina", "urwanka", "temperatura", "laihwan", "puski", "kli", "fiebre", "calentura", "urwan", "laih", "arder", "kupia", "kyama", "taya", "angki", "hirviendo", "caliente", "escalofrio", "sudor", "frio", "quema", "hot", "fever"],
    severity: "urgencia",
    possibleCauses: ["Virus infekshan", "Gripe (Influenza)", "Bakteria infekshan", "Covid-19", "Dengue"],
    recommendations: ["Paracetamol dis, wina urwanka mayunaia dukiara.", "Li ailal dis — li, suero oral.", "Paña liwan wal man lal ra mangks.", "Tasba pasa pain ra ayan."],
    warningSigns: ["Wina urwanka 39.5°C purara ba midisin wal klahwras.", "Pasa sakaia trabil.", "Luki trabil tara kaka luki saura."]
  },
  {
    id: "dengue_zika_chikungunya",
    symptoms: ["Dusa prukanka tara", "Nakra nina prukanka", "Taya ra manka pauni nani", "Wina urwanka dusa prukanka wal", "Kyama prukanka ailal"],
    keywords: ["dengue", "zika", "chikungunya", "dusa", "nakra", "manka", "zancudo", "wasla", "kyama", "wina", "prukanka", "taya", "pauni", "sarpullido", "manchas", "huesos", "ojos", "articulaciones", "cuerpo", "rompehuesos"],
    severity: "urgencia",
    possibleCauses: ["Dengue", "Chikungunya", "Zika"],
    recommendations: ["Paracetamol baman dis. ASPIRINA, IBUPROFENO DIMA APIA!", "Li ailal pali dis — suero, coco li.", "Ayan pali mosquitero munhtara.", "Duktur ra was tala test daukaia."],
    warningSigns: ["Byara prukanka tara, swi takras ba.", "Tala takisa — napa tala, kakma tala, taya ra manka tihmia.", "Kupia kriwan pali."]
  },
  {
    id: "malaria_paludismo",
    symptoms: ["Kupia kli prukanka tara tara", "Kupia puski ailal", "Wina urwanka kli kli takisa", "Wina kyama tara"],
    keywords: ["malaria", "paludismo", "kyama", "terciana", "kupia", "kli", "puski", "sudar", "zancudo", "wasla", "unta", "selva", "temblor", "escalofrio", "frio", "sudor"],
    severity: "urgencia",
    possibleCauses: ["Malaria (Paludismo)"],
    recommendations: ["Siknis watla ra gota gruesa test daukaia sa.", "Li ailal dis, paracetamol yus muns.", "Implik pali siknis watla ra waia sa."],
    warningSigns: ["Wina urwanka tara bara nakra lalahni (ictericia).", "Wina swahwanka tara, taukaia sip apia.", "Pasa sakaia trabil."]
  },
  {
    id: "leishmaniasis",
    symptoms: ["Taya ra klaki tara pain takras ba", "Taya klaki pus wal swi takras", "Unta siknis taya ra", "Lal mawan ra taya saura"],
    keywords: ["leishmania", "leishmaniasis", "lepra", "montaña", "unta", "siknis", "klaki", "taya", "pus", "papalota", "yate", "ulcer", "llaga", "ulcera", "papalomoyo", "arenilla"],
    severity: "urgencia",
    possibleCauses: ["Leishmaniasis (Lepra de montaña)"],
    recommendations: ["Klaki ba klin muns jabón bara li wal.", "Midisin man baman MANGKRAS.", "Siknis watla ra waia inyección briaia dukiara (Glucantime)."],
    warningSigns: ["Klaki ba tara takisa bara pain takras.", "Kakma kaka bila taya saura takisa kaka.", "Klaki wina smol saura takisa kaka."]
  },
  {
    id: "chagas",
    symptoms: ["Nakra puhban tara yu kumi ra", "Kupia pik pik tara", "Taya ra manka prukanka apia", "Kupia siknis"],
    keywords: ["chagas", "chinche", "pito", "besucon", "nakra", "puhban", "kupia", "corazon", "pik", "manka", "picadura", "insecto"],
    severity: "urgencia",
    possibleCauses: ["Enfermedad de Chagas", "Reacción alérgica por picadura"],
    recommendations: ["Chinche ikan kaka nakra ba kîsras.", "Siknis watla ra waia tala test daukaia.", "Watla ra chinche plikaia bara klin daukaia."],
    warningSigns: ["Kupia prukanka tara kaka pasa sakaia trabil.", "Nakra puhban ba 2 wiki purara klahwras kaka.", "Pawi lakara lukisa kaka."]
  },
  {
    id: "colera",
    symptoms: ["Diarrea li baku tara pali", "Kupia kriwan tara", "Diarrea pihni baku li", "Wina swahwan implik"],
    keywords: ["colera", "cholera", "diarrea", "li", "pihni", "kwih", "latrine", "tanira", "deshidratacion", "agua", "arroz", "swahwan", "swahwanka", "umpira", "kriwan", "vomito", "saura"],
    severity: "emergencia",
    possibleCauses: ["Cólera", "Infección bacteriana severa intestinal"],
    recommendations: ["IMPLIK suero oral dis litros ailal.", "Li laihni salt bara azúcar wal dis.", "Siknis watla ra IMPLIK waia suero briaia dukiara."],
    warningSigns: ["Diarrea tara pali yu kumi ra 10 pyua purara.", "Chistata sampi pali kaka chistras kaka.", "Nakra laya apia, wina taya tahwan pali."]
  },

  
  {
    id: "kupia_siknis_pasa",
    symptoms: ["Pasa sakaia trabil", "Pasa sip apia", "Kupia siknis tara", "Kupia tara krukisa", "Pasa ba whistle baku aisisa"],
    keywords: ["pasa", "sakaia", "respirar", "ahogo", "asfixia", "kupia", "pulmones", "asma", "ahogando", "sofoco", "silbido", "aire", "pecho", "trabil", "sip", "apia", "breath", "whistle"],
    severity: "emergencia",
    possibleCauses: ["Asma atake", "Alergia tara", "Neumonía", "EPOC"],
    recommendations: ["Kupia krukras — ayan iwi, kyam pura ra wapni.", "Inhalador brisma kaka yus muns.", "Kwala tara nani tnata saks.", "IMPLIK hospital ra waia."],
    warningSigns: ["Bilam kaka lal blue/grey kolor takisa kaka.", "Bila kumi sin aisaia sip apia pasa apia dukiara.", "Kupia dimaia dimi takisa pasa sakaia taim."]
  },
  {
    id: "kupia_prukanka",
    symptoms: ["Kupia prukanka", "Kupia ra prukanka tara", "Kupia ra pik pik prukisa", "Kupia angki ba"],
    keywords: ["kupia", "prukanka", "corazon", "infarto", "pecho", "opresion", "punzada", "ardor", "brazo", "izquierdo", "torax", "taquicardia", "heart", "chest", "pain"],
    severity: "emergencia",
    possibleCauses: ["Infarto agudo", "Angina de pecho", "Reflujo", "Ansiedad"],
    recommendations: ["Wark apia, iwi ayan pali.", "Nitroglicerina brisma kaka dis.", "Aspirina (300mg) dimaia sip sa infarto lukisma kaka.", "IMPLIK EMERGENCIA RA AISAS."],
    warningSigns: ["Prukanka tara kupia wina mihta smihka ra wisa kaka.", "Kupia puski tahpla, kupia kriwan.", "Pasa sakaia trabil kupia prukanka wal."]
  },
  {
    id: "gripe_resfriado",
    symptoms: ["Kakma prukanka", "Umpira", "Umpira tara", "Wina prais tara", "Wina saura pali"],
    keywords: ["gripe", "resfriado", "umpira", "kakma", "nariz", "estornudo", "catarro", "congestion", "mocos", "tupida", "virus", "moco", "cold", "flu", "sneeze", "nose"],
    severity: "rutina",
    possibleCauses: ["Rinovirus", "Influenza", "Covid-19"],
    recommendations: ["Ayan pali wina mawan pain kaia dukiara.", "Kakma ba suero fisiológico wal klin muns.", "Li laihni ailal dis — sopa, té.", "Vapor (vaporizaciones) dimaia sip sa."],
    warningSigns: ["Wina urwanka tara 3 yu purara swi takras.", "Pasa sakaia trabil.", "Lal ra prukanka tara smol saura wal."]
  },
  {
    id: "kuhpanka",
    symptoms: ["Kuhpanka tara", "Kuhpanka swi takras", "Kuhpanka tala wal", "Kuhpanka tihmia taim", "Kuhpanka kupia prukanka wal"],
    keywords: ["kuhpanka", "tos", "cough", "kupia", "pasa", "flema", "sangre", "tala", "tihmia", "noche", "seca", "tahwan", "productiva", "persistente", "tuberculosis", "tb"],
    severity: "rutina",
    possibleCauses: ["Gripe wina", "Bronquitis", "Asma", "Tuberculosis (TB)"],
    recommendations: ["Li laihni ailal dis miel wal.", "Tobacco smok bara dust wina klahwaia.", "Kuhpanka 2 wiki purara swi takras kaka duktur ra waia sa."],
    warningSigns: ["Kuhpanka tala pauni wal.", "Wina pesa tara sakaia (bajar de peso).", "Wina urwanka tara tihmia taim."]
  },

  
  {
    id: "byara_prukanka",
    symptoms: ["Byara prukanka", "Tanira prukanka", "Koliko tara", "Byara ra prukanka tara tara"],
    keywords: ["byara", "tanira", "estomago", "barriga", "abdomen", "panza", "colico", "koliko", "apendice", "gastritis", "ulceras", "prukanka", "stomach", "belly", "dolor"],
    severity: "urgencia",
    possibleCauses: ["Gastroenteritis", "Apendicitis", "Intoxicación", "Cálculos biliares"],
    recommendations: ["Plun tara dima apia.", "Li sampi sampi dis.", "Midisin tara tara dima APIA.", "Paña laihni kum byara ra mangks koliko kaka."],
    warningSigns: ["Prukanka tara pali smihka munhtara byara ra ba.", "Byara taya ba tara pali, dus baku ba.", "Kupia kriwan tala wal kaka kwih tihmia pali."]
  },
  {
    id: "kupia_kriwan",
    symptoms: ["Kupia kriwan", "Kupia saura", "Plun sakaia", "Plun kli takisa", "Kupia kriwan pali"],
    keywords: ["kupia", "kriwan", "nauseas", "vomito", "asco", "mareo", "estomago", "comida", "devolver", "bomitar", "plun", "sakaia", "saura", "nausea", "vomit", "sick"],
    severity: "rutina",
    possibleCauses: ["Intoxicación alimentaria", "Gripe estomacal", "Embarazo", "Mareo"],
    recommendations: ["Plun sakaia ningkara 30-60 minit swih kabia li dimaia.", "Suero oral sampi sampi dis.", "Plun mairin nani sampi dis — rais pihni.", "Iwi ayan."],
    warningSigns: ["Li sin dimi sakaia sip apia 24 hor purara.", "Plun sakaia ba kolor green tihmia kaka tala wal.", "Dihidrateshan tara."]
  },
  {
    id: "diarrea",
    symptoms: ["Diarrea", "Tanira trabil — li baku", "Latrine ra ailal waia", "Kwih li baku"],
    keywords: ["diarrea", "liquido", "latrine", "infeccion", "deposiciones", "chorro", "aguado", "curso", "tanira", "kwih", "li", "baño", "loose", "watery", "stool", "parasito", "lombriz"],
    severity: "rutina",
    possibleCauses: ["Gastroenteritis viral", "Amebas/Parásitos", "Intoxicación"],
    recommendations: ["Li ailal dis — Suero de Rehidratación Oral.", "Plun pain nani dis — rais pihni, siksa laya.", "Milk, grasa, plun fried dima APIA.", "Loperamida dima APIA duktur aisras kaka."],
    warningSigns: ["Diarrea 3-4 yu purara.", "Kwih ra tala pauni kaka mukus tara.", "Dihidrateshan tara."]
  },
  {
    id: "parasitos",
    symptoms: ["Byara prukanka kli kli", "Byara puhban tara", "Tanira rih", "Lombriz kwih ra", "Wina pesa sakaia"],
    keywords: ["parasito", "parasitos", "lombriz", "amebas", "gusano", "byara", "puhban", "rih", "picazon", "ano", "kwih", "pesa", "sakaia", "worm"],
    severity: "rutina",
    possibleCauses: ["Parásitos intestinales", "Amebiasis"],
    recommendations: ["Duktur ra waia kwih test daukaia.", "Albendazol kaka mebendazol duktur yabaia sip sa.", "Mihta klin muns li bara jabón wal plun dimaia kainara.", "Li paskan baman dis."],
    warningSigns: ["Diarrea tala wal.", "Wina swahwanka tara pali.", "Lombriz tara sakaia plun sakaia taim."]
  },

  
  {
    id: "tala_takisa",
    symptoms: ["Klaki daukan tara", "Tala takisa", "Tala ailal takisa", "Taya ra klaki"],
    keywords: ["tala", "klaki", "herida", "sangre", "corte", "raspon", "caida", "cuchillo", "machete", "sangrando", "hemorragia", "daukan", "takisa", "blood", "cut", "wound"],
    severity: "urgencia",
    possibleCauses: ["Accidente", "Caída", "Machete/herramientas"],
    recommendations: ["Mihta klin muns.", "Paña klin wal PRAIS TARA mangks klaki ra 10-15 minit.", "Paña tala wal aibahwan kaka wala kum pura ra mangks.", "Mihta kaka mina ba pura ra buki."],
    warningSigns: ["Tala ba pik pik takisa (pulsátil) 15 minit ningkara.", "Klaki ba tara pali dusa kaikisa kaka.", "Mina kaka mihta taukaia sip apia."]
  },
  {
    id: "taya_angkan",
    symptoms: ["Taya angkan", "Pauta wal angkan", "Li laih wal angkan", "Ampolla taya ra"],
    keywords: ["taya", "angkan", "quemadura", "fuego", "pauta", "calor", "li", "laih", "aceite", "sol", "ampolla", "burn", "plancha", "queme", "quemo", "hirviendo"],
    severity: "urgencia",
    possibleCauses: ["Líquidos hirviendo", "Fuego directo", "Superficie caliente"],
    recommendations: ["IMPLIK li tihmu wal 15 minit kat angkan ba ra mangks.", "ICE, pasta dental, butter MANGKRAS.", "Gasa klin kum wal angkan ba ra mangks.", "Ampolla nani KRUKRAS."],
    warningSigns: ["Angkan ba lal, mihta, mina, kaka kyama tara nani ra.", "Angkan tara pali (3er grado) taya pihni/siksa.", "Electric kaka kemikol wal angkan ba."]
  },
  {
    id: "dusa_kriwan",
    symptoms: ["Dusa kriwan", "Kyama puhban tara pali", "Mina kaka mihta prukanka tara kauhwan wina", "Taukaia sip apia"],
    keywords: ["dusa", "kriwan", "fractura", "hueso", "quebrado", "roto", "kauhwan", "caida", "golpe", "kyama", "puhban", "mina", "mihta", "prukanka", "break", "bone"],
    severity: "emergencia",
    possibleCauses: ["Fractura de hueso", "Esguince severo", "Luxación"],
    recommendations: ["Mina kaka mihta ba TAUKRAS.", "Tablilla kaka dusa kum wal pri apia mangkaia sa.", "Ice paña wal mangks puhban klakaia.", "IMPLIK hospital ra waia X-ray dukiara."],
    warningSigns: ["Dusa ba taya wina takisa kaka (fractura expuesta).", "Mihta kaka mina smalkra ba blue kaka tihmia takisa kaka.", "Tala tara takisa kaka."]
  },
  {
    id: "li_munhtara_dimi",
    symptoms: ["Li munhtara dimi", "Li tara din", "Pasa sakaia trabil li wina", "Kupia kriwan li wina"],
    keywords: ["li", "munhtara", "dimi", "din", "agua", "ahogamiento", "rio", "mar", "kaboh", "drowning", "pasa", "trabil", "pulmones", "tos", "kuhpanka"],
    severity: "emergencia",
    possibleCauses: ["Ahogamiento parcial (casi ahogamiento)"],
    recommendations: ["Upla ba li wina sakaia IMPLIK.", "Pasa sakras kaka CPR daukaia sa.", "Kwala li wal ba sakaia bara kwala tahpla mangkaia.", "IMPLIK hospital ra brih waia, pasa pain sakisa kaka sin."],
    warningSigns: ["Pasa sakaia trabil li wina takan ningkara.", "Kuhpanka pus pihni kaka pauni wal.", "Pawi lakara lukisa kaka kaka luki trabil."]
  },

  
  {
    id: "pyuta_ikan",
    symptoms: ["Pyuta ikan", "Limi pyuta ikan", "Prukanka tara pali mihta kaka mina ra", "Napa marka wal"],
    keywords: ["pyuta", "ikan", "serpiente", "culebra", "mordedura", "limi", "veneno", "vibora", "cascabel", "barba", "amarilla", "coral", "snake", "bite", "colmillos", "tomagoff"],
    severity: "emergencia",
    possibleCauses: ["Limi pyuta ikan (venenosa)", "Pyuta ikan (no venenosa)"],
    recommendations: ["Upla ba TAUKRAS — pri apia mangkaia sa.", "Klaki ba li bara jabón wal klin muns.", "Anillo, reloj sakaia sa.", "IMPLIK HOSPITAL RA WAIA suero antiofídico dukiara.", "Torniquete DAUKRAS, klaki DAKBRAS."],
    warningSigns: ["Pyuta ikan sut ba EMERGENCIA sa Nicaragua ra.", "Tala pali klaki ra takisa kaka.", "Pasa sakaia trabil, nakra pura kauhwan."]
  },
  {
    id: "alacran_ikan",
    symptoms: ["Alacrán ikan", "Escorpión ikan", "Taya pri apia", "Prukanka angki laih"],
    keywords: ["alacran", "escorpion", "ikan", "picadura", "pico", "adormecimiento", "twisa", "hormigueo", "limi", "veneno", "scorpion", "sting"],
    severity: "urgencia",
    possibleCauses: ["Escorpión / alacrán ikan"],
    recommendations: ["Li bara jabón wal klin muns.", "Ice paña wal mangks (10 minit kat).", "Ikan pliska ba pri apia mangkaia.", "Paracetamol dis."],
    warningSigns: ["Tuktan 5 mani munhtara bara almuk nani HOSPITAL RA WAIA.", "Bilam kaka twisa hormigueo lukisa kaka.", "Saliva ailal kaka pasa sakaia trabil."]
  },
  {
    id: "araña_ikan",
    symptoms: ["Kiangka ikan", "Araña ikan", "Taya ra prukanka tara bara puhban", "Manka pauni tara"],
    keywords: ["araña", "spider", "ikan", "picadura", "kiangka", "tarantula", "viuda", "negra", "manka", "pauni", "puhban", "veneno"],
    severity: "urgencia",
    possibleCauses: ["Araña venenosa ikan", "Araña común ikan"],
    recommendations: ["Li bara jabón wal klin muns.", "Ice paña wal mangks.", "Mina kaka mihta ikan kaka pura ra buki.", "Ibuprofeno dis."],
    warningSigns: ["Byara prukanka tara araña ikan ningkara (viuda negra sip sa).", "Klaki ba tihmia takisa bara taya saura takisa (araña violonista sip sa).", "Pasa sakaia trabil."]
  },

  
  {
    id: "lel_prukanka",
    symptoms: ["Lel prukanka", "Migraña", "Lel ra prukanka tara", "Lel ra pik pik prukisa", "Lel tara prukanka"],
    keywords: ["lel", "prukanka", "migraña", "cefalea", "cabeza", "dolor", "presion", "punzadas", "nuca", "cerebro", "lal", "pik", "headache", "head"],
    severity: "rutina",
    possibleCauses: ["Tension", "Migraña", "Dihidrateshan", "Yap apia", "Kupia trabil (estrés)"],
    recommendations: ["Watla tihmia kum ra ayan, saun apia.", "Paracetamol kaka ibuprofeno dis.", "Li glas wal kaka yuhmpa dis.", "Paña tahpla kum lal ra mangks."],
    warningSigns: ["Lel prukanka tara pali ba, pat kli witin tanka apia.", "Nakra kaikaia sip apia kaka, aisaia trabil.", "Wina urwanka tara bara lal kuyus kyama tara prukisa."]
  },
  {
    id: "kupia_sari",
    symptoms: ["Kupia sari tara", "Sîbri tara", "Kupia trabil tara", "Kupia pik pik implik", "Sîbri ailal pali"],
    keywords: ["kupia", "sari", "ansiedad", "estres", "panico", "sîbri", "palpitaciones", "nervios", "miedo", "angustia", "desespero", "anxiety", "stress", "panic", "fear", "trabil", "scared", "depresion", "triste"],
    severity: "rutina",
    possibleCauses: ["Ataque de pánico", "Kupia trabil tara", "Café ailal dimi", "Kupia trabil emosional"],
    recommendations: ["Plais kumi kupia krukaia ra waia — ayan iwi.", "Pasa sakaia '4-7-8' tékniko yus muns.", "Lal li tahpla wal klin muns.", "Tékniko 5-4-3-2-1 aisas."],
    warningSigns: ["Kupia ra prukanka tara mihta smihka ra wisa kaka (ansiedad apia sip sa).", "Episodio nani ailal pali ba.", "Man wina trabil daukaia lukisma kaka (IDEACIÓN SUICIDA - IMPLIK hilp pliks)."]
  },
  {
    id: "pawi_lakara",
    symptoms: ["Pawi", "Luki trabil", "Kauhwan luki apia", "Wina implik kyama prais takan"],
    keywords: ["pawi", "desmayo", "ataque", "convulsion", "epilepsia", "luki", "trabil", "kauhwan", "faint", "seizure", "kyama", "prais", "temblor", "espuma"],
    severity: "emergencia",
    possibleCauses: ["Epilepsia (Convulsiones)", "Desmayo por presión baja", "Azúcar baja", "Fiebre muy alta en niños"],
    recommendations: ["Upla pawi ba taya ra ayan mangkaia tasba ra.", "Lal munhtara paña pain kum mangkaia lal prukras dukiara.", "Bila ra DUKIA KUM SIN MANGKRAS.", "Upla ba tnia ra mangks saliva sakaia dukiara.", "Pawi ba takasbia kat kaiks."],
    warningSigns: ["Pawi ba 5 minit purara swi takras kaka.", "Pasa sakaia trabil pawi ningkara.", "Upla ba tukta brih kaka (embarazada)."]
  },
  {
    id: "alkohol_trabil",
    symptoms: ["Laya tahpla ailal din", "Alkohol trabil", "Luki saura laya tahpla wina", "Kupia kriwan laya wina"],
    keywords: ["laya", "tahpla", "alkohol", "alcohol", "borracho", "guaro", "ebrio", "intoxicacion", "resaca", "goma", "temblor", "abstinencia", "rum", "beer"],
    severity: "urgencia",
    possibleCauses: ["Intoxicación alcohólica", "Síndrome de abstinencia", "Resaca severa"],
    recommendations: ["Li ailal dis, suero oral pain sa.", "Upla ba pawi kaka tnia ra mangks plun sakaia taim dimi apia dukiara.", "Plun pain dis, vitamin B1 (Tiamina).", "Ayan yapaya."],
    warningSigns: ["Pasa sakaia sampi pali kaka pawi lakara lukisa kaka.", "Kupia kriwan tala wal.", "Wina implik kyama prais takan (delirium tremens)."]
  },

  
  {
    id: "alergia_reakshan",
    symptoms: ["Alergia", "Taya ra manka pauni nani", "Taya rih tara", "Taya puhban implik"],
    keywords: ["alergia", "ronchas", "manka", "picazon", "rih", "puhban", "taya", "rojo", "sarpullido", "alergico", "intoxicacion", "hives", "itch", "swelling", "pauni"],
    severity: "urgencia",
    possibleCauses: ["Kiangka ikan", "Plun alergia", "Midisin alergia"],
    recommendations: ["Antihistamínico kum dis (loratadina, cetirizina).", "Paña tahpla kum taya rih pali ra mangks.", "Taya rih ba kîs munras."],
    warningSigns: ["Bilam, twisa, kaka nakra pura ba implik puhban takisa.", "Pasa sakaia trabil implik.", "Lel prukanka tara, pawi lakara lukisa (Anafilaxia)."]
  },
  {
    id: "taya_siknis",
    symptoms: ["Taya siknis", "Taya rih tara", "Taya pauni manka nani", "Taya pus wal", "Taya tahwan pali"],
    keywords: ["taya", "siknis", "rih", "manka", "skin", "rash", "piel", "rojo", "pus", "grano", "acne", "eczema", "hongos", "fungus", "dermatitis", "pauni", "tahwan", "sarna", "escabiosis", "rasquiña"],
    severity: "rutina",
    possibleCauses: ["Dermatitis", "Hongos", "Infekshan bakteria", "Sarna (Escabiosis)"],
    recommendations: ["Taya ba li bara jabón suave wal klin muns.", "Taya rih kaka crema hidrocortisona 1% mangks.", "Hongos lukisma kaka crema clotrimazol mangks.", "Sarna lukisma kaka permethrin crema yus muns."],
    warningSigns: ["Taya siknis ba implik pali wisa wina sut ra.", "Wina urwanka tara taya siknis wal.", "Taya ra manka tihmia nani kli kli takisa pus wal."]
  },
  {
    id: "grano_pus",
    symptoms: ["Taya ra grano pus wal", "Nacida tara", "Taya prukanka pus wal", "Absceso"],
    keywords: ["grano", "pus", "nacida", "absceso", "chupo", "taya", "prukanka", "angki", "infeccion", "boil", "abscess"],
    severity: "rutina",
    possibleCauses: ["Infección bacteriana (Estafilococo)", "Foliculitis", "Absceso cutáneo"],
    recommendations: ["Paña laihni kum grano pura ra mangks pus ba sakaia dukiara.", "Grano ba MAN BAMAN KRUKRAS — infekshan implik wisa.", "Li bara jabón wal klin muns.", "Duktur ra waia antibiótico briaia dukiara."],
    warningSigns: ["Grano ba tara pali takisa bara prukanka tara brisma.", "Wina urwanka tara.", "Pus pauni kaka tihmia saura takisa kaka."]
  },

  
  {
    id: "karmak_prukanka",
    symptoms: ["Karmak prukanka", "Dimaia angki", "Karmak tahwan", "Karmak ra iriteshan", "Anginas tara"],
    keywords: ["karmak", "prukanka", "garganta", "tragar", "dimaia", "anginas", "amigdalas", "ardor", "ronquera", "tos", "carraspera", "saliva", "sore", "throat", "angki"],
    severity: "rutina",
    possibleCauses: ["Faringitis viral", "Amigdalitis bacteriana", "Alergia"],
    recommendations: ["Li laihni salt wal karmak rins muns.", "Li laihni ailal dis miel wal.", "Pastilla anestésica nani yus muns.", "Tobacco smok wina klahwaia."],
    warningSigns: ["Dimaia trabil tara pali man saliva sin dimaia sip apia.", "Pasa sakaia trabil.", "Wina urwanka tara amígdalas ra pus pihni kaikisa kaka."]
  },
  {
    id: "pasa_lalma_prukanka",
    symptoms: ["Pasa lalma prukanka", "Pasa lalma wina li takisa", "Walisma saura", "Pasa lalma rih"],
    keywords: ["pasa", "lalma", "oido", "ear", "dolor", "prukanka", "infeccion", "otitis", "sordo", "walisma", "escuchar", "zumbido", "hearing", "earache"],
    severity: "rutina",
    possibleCauses: ["Otitis (infección)", "Wax tara (cerumen)", "Li dimisa"],
    recommendations: ["Paracetamol kaka ibuprofeno dis.", "Paña laihni kum pasa lalma lata ra mangks.", "Pasa lalma ra dukia kum MANGKRAS (cotton bud sin apia).", "Li dimi kaka lal pali ra mangks."],
    warningSigns: ["Pasa lalma wina pus kaka tala takisa.", "Wina urwanka tara.", "Walisma sut sip apia kaka."]
  },
  {
    id: "napa_prukanka",
    symptoms: ["Napa prukanka", "Napa siknis", "Lal taya puhban", "Napa sensible"],
    keywords: ["napa", "prukanka", "muela", "diente", "caries", "encias", "dentista", "hinchazon", "cara", "mandibula", "siknis", "tooth", "dental", "toothache"],
    severity: "rutina",
    possibleCauses: ["Caries tara", "Absceso dental", "Gingivitis", "Napa wisdom impactada"],
    recommendations: ["Li laihni salt wal rins muns.", "Hilo dental wal sampi klin muns.", "Ibuprofeno dis.", "Paña tahpla kum lal taya lata wina mangks."],
    warningSigns: ["Lal taya puhban tara byara, lal, kaka kuyus ra.", "Wina urwanka tara.", "Bila kwahkaia trabil."]
  },
  {
    id: "nakra_siknis",
    symptoms: ["Nakra siknis", "Nakra prukanka", "Nakra pauni", "Nakra wina li takisa", "Nakra kaikaia trabil"],
    keywords: ["nakra", "siknis", "eye", "ojos", "rojo", "pauni", "vision", "kaikaia", "conjuntivitis", "dolor", "prukanka", "lagrimeo", "ardor", "li"],
    severity: "rutina",
    possibleCauses: ["Conjuntivitis", "Nakra tahwan", "Alergia", "Nakra ra dukia dimi", "Glaucoma"],
    recommendations: ["Nakra ba li klin (suero fisiológico) wal sampi klin muns.", "Nakra pauni kaka lágrimas artificiales yus muns.", "Nakra rih kaka mihta wal kîsras.", "Pantalla nani wina ayan yabaia."],
    warningSigns: ["Nakra kaikaia implik trabil.", "Nakra prukanka tara tara wal, lait kaikaia sip apia.", "Nakra ra dukia kum dimi bara sakaia sip apia."]
  },

  
  {
    id: "kyama_prukanka",
    symptoms: ["Kyama prukanka", "Wina prukanka tara", "Kyama tara tara", "Wina pri apia", "Kyama puhban"],
    keywords: ["kyama", "prukanka", "muscular", "articular", "wina", "cuerpo", "espalda", "rodilla", "cadera", "hombro", "cuello", "muscle", "joint", "pain", "stiff", "puhban", "artritis", "reumatismo"],
    severity: "rutina",
    possibleCauses: ["Wark tara", "Esguince", "Artritis", "Mala postura"],
    recommendations: ["Ayan mangkaia kyama ba wark yabras.", "Ice paña wal 15-20 minit mangks pas 48 hor ra.", "Ibuprofeno kaka diclofenaco dis.", "Stretching sampi sampi daukaia."],
    warningSigns: ["Kyama ba implik puhban tara, taukaia sin sip apia.", "Wina pri apia kaka hormigueo.", "Prukanka tara 2 wiki purara klahwras kaka."]
  },
  {
    id: "byara_wahbi_prukanka",
    symptoms: ["Byara wahbi prukanka", "Byara wahbi prukanka tara pali", "Byara wahbi kyama tara", "Mina ra pri apia wisa"],
    keywords: ["byara", "wahbi", "espalda", "back", "lumbar", "columna", "ciatica", "disco", "prukanka", "kyama", "tara", "spine", "lower", "sciatic", "cintura", "riñon"],
    severity: "rutina",
    possibleCauses: ["Contractura muscular", "Disco herniado", "Ciática", "Mala postura"],
    recommendations: ["Ayan mangkaia byara ba wark yabras 24-48 hor.", "Ice paña wal pas 48 hor ra.", "Ibuprofeno kaka naproxeno dis.", "Yapaia postura pain mangkaia."],
    warningSigns: ["Mina nani pri apia kaka swahwan kaka taukaia trabil.", "Chistata kaka kwih kontrolaia sip apia.", "Prukanka tara tara 2 wiki purara klahwras."]
  },

  
  {
    id: "diabetes_azucar",
    symptoms: ["Li dimi ailal", "Chistata ailal waia", "Nakra kaikaia saura takisa", "Wina swahwan", "Klaki klin takras"],
    keywords: ["azucar", "diabetes", "diabetico", "li", "chistata", "orina", "sed", "hambre", "swahwan", "cansancio", "klaki", "herida", "dulce", "sugar", "taya"],
    severity: "urgencia",
    possibleCauses: ["Diabetes mellitus (Azúcar alta)", "Hiperglicemia"],
    recommendations: ["Azúcar bara plun dulce nani dima APIA.", "Li pura ailal dis.", "Midisin (metformina, insulina) brisma kaka dis.", "Duktur ra waia azúcar test daukaia."],
    warningSigns: ["Pasa sakaia trabil bara pasa ba manzana smol baku.", "Luki trabil kaka pawi lakara lukisa (cetoacidosis).", "Klaki mina ra pus wal bara pain takras."]
  },
  {
    id: "presion_alta",
    symptoms: ["Lel prukanka tara pali", "Nakra ra lait sampi nani kaikisa", "Pasa lalma ra prukanka (zumbido)", "Kupia pik pik"],
    keywords: ["presion", "alta", "hipertension", "tala", "lel", "prukanka", "nakra", "lait", "zumbido", "oido", "mareo", "kupia", "pressure", "blood"],
    severity: "urgencia",
    possibleCauses: ["Hipertensión arterial (Presión alta)"],
    recommendations: ["Salt (sal) plun ra dima APIA.", "Iwi ayan pali, stress klahwaia.", "Presión midisin brisma kaka (losartán, enalapril) dis.", "Presión makabaia siknis watla ra."],
    warningSigns: ["Kupia prukanka tara.", "Mihta kaka mina smihka kumi pri apia takisa.", "Aisaia trabil kaka luki saura (derrame cerebral sip sa)."]
  },
  {
    id: "chistata_prukanka",
    symptoms: ["Chistata angki", "Chistata ailal pali waia", "Byara munhtara prukanka", "Chistata tihmia smol saura wal"],
    keywords: ["chistata", "orinar", "ardor", "orina", "angki", "vejiga", "riñones", "olor", "smol", "pipi", "urinary", "pee", "burning", "kidney", "infeccion", "chistras"],
    severity: "urgencia",
    possibleCauses: ["Infección urinaria (Cistitis)", "Cálculos renales (Walpaia)", "Infección renal"],
    recommendations: ["Li pura ailal dis chistata watla klin kaia.", "Café, alcohol, azúcar ailal dima APIA.", "Paña laihni kum byara munhtara mangks.", "Duktur ra waia antibiótico briaia dukiara."],
    warningSigns: ["Wina urwanka tara bara kupia kli prukanka tara.", "Prukanka tara byara nina kaka pali nani ra.", "Chistata ra tala pauni kaikisa."]
  },
  {
    id: "anemia_desnutricion",
    symptoms: ["Wina swahwan tara", "Taya pihni takisa", "Lel prukanka mareo wal", "Tala sampi lukisa"],
    keywords: ["anemia", "desnutricion", "tala", "sampi", "swahwan", "debil", "cansancio", "mareo", "taya", "pihni", "pale", "blood", "iron", "hierro", "vitamin"],
    severity: "rutina",
    possibleCauses: ["Anemia", "Desnutrición", "Parásitos intestinales"],
    recommendations: ["Plun pain nani dis: waha, inska, kalila, frijoles.", "Vitamin C (limón, naranja) dis hierro briaia dukiara.", "Duktur ra waia tala test daukaia.", "Parásito midisin dimaia sip sa."],
    warningSigns: ["Pasa sakaia trabil wark sampi daukaia taim.", "Pawi lakara lukisa.", "Kupia pik pik tara implik."]
  },
  {
    id: "lapta_prukanka",
    symptoms: ["Lapta prukanka", "Yu laih tara", "Lel prukanka tara yu laih wina", "Taya pauni bara tahwan", "Pawi yu laih wina"],
    keywords: ["lapta", "yu", "sol", "calor", "insolacion", "desmayo", "sofocado", "bochorno", "taya", "pauni", "tahwan", "temperatura", "pawi", "heat", "sun", "faint", "deshidratacion"],
    severity: "emergencia",
    possibleCauses: ["Golpe de calor", "Dihidrateshan tara"],
    recommendations: ["IMPLIK plais tahpla ra, sîkan munhtara brih waia.", "Kwala tara nani saks.", "Taya ba implik li tihmu wal liwan bara wingka yabaia.", "Li tihmu sampi sampi dis kaka suero oral."],
    warningSigns: ["Taya laih pali, pauni, bara TAHWAN (kupia puski sin apia).", "Pawi, luki trabil tara.", "Wina temperatura tara pali alkisma."]
  },
  {
    id: "limi_dimi",
    symptoms: ["Limi dimi", "Limi din", "Kemikol din", "Pesticida smol"],
    keywords: ["limi", "dimi", "veneno", "intoxicado", "pesticida", "cloro", "quimico", "kemikol", "agroquimico", "din", "bebió", "tomó", "poison", "toxic", "chemical"],
    severity: "emergencia",
    possibleCauses: ["Intoxicación por veneno", "Intoxicación agroquímica"],
    recommendations: ["Botella kaka etiqueta ba pliki duktur ra marikaia.", "PLUN SAKAIA APIA DAUKAIA (vómito) kemikol saura kaka.", "Milk kaka li YABRAS Toxicología Centro aisras kaka.", "IMPLIK hospital emergencia ra brih waia."],
    warningSigns: ["Limi dimi sut ba EMERGENCIA sa.", "Bilam kaka bila ra angkan kaikisa.", "Pasa sakaia trabil, wina prukanka tara, kaka pawi."]
  },

  
  {
    id: "mairin_tukta",
    symptoms: ["Mairin tukta brih trabil", "Tala takisa tukta brih taim", "Byara prukanka tara tukta brih taim", "Lel prukanka tara preeclampsia"],
    keywords: ["mairin", "tukta", "embarazo", "pregnant", "pregnancy", "tala", "byara", "prukanka", "prenatal", "bebe", "parto", "labor", "contracción", "sangrado", "preeclampsia", "presion"],
    severity: "emergencia",
    possibleCauses: ["Amenaza de aborto", "Preeclampsia", "Parto prematuro", "Embarazo ectópico"],
    recommendations: ["Tala takisa kaka IMPLIK hospital ra waia, ayan mangkaia.", "Byara prukanka tara kaka pali smihka ra ayan mangkaia.", "Midisin kum sin dima apia duktur aisras kaka.", "Li ailal dis."],
    warningSigns: ["Tala takisa tukta brih taim SIEMPRE emergencia sa.", "Lel prukanka tara tara, nakra kaikaia trabil.", "Li tara sakaia (fuente rompida)."]
  },
  {
    id: "tuktan_siknis",
    symptoms: ["Tuktan wina urwanka", "Tuktan kuhpanka", "Tuktan byara prukanka", "Tuktan taya ra manka nani", "Tuktan plun sakaia"],
    keywords: ["tuktan", "luhpia", "baby", "niño", "niña", "bebe", "child", "kids", "infant", "pediatric", "siknis", "wina", "urwanka", "kuhpanka", "plun"],
    severity: "urgencia",
    possibleCauses: ["Infección viral", "Gastroenteritis", "Sarampión/Varicela", "Deshidratación"],
    recommendations: ["Paracetamol pediátrico BAMAN dis (dosis tuktan pesa kat).", "Li ailal yabaia — suero oral, breast milk.", "Tuktan ba ayan mangkaia.", "ASPIRINA kaka IBUPROFENO tuktan sampi nani ra YABRAS."],
    warningSigns: ["Tuktan 3 kati munhtara wina urwanka tara kaka IMPLIK hospital.", "Tuktan plun dimaia apia kaka, nakra laya apia.", "Tuktan yapras, kupia krukras kaka."]
  },
  {
    id: "mairin_siknis",
    symptoms: ["Mairin siknis", "Munhtara rih tara", "Munhtara wina pus kaka laya saura takisa", "Munhtara prukanka"],
    keywords: ["mairin", "siknis", "infeccion", "vaginal", "rih", "picazon", "flujo", "olor", "saura", "pus", "candida", "hongo", "menstruacion", "regla", "sangrado"],
    severity: "rutina",
    possibleCauses: ["Infección vaginal (Hongos/Bacterias)", "Problemas menstruales"],
    recommendations: ["Li bara jabón neutro wal klin muns (munhtara baman, dimi apia).", "Kwala tahpla yus muns (algodón).", "Duktur ra waia óvulos kaka crema briaia dukiara."],
    warningSigns: ["Tala tara takisa taim apia kaka.", "Wina urwanka tara byara prukanka wal.", "Smol saura pali takisa kaka."]
  },
  {
    id: "titi_prukanka",
    symptoms: ["Titi prukanka", "Titi pauni bara laih", "Titi wina pus takisa", "Tuktan titi dimaia taim prukanka"],
    keywords: ["titi", "pecho", "mama", "seno", "leche", "mastitis", "prukanka", "pauni", "angki", "infeccion", "tuktan", "luhpia", "breast", "milk", "pus"],
    severity: "urgencia",
    possibleCauses: ["Mastitis (Infección mamaria)", "Conducto bloqueado"],
    recommendations: ["Titi ba tuktan ra yabaia swiras (tuktan dimaia ba klin daukisa).", "Ice paña mangks prukanka klakaia, bara paña laihni mangks titi laya sakaia kainara.", "Ibuprofeno dis.", "Duktur ra waia antibiótico briaia dukiara."],
    warningSigns: ["Wina urwanka tara bara kupia kli prukanka.", "Titi ra grano pus wal kaikisa kaka.", "Titi laya ra tala kaikisa kaka."]
  }
];

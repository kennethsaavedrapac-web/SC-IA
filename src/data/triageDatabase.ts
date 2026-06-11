export interface TriageRecord {
  id: string;
  symptoms: string[];
  keywords: string[];
  severity: "rutina" | "urgencia" | "emergencia";
  possibleCauses: string[];
  recommendations: string[];
  warningSigns: string[];
}

export const TRIAGE_DATABASE: TriageRecord[] = [
  {
    id: "fiebre_alta",
    symptoms: ["Fiebre alta", "Temperatura elevada", "Escalofríos", "Sudoración"],
    keywords: ["fiebre", "calentura", "temperatura", "escalofrios", "sudor", "frio", "hirviendo", "arder", "quema"],
    severity: "urgencia",
    possibleCauses: ["Infección viral", "Gripe", "Infección bacteriana", "Covid-19", "Dengue"],
    recommendations: [
      "Toma paracetamol (acetaminofén) para bajar la temperatura.",
      "Mantente muy bien hidratado bebiendo agua, sueros orales o jugos naturales.",
      "Aplica compresas tibias en la frente, axilas o ingle.",
      "Descansa en un ambiente fresco y ventilado."
    ],
    warningSigns: [
      "Fiebre superior a 39.5°C que no cede con medicamentos.",
      "Dificultad para respirar o rigidez en el cuello.",
      "Convulsiones o confusión mental aguda."
    ]
  },
  {
    id: "dengue_zika_chikungunya",
    symptoms: ["Dolor de huesos", "Dolor detrás de los ojos", "Sarpullido", "Fiebre rompehuesos"],
    keywords: ["dengue", "zika", "chikungunya", "huesos", "ojos", "sarpullido", "zancudo", "mosquito", "articulaciones", "cuerpo", "manchas"],
    severity: "urgencia",
    possibleCauses: ["Dengue", "Chikungunya", "Zika"],
    recommendations: [
      "Toma únicamente paracetamol. ¡NO tomes aspirina, ibuprofeno ni naproxeno (pueden causar hemorragias)!",
      "Bebe muchísimos líquidos (suero oral, agua de coco) para evitar deshidratación severa.",
      "Guarda reposo absoluto en cama bajo un mosquitero."
    ],
    warningSigns: [
      "Dolor abdominal intenso y continuo.",
      "Sangrado en encías, nariz, o aparición de moretones (petequias).",
      "Vómitos persistentes o alteraciones del estado de conciencia."
    ]
  },
  {
    id: "malaria",
    symptoms: ["Escalofríos severos", "Sudoración extrema", "Fiebre intermitente", "Temblores"],
    keywords: ["malaria", "paludismo", "temblor", "terciana", "escalofrio", "sudar", "zancudo", "selva"],
    severity: "urgencia",
    possibleCauses: ["Malaria (Paludismo)"],
    recommendations: [
      "La malaria requiere diagnóstico con prueba de gota gruesa en un centro de salud.",
      "Mantente hidratado y controla la fiebre temporalmente con paracetamol.",
      "Acude lo antes posible a tu centro de salud más cercano."
    ],
    warningSigns: [
      "Fiebre muy alta acompañada de ictericia (piel u ojos amarillos).",
      "Debilidad extrema o imposibilidad para caminar.",
      "Dificultad respiratoria."
    ]
  },
  {
    id: "dolor_cabeza_severo",
    symptoms: ["Dolor de cabeza", "Migraña", "Presión en la cabeza", "Punzadas en la cabeza"],
    keywords: ["dolor", "cabeza", "migraña", "cefalea", "presion", "punzadas", "nuca", "cerebro"],
    severity: "rutina",
    possibleCauses: ["Tensión", "Migraña", "Deshidratación", "Falta de sueño", "Problemas de visión", "Estrés"],
    recommendations: [
      "Descansa en una habitación oscura y silenciosa sin pantallas.",
      "Toma un analgésico de venta libre como paracetamol o ibuprofeno.",
      "Bebe un par de vasos de agua para descartar deshidratación.",
      "Aplica compresas frías en la frente o en la nuca."
    ],
    warningSigns: [
      "Es el 'peor dolor de cabeza de tu vida' y apareció de forma repentina.",
      "Viene acompañado de pérdida de visión, debilidad de un lado del cuerpo o dificultad para hablar.",
      "Fiebre alta y rigidez de cuello."
    ]
  },
  {
    id: "dificultad_respiratoria",
    symptoms: ["Dificultad para respirar", "Falta de aire", "Asfixia", "Pecho apretado", "Silbido al respirar"],
    keywords: ["aire", "respirar", "ahogo", "asfixia", "pecho", "pulmones", "asma", "ahogando", "sofoco", "silbido"],
    severity: "emergencia",
    possibleCauses: ["Ataque de asma", "Reacción alérgica severa", "Neumonía", "Problema cardíaco", "EPOC"],
    recommendations: [
      "Mantén la calma y siéntate erguido ligeramente inclinado hacia adelante.",
      "Si tienes un inhalador de rescate (ej. salbutamol), utilízalo inmediatamente.",
      "Afloja la ropa apretada alrededor del cuello y pecho.",
      "Pide ayuda de inmediato para que te trasladen a emergencias."
    ],
    warningSigns: [
      "Labios, rostro o uñas de color azulado o grisáceo.",
      "Incapacidad para pronunciar oraciones completas por falta de aire.",
      "Hundimiento del pecho al respirar."
    ]
  },
  {
    id: "dolor_pecho",
    symptoms: ["Dolor de pecho", "Opresión torácica", "Punzadas en el pecho", "Ardor en el pecho"],
    keywords: ["pecho", "corazon", "infarto", "opresion", "punzada", "ardor", "brazo", "izquierdo", "torax", "taquicardia"],
    severity: "emergencia",
    possibleCauses: ["Infarto agudo de miocardio", "Angina de pecho", "Reflujo gastroesofágico fuerte", "Ataque de ansiedad o pánico"],
    recommendations: [
      "Detén cualquier actividad física inmediatamente y siéntate en reposo absoluto.",
      "Si tienes medicación para el corazón (nitroglicerina), tómala según indicaciones.",
      "Mastica una aspirina (300mg) si sospechas de un infarto y no eres alérgico.",
      "LLAMA INMEDIATAMENTE A EMERGENCIAS O PIDE TRASLADO AL HOSPITAL."
    ],
    warningSigns: [
      "Dolor opresivo pesado que se irradia al brazo izquierdo, cuello o mandíbula.",
      "Sudoración fría profusa, náuseas, mareos severos o sensación de desmayo.",
      "Falta de aire acompañando al dolor."
    ]
  },
  {
    id: "dolor_abdominal",
    symptoms: ["Dolor de estómago", "Dolor abdominal", "Retorcijones", "Cólicos fuertes"],
    keywords: ["estomago", "barriga", "abdomen", "panza", "colico", "retorcijon", "apendice", "gastritis", "ulceras"],
    severity: "urgencia",
    possibleCauses: ["Gastroenteritis", "Apendicitis", "Intoxicación alimentaria", "Cálculos biliares", "Infección intestinal"],
    recommendations: [
      "Evita ingerir alimentos sólidos o pesados por unas horas.",
      "Bebe pequeños sorbos de agua o suero oral.",
      "⚠️ NO tomes analgésicos fuertes ni antiespasmódicos si el dolor es muy agudo, ya que pueden ocultar síntomas de apendicitis.",
      "Aplica calor suave en la zona si notas que son solo cólicos o gases."
    ],
    warningSigns: [
      "Dolor muy agudo que empeora o se localiza en la parte inferior derecha del abdomen.",
      "Abdomen rígido (duro como tabla) al tacto.",
      "Presencia de vómitos con sangre o heces muy oscuras (negras)."
    ]
  },
  {
    id: "nauseas_vomitos",
    symptoms: ["Náuseas", "Vómitos", "Estómago revuelto", "Ganas de vomitar", "Devolver la comida"],
    keywords: ["nauseas", "vomito", "asco", "mareo", "estomago", "comida", "devolver", "vómito", "bomitar"],
    severity: "rutina",
    possibleCauses: ["Intoxicación alimentaria", "Infección viral (gripe estomacal)", "Embarazo", "Mareo por movimiento"],
    recommendations: [
      "Espera de 30 a 60 minutos después del último vómito antes de intentar beber algo.",
      "Comienza con sorbos muy pequeños de suero oral o agua de coco cada 10 minutos.",
      "Introduce alimentos blandos progresivamente (arroz blanco, tostadas, compota).",
      "Descansa en posición semisentada."
    ],
    warningSigns: [
      "Incapacidad absoluta para retener líquidos por más de 12-24 horas.",
      "Vómitos de color verde oscuro, o con apariencia de 'borra de café' o sangre roja.",
      "Signos de deshidratación grave: orina muy oscura, ausencia de lágrimas, confusión."
    ]
  },
  {
    id: "reaccion_alergica",
    symptoms: ["Alergia", "Ronchas en la piel", "Picazón en el cuerpo", "Hinchazón repentina"],
    keywords: ["alergia", "ronchas", "pico", "picazon", "hinchazon", "rojo", "sarpullido", "alergico", "intoxicacion"],
    severity: "urgencia",
    possibleCauses: ["Picadura de insecto (abeja, avispa)", "Alergia alimentaria (mariscos, maní)", "Reacción a medicamentos", "Contacto con químicos"],
    recommendations: [
      "Toma un antihistamínico de venta libre (como loratadina, cetirizina o clorfeniramina).",
      "Aplica compresas frías en las zonas con mayor picazón.",
      "Si fue picadura, revisa si quedó aguijón y retíralo raspando con una tarjeta (no lo exprimas).",
      "Evita rascarte para prevenir infecciones en la piel."
    ],
    warningSigns: [
      "Hinchazón rápida de los labios, lengua, garganta o párpados.",
      "Dificultad repentina para respirar, tragar o sensación de nudo en la garganta.",
      "Mareo severo, confusión o sensación de desmayo inminente (Anafilaxia)."
    ]
  },
  {
    id: "trauma_cortes",
    symptoms: ["Corte profundo", "Herida", "Sangrado", "Raspón", "Hemorragia"],
    keywords: ["corte", "sangre", "herida", "raspon", "caida", "cuchillo", "machete", "sangrando", "hemorragia", "abierta"],
    severity: "urgencia",
    possibleCauses: ["Accidente doméstico", "Caída traumática", "Uso de herramientas", "Accidente de tránsito"],
    recommendations: [
      "Lava tus manos si es posible antes de atender la herida.",
      "Aplica PRESION DIRECTA y constante sobre la herida con un paño limpio o gasa estéril durante 10-15 minutos seguidos.",
      "Si el paño se empapa, coloca otro encima sin quitar el primero.",
      "Eleva la extremidad afectada por encima del nivel del corazón para reducir el flujo sanguíneo."
    ],
    warningSigns: [
      "El sangrado es a chorros (pulsátil) o no se detiene tras 15 minutos de presión firme.",
      "La herida es muy profunda, expone hueso/músculo/grasa o tiene bordes muy separados.",
      "Hay entumecimiento o pérdida de movilidad por debajo de la zona del corte."
    ]
  },
  {
    id: "quemaduras",
    symptoms: ["Quemadura", "Ardor fuerte en la piel", "Ampollas por quemadura"],
    keywords: ["quemadura", "fuego", "calor", "agua", "hirviendo", "aceite", "sol", "ampolla", "queme", "quemo", "plancha"],
    severity: "urgencia",
    possibleCauses: ["Líquidos hirviendo", "Fuego directo", "Superficies calientes (plancha, escape de moto)", "Quemadura química o eléctrica"],
    recommendations: [
      "Enfría la quemadura inmediatamente bajo un chorro de agua corriente (a temperatura ambiente o fresca, nunca helada) durante 15 minutos.",
      "⚠️ NO apliques hielo, pasta dental, mantequilla, café ni otros remedios caseros. Empeorarán el tejido.",
      "Cubre la zona con una gasa estéril suelta o un paño de algodón limpio humedecido.",
      "NO revientes las ampollas, ya que protegen contra infecciones."
    ],
    warningSigns: [
      "La quemadura afecta cara, manos, pies, genitales o articulaciones grandes.",
      "La quemadura es de 3er grado (piel de aspecto blanco, carbonizada, coriácea o si irónicamente NO hay dolor en el centro).",
      "La lesión fue por electricidad o sustancias químicas corrosivas."
    ]
  },
  {
    id: "garganta",
    symptoms: ["Dolor de garganta", "Ardor al tragar", "Garganta seca", "Irritación en la garganta", "Anginas"],
    keywords: ["garganta", "tragar", "anginas", "amigdalas", "ardor", "ronquera", "tos", "carraspera", "saliva"],
    severity: "rutina",
    possibleCauses: ["Faringitis viral", "Amigdalitis bacteriana", "Alergias", "Reflujo nocturno", "Aire acondicionado seco"],
    recommendations: [
      "Haz gárgaras con agua tibia y sal (media cucharadita de sal en un vaso de agua) varias veces al día.",
      "Mantén buena hidratación tomando líquidos tibios con miel o limón.",
      "Puedes usar pastillas anestésicas de venta libre para adormecer el ardor.",
      "Evita hablar demasiado y exponerte a humo de tabaco o polvo."
    ],
    warningSigns: [
      "Dificultad extrema para tragar incluso tu propia saliva (babeo inusual).",
      "Dificultad para respirar o abrir completamente la boca.",
      "Fiebre muy alta acompañada de placas blancas/pus muy visibles en las amígdalas y ganglios inflamados."
    ]
  },
  {
    id: "resfriado_gripe",
    symptoms: ["Congestión nasal", "Mocos", "Estornudos", "Cuerpo cortado", "Malestar general"],
    keywords: ["gripe", "resfriado", "moco", "nariz", "estornudo", "catarro", "congestion", "mocos", "tupida", "virus"],
    severity: "rutina",
    possibleCauses: ["Rinovirus (resfriado común)", "Influenza", "Covid-19", "Alergia estacional"],
    recommendations: [
      "Descansa lo más posible para ayudar a tu sistema inmunitario.",
      "Realiza lavados nasales con suero fisiológico para despejar la congestión.",
      "Bebe abundantes líquidos cálidos (caldos, tés, limonada caliente).",
      "Para la congestión, puedes hacer inhalaciones de vapor (vaporizaciones) con precaución de no quemarte."
    ],
    warningSigns: [
      "Fiebre alta persistente por más de 3 días que no baja.",
      "Dificultad para respirar, dolor tipo puntada en el pecho al toser.",
      "Dolor intenso en la cara o frente (senos paranasales) acompañado de moco espeso y fétido."
    ]
  },
  {
    id: "diarrea",
    symptoms: ["Diarrea", "Evacuaciones líquidas", "Ir al baño a cada rato", "Heces aguadas"],
    keywords: ["diarrea", "liquido", "baño", "infeccion", "deposiciones", "chorro", "aguado", "curso"],
    severity: "rutina",
    possibleCauses: ["Gastroenteritis viral", "Amebas o parásitos", "Intoxicación por comida dañada", "Uso de antibióticos"],
    recommendations: [
      "La rehidratación es lo más importante: bebe litros de Suero de Rehidratación Oral a sorbos pequeños.",
      "Mantén una dieta astringente y blanda (arroz blanco, guineo/plátano, manzana sin cáscara, pollo hervido).",
      "Evita lácteos, grasas, comida frita, exceso de azúcar y fibra insoluble.",
      "NO tomes pastillas para detener la diarrea (loperamida) a menos que lo autorice un médico, pues retienen la infección."
    ],
    warningSigns: [
      "Diarrea que dura más de 3-4 días sin mejoría.",
      "Presencia evidente de sangre fresca o moco muy denso en las heces.",
      "Signos de deshidratación peligrosa (lengua áspera, mareos graves, orina muy escasa y oscura)."
    ]
  },
  {
    id: "ansiedad_estres",
    symptoms: ["Ansiedad", "Ataque de pánico", "Estrés", "Palpitaciones", "Miedo intenso"],
    keywords: ["ansiedad", "estres", "panico", "palpitaciones", "nervios", "miedo", "angustia", "desespero", "loco"],
    severity: "rutina",
    possibleCauses: ["Ataque de pánico", "Trastorno de ansiedad aguda", "Consumo alto de cafeína/bebidas energéticas", "Estrés emocional"],
    recommendations: [
      "Busca un lugar tranquilo y siéntate. Recuerda que esta sensación es temporal y pasará.",
      "Realiza respiración profunda '4-7-8': Inhala en 4 segundos, sostén por 7, exhala lentamente por la boca en 8 segundos.",
      "Lávate la cara con agua fría o sostén un cubo de hielo para 'resetear' tu sistema nervioso.",
      "Prueba la técnica 5-4-3-2-1: Nombra 5 cosas que veas, 4 que puedas tocar, 3 que escuches, 2 que huelas y 1 que saborees."
    ],
    warningSigns: [
      "Si sientes opresión central en el pecho que viaja al brazo izquierdo o mandíbula, y sudor frío (esto podría ser un problema cardíaco simulando ansiedad).",
      "Si los episodios son muy frecuentes e incapacitantes.",
      "Pensamientos fuertes de hacerse daño a uno mismo o a otros."
    ]
  },
  {
    id: "mordedura_serpiente",
    symptoms: ["Mordedura de serpiente", "Picadura de culebra", "Dolor intenso punzante en extremidad", "Dos marcas de colmillos"],
    keywords: ["serpiente", "culebra", "mordedura", "veneno", "vibora", "cascabel", "barba", "amarilla", "corales", "colmillos", "pico"],
    severity: "emergencia",
    possibleCauses: ["Envenenamiento ofídico (Serpiente venenosa)", "Mordedura de serpiente no venenosa"],
    recommendations: [
      "Mantén a la víctima COMPLETAMENTE INMÓVIL y en calma para ralentizar la propagación del veneno.",
      "Lava suavemente la zona con agua y jabón.",
      "Retira anillos, relojes o ropa ajustada en la extremidad afectada, ya que se hinchará rápidamente.",
      "Dirígete de INMEDIATO al hospital más cercano para la administración de suero antiofídico.",
      "⚠️ NUNCA hagas torniquetes, NO cortes la herida, NO intentes chupar el veneno y NO apliques hielo."
    ],
    warningSigns: [
      "Toda mordedura de serpiente en Nicaragua debe ser tratada como emergencia médica hasta que un médico certifique lo contrario.",
      "Sangrado incontrolable en el sitio de la herida o en encías.",
      "Dificultad respiratoria, párpados caídos o parálisis (signos de veneno neurotóxico)."
    ]
  },
  {
    id: "picadura_alacran",
    symptoms: ["Picadura de alacrán", "Picadura de escorpión", "Adormecimiento", "Dolor quemante localizado"],
    keywords: ["alacran", "escorpion", "picadura", "pico", "adormecimiento", "lengua", "hormigueo", "veneno"],
    severity: "urgencia",
    possibleCauses: ["Picadura por escorpión / alacrán"],
    recommendations: [
      "Lava la zona con agua y jabón.",
      "Aplica una compresa fría o hielo envuelto en un paño en el sitio de la picadura (por máximo 10 mins).",
      "Mantén la zona en reposo.",
      "Toma un analgésico (paracetamol o ibuprofeno) para el dolor."
    ],
    warningSigns: [
      "Niños menores de 5 años y adultos mayores DEBEN ir al hospital de emergencia siempre.",
      "Sensación de hormigueo o adormecimiento en la boca, lengua o cara.",
      "Movimientos oculares rápidos involuntarios, salivación excesiva o dificultad para respirar."
    ]
  },
  {
    id: "insolacion",
    symptoms: ["Insolación", "Golpe de calor", "Mareo por calor", "Piel roja y seca", "Desmayo por sol"],
    keywords: ["sol", "calor", "insolacion", "desmayo", "sofocado", "bochorno", "piel", "roja", "seca", "temperatura"],
    severity: "emergencia",
    possibleCauses: ["Golpe de calor", "Deshidratación extrema por exposición solar", "Agotamiento por calor"],
    recommendations: [
      "Traslada a la persona a un lugar fresco, con sombra y bien ventilado inmediatamente.",
      "Afloja o quita el exceso de ropa.",
      "Refresca el cuerpo rápidamente mojando la piel con esponjas o rociando agua a temperatura ambiente (¡no helada!) y abanicando vigorosamente.",
      "Si la persona está completamente consciente, ofrécele agua fresca o suero en pequeños sorbos."
    ],
    warningSigns: [
      "Piel muy caliente, roja y SECA (ausencia de sudor a pesar del calor excesivo).",
      "Pérdida del conocimiento, confusión severa o convulsiones.",
      "Temperatura corporal que al tacto se siente extremadamente elevada."
    ]
  },
  {
    id: "dolor_muela",
    symptoms: ["Dolor de muela", "Dolor de diente", "Hinchazón en la cara", "Sensibilidad dental"],
    keywords: ["muela", "diente", "caries", "encias", "odontologo", "dentista", "hinchazon", "cara", "mandibula"],
    severity: "rutina",
    possibleCauses: ["Caries profunda", "Absceso dental", "Gingivitis severa", "Muela del juicio impactada"],
    recommendations: [
      "Realiza enjuagues suaves con agua tibia y sal para limpiar la zona.",
      "Usa hilo dental cuidadosamente para remover cualquier resto de comida que presione la encía.",
      "Toma analgésicos/antiinflamatorios como ibuprofeno para controlar el dolor y la inflamación.",
      "Aplica compresas frías por fuera de la mejilla (nunca calor directo si hay infección)."
    ],
    warningSigns: [
      "Hinchazón evidente en la mejilla, cara, mandíbula o cuello.",
      "Fiebre asociada al dolor dental.",
      "Dificultad para abrir la boca o para tragar."
    ]
  },
  {
    id: "infeccion_urinaria",
    symptoms: ["Ardor al orinar", "Orinar a cada rato", "Dolor en el vientre bajo", "Orina oscura o con mal olor"],
    keywords: ["orina", "orinar", "ardor", "pipi", "orin", "vejiga", "riñones", "mal", "olor", "chistata"],
    severity: "urgencia",
    possibleCauses: ["Infección del tracto urinario (Cistitis)", "Cálculos renales (piedras)", "Infección renal (Pielonefritis)"],
    recommendations: [
      "Bebe mucha cantidad de agua pura para 'limpiar' y vaciar la vejiga constantemente.",
      "Evita el café, alcohol y bebidas muy azucaradas o irritantes.",
      "Aplica calor suave en el vientre bajo para calmar la molestia.",
      "Acude al médico para un examen de orina; probablemente necesites antibióticos."
    ],
    warningSigns: [
      "Fiebre y escalofríos intensos.",
      "Dolor fuerte en la parte baja de la espalda o en los costados (zona lumbar).",
      "Presencia visible de sangre franca en la orina."
    ]
  },
  {
    id: "intoxicacion_quimica",
    symptoms: ["Intoxicación", "Ingesta de veneno", "Inhalación de químicos", "Olor a pesticida"],
    keywords: ["veneno", "intoxicado", "pesticida", "cloro", "quimico", "tomó", "bebió", "veneno", "agroquimico"],
    severity: "emergencia",
    possibleCauses: ["Ingesta accidental o voluntaria de sustancias tóxicas", "Inhalación de vapores tóxicos (agroquímicos)"],
    recommendations: [
      "Busca el envase o etiqueta del producto que se ingirió para mostrarlo al médico.",
      "⚠️ NO provoques el vómito bajo ninguna circunstancia (si es un ácido, cloro o producto corrosivo, quemará al salir).",
      "NO des a beber leche ni agua a menos que el Centro de Toxicología lo indique explícitamente.",
      "Traslada a la persona de inmediato a la unidad de emergencia hospitalaria más cercana."
    ],
    warningSigns: [
      "Todo caso de sospecha de intoxicación química es una emergencia médica que no admite demora.",
      "Quemaduras visibles en los labios o boca.",
      "Dificultad para respirar, convulsiones o pérdida de la conciencia."
    ]
  }
];

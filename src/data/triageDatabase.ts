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
    keywords: ["fiebre", "calentura", "temperatura", "escalofrios", "sudor", "frio"],
    severity: "urgencia",
    possibleCauses: ["Infección viral", "Infección bacteriana", "Gripe", "Dengue", "Malaria"],
    recommendations: [
      "Toma paracetamol (acetaminofén) para bajar la temperatura.",
      "Mantente muy bien hidratado bebiendo agua o sueros orales.",
      "Aplica compresas tibias en la frente, axilas o ingle.",
      "Descansa en un ambiente fresco y ventilado."
    ],
    warningSigns: [
      "Fiebre superior a 39.5°C (103°F) que no baja con medicamentos.",
      "Dificultad para respirar.",
      "Rigidez en el cuello o confusión mental.",
      "Convulsiones."
    ]
  },
  {
    id: "dolor_cabeza_severo",
    symptoms: ["Dolor de cabeza", "Migraña", "Presión en la cabeza"],
    keywords: ["dolor", "cabeza", "migraña", "cefalea", "presion", "punzadas"],
    severity: "rutina",
    possibleCauses: ["Tensión", "Migraña", "Deshidratación", "Falta de sueño", "Problemas de visión"],
    recommendations: [
      "Descansa en una habitación oscura y silenciosa.",
      "Toma un analgésico de venta libre como ibuprofeno o paracetamol.",
      "Asegúrate de beber suficiente agua.",
      "Aplica compresas frías en la frente o nuca."
    ],
    warningSigns: [
      "Es el 'peor dolor de cabeza de tu vida'.",
      "Viene acompañado de pérdida de visión, debilidad en un lado del cuerpo o dificultad para hablar.",
      "Fiebre alta y rigidez de nuca."
    ]
  },
  {
    id: "dificultad_respiratoria",
    symptoms: ["Dificultad para respirar", "Falta de aire", "Asfixia", "Pecho apretado"],
    keywords: ["aire", "respirar", "ahogo", "asfixia", "pecho", "pulmones", "asma"],
    severity: "emergencia",
    possibleCauses: ["Ataque de asma", "Reacción alérgica severa (Anafilaxia)", "Infección respiratoria grave", "Problema cardíaco"],
    recommendations: [
      "Mantén la calma y siéntate erguido.",
      "Si tienes un inhalador de rescate (salbutamol), utilízalo inmediatamente.",
      "Afloja la ropa apretada.",
      "Busca ayuda médica de emergencia."
    ],
    warningSigns: [
      "Labios o rostro de color azulado.",
      "Incapacidad para hablar oraciones completas.",
      "Dolor opresivo en el pecho acompañando la falta de aire."
    ]
  },
  {
    id: "dolor_pecho",
    symptoms: ["Dolor de pecho", "Opresión torácica", "Punzadas en el pecho"],
    keywords: ["pecho", "corazon", "infarto", "opresion", "punzada", "ardor", "brazo"],
    severity: "emergencia",
    possibleCauses: ["Infarto agudo de miocardio", "Angina de pecho", "Reflujo gastroesofágico fuerte", "Ataque de ansiedad"],
    recommendations: [
      "Detén cualquier actividad física inmediatamente y siéntate.",
      "Si tienes nitroglicerina recetada, tómala según las indicaciones.",
      "Si sospechas de un infarto, mastica una aspirina de 300mg (si no eres alérgico).",
      "Pide a alguien que llame a emergencias o ve a Urgencias."
    ],
    warningSigns: [
      "Dolor que se irradia al brazo izquierdo, cuello o mandíbula.",
      "Sudoración fría, náuseas o mareos severos.",
      "Sensación de peso aplastante en el centro del pecho."
    ]
  },
  {
    id: "dolor_abdominal",
    symptoms: ["Dolor de estómago", "Dolor abdominal", "Retorcijones", "Cólicos"],
    keywords: ["estomago", "barriga", "abdomen", "panza", "colico", "retorcijon", "apendice"],
    severity: "urgencia",
    possibleCauses: ["Gastroenteritis", "Apendicitis", "Intoxicación alimentaria", "Cálculos biliares"],
    recommendations: [
      "Evita comer alimentos sólidos por unas horas.",
      "Bebe sorbos pequeños de agua o suero oral.",
      "No tomes analgésicos fuertes sin prescripción ya que pueden ocultar síntomas de apendicitis.",
      "Aplica calor suave en la zona si son cólicos."
    ],
    warningSigns: [
      "Dolor agudo que empeora en la parte inferior derecha del abdomen.",
      "Vómitos con sangre o heces muy oscuras.",
      "Abdomen rígido o duro al tacto."
    ]
  },
  {
    id: "nauseas_vomitos",
    symptoms: ["Náuseas", "Vómitos", "Ganas de vomitar", "Estómago revuelto"],
    keywords: ["nauseas", "vomito", "asco", "mareo", "estomago", "comida"],
    severity: "rutina",
    possibleCauses: ["Intoxicación alimentaria", "Infección viral (gripe estomacal)", "Embarazo", "Mareo por movimiento"],
    recommendations: [
      "Espera unas horas después del último vómito antes de intentar beber.",
      "Comienza con sorbos muy pequeños de agua o suero.",
      "Introduce alimentos blandos progresivamente (arroz, compota de manzana, tostadas).",
      "Descansa en posición semisentada."
    ],
    warningSigns: [
      "Incapacidad para retener líquidos por más de 12 horas.",
      "Vómitos de color verde oscuro, amarillo intenso o con apariencia de borra de café.",
      "Signos de deshidratación severa (boca muy seca, no orinar)."
    ]
  },
  {
    id: "reaccion_alergica",
    symptoms: ["Alergia", "Ronchas", "Picazón", "Hinchazón"],
    keywords: ["alergia", "ronchas", "pico", "picazon", "hinchazon", "rojo", "sarpullido"],
    severity: "urgencia",
    possibleCauses: ["Picadura de insecto", "Alergia alimentaria", "Reacción a medicamentos", "Contacto con plantas o químicos"],
    recommendations: [
      "Toma un antihistamínico de venta libre (como loratadina o cetirizina).",
      "Aplica compresas frías en las zonas con picazón.",
      "Si la causa fue una picadura, retira el aguijón si sigue ahí.",
      "No te rasques para evitar infecciones secundarias."
    ],
    warningSigns: [
      "Hinchazón rápida de labios, lengua o garganta.",
      "Dificultad repentina para respirar o tragar.",
      "Sensación de desmayo inminente o mareo severo."
    ]
  },
  {
    id: "trauma_cortes",
    symptoms: ["Corte", "Herida", "Sangrado", "Raspón"],
    keywords: ["corte", "sangre", "herida", "raspon", "caida", "cuchillo"],
    severity: "urgencia",
    possibleCauses: ["Accidente doméstico", "Caída", "Uso de herramientas punzocortantes"],
    recommendations: [
      "Aplica presión directa sobre la herida con un paño limpio o gasa estéril durante 10 minutos.",
      "Lava la herida suavemente con agua y jabón neutro una vez que el sangrado disminuya.",
      "Aplica un antiséptico y cubre con una venda limpia.",
      "Eleva la zona afectada si es posible."
    ],
    warningSigns: [
      "El sangrado no se detiene después de 15 minutos de presión firme.",
      "La herida es muy profunda, con bordes separados o expone músculo/grasa.",
      "Hay pérdida de sensibilidad o movimiento por debajo del corte."
    ]
  },
  {
    id: "quemaduras",
    symptoms: ["Quemadura", "Ardor en la piel", "Ampollas"],
    keywords: ["quemadura", "fuego", "calor", "agua hirviendo", "aceite", "sol", "ampolla"],
    severity: "urgencia",
    possibleCauses: ["Líquidos calientes", "Fuego directo", "Exposición prolongada al sol", "Contacto con superficies calientes"],
    recommendations: [
      "Enfría la quemadura inmediatamente bajo agua corriente fría (no helada) durante 10-15 minutos.",
      "No apliques hielo, mantequilla ni remedios caseros como pasta dental.",
      "Cubre la zona con una gasa estéril o un paño limpio y húmedo.",
      "Toma un analgésico de venta libre para el dolor."
    ],
    warningSigns: [
      "La quemadura afecta la cara, manos, pies, ingles o articulaciones principales.",
      "Es de tercer grado (la piel luce blanca, carbonizada o no hay dolor).",
      "La quemadura abarca un área extensa del cuerpo."
    ]
  },
  {
    id: "garganta",
    symptoms: ["Dolor de garganta", "Ardor al tragar", "Garganta seca", "Irritación en la garganta"],
    keywords: ["garganta", "tragar", "anginas", "amigdalas", "ardor", "ronquera", "tos"],
    severity: "rutina",
    possibleCauses: ["Faringitis viral", "Infección por estreptococo", "Alergias", "Reflujo", "Ambiente seco"],
    recommendations: [
      "Haz gárgaras con agua tibia y sal (media cucharadita en un vaso).",
      "Mantén la hidratación tomando tés tibios con miel o limón.",
      "Chupa pastillas analgésicas para la garganta.",
      "Evita el humo del tabaco y bebidas muy frías."
    ],
    warningSigns: [
      "Dificultad severa para tragar la propia saliva.",
      "Hinchazón en el cuello o ganglios muy inflamados.",
      "Presencia de placas de pus blancas en las amígdalas y fiebre alta."
    ]
  },
  {
    id: "resfriado_gripe",
    symptoms: ["Congestión nasal", "Mocos", "Estornudos", "Cuerpo cortado", "Malestar general"],
    keywords: ["gripe", "resfriado", "moco", "nariz", "estornudo", "catarro", "congestion"],
    severity: "rutina",
    possibleCauses: ["Rinovirus (resfriado común)", "Influenza (gripe)", "Alergias estacionales"],
    recommendations: [
      "Descansa lo más posible para que tu sistema inmune trabaje.",
      "Usa lavados nasales con solución salina para despejar la nariz.",
      "Consume abundantes líquidos calientes (caldos, tés).",
      "Toma antigripales o paracetamol para aliviar los síntomas musculares."
    ],
    warningSigns: [
      "Fiebre alta persistente por más de 3-4 días.",
      "Dificultad para respirar o dolor en el pecho al toser.",
      "Mucosidad verdosa acompañada de dolor intenso en los senos paranasales."
    ]
  },
  {
    id: "diarrea",
    symptoms: ["Diarrea", "Evacuaciones líquidas", "Ir al baño a cada rato"],
    keywords: ["diarrea", "liquido", "baño", "infeccion", "deposiciones"],
    severity: "rutina",
    possibleCauses: ["Infección viral", "Intoxicación alimentaria", "Estrés", "Uso de antibióticos"],
    recommendations: [
      "Mantén una hidratación constante con sales de rehidratación oral (suero).",
      "Sigue una dieta astringente (arroz, puré de manzana, plátano, pan tostado).",
      "Evita los lácteos, grasas y azúcares.",
      "No uses medicamentos para detener la diarrea a menos que el médico lo indique."
    ],
    warningSigns: [
      "Diarrea persistente por más de 3 días.",
      "Presencia de sangre o moco en las heces.",
      "Signos de deshidratación (mareos, boca muy seca, ausencia de lágrimas)."
    ]
  },
  {
    id: "ansiedad_estres",
    symptoms: ["Ansiedad", "Ataque de pánico", "Estrés", "Palpitaciones", "Miedo"],
    keywords: ["ansiedad", "estres", "panico", "palpitaciones", "nervios", "miedo", "angustia"],
    severity: "rutina",
    possibleCauses: ["Ataque de ansiedad", "Estrés crónico", "Consumo excesivo de cafeína", "Agotamiento"],
    recommendations: [
      "Realiza respiraciones profundas: inhala en 4 segundos, sostén por 4, y exhala en 6.",
      "Busca un lugar tranquilo y siéntate. Cierra los ojos.",
      "Bebe un poco de agua fría a pequeños sorbos.",
      "Intenta distraer tu mente enfocándote en 5 cosas que puedas ver a tu alrededor."
    ],
    warningSigns: [
      "Si sientes opresión fuerte en el pecho y el dolor se va al brazo, puede ser un infarto, busca ayuda médica de inmediato.",
      "Si la ansiedad impide realizar actividades diarias normales.",
      "Si hay pensamientos de autolesión o suicidio."
    ]
  }
];

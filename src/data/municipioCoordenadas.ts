/**
 * Coordenadas geográficas reales de los 158 municipios de Nicaragua
 * Fuente: datos geográficos públicos del INIDE / GeoNames
 * Se usan como fallback cuando el centro de salud no tiene latitud/longitud
 */

export interface MunicipioCoordenada {
  lat: number;
  lng: number;
  departamento: string;
}

const MUNICIPIO_DB: Record<string, MunicipioCoordenada> = {
  // BOACO
  "boaco": { lat: 12.4667, lng: -85.6833, departamento: "Boaco" },
  "camoapa": { lat: 12.3833, lng: -85.5333, departamento: "Boaco" },
  "san lorenzo": { lat: 12.2167, lng: -85.6333, departamento: "Boaco" },
  "san jose de los remates": { lat: 12.3167, lng: -85.6333, departamento: "Boaco" },
  "santa lucia": { lat: 12.2167, lng: -85.6667, departamento: "Boaco" },
  "teustepe": { lat: 12.25, lng: -85.7167, departamento: "Boaco" },

  // CARAZO
  "diriamba": { lat: 11.8333, lng: -86.2167, departamento: "Carazo" },
  "dolores": { lat: 11.8333, lng: -86.25, departamento: "Carazo" },
  "el rosario": { lat: 11.85, lng: -86.2167, departamento: "Carazo" },
  "jinotepe": { lat: 11.85, lng: -86.2, departamento: "Carazo" },
  "la paz de oriente": { lat: 11.8167, lng: -86.1833, departamento: "Carazo" },
  "san marcos": { lat: 11.9, lng: -86.1833, departamento: "Carazo" },
  "santa teresa": { lat: 11.8333, lng: -86.1833, departamento: "Carazo" },

  // CHINANDEGA
  "chinandega": { lat: 12.625, lng: -87.125, departamento: "Chinandega" },
  "chichigalpa": { lat: 12.5833, lng: -87.0333, departamento: "Chinandega" },
  "corinto": { lat: 12.4833, lng: -87.1667, departamento: "Chinandega" },
  "cinco pinos": { lat: 12.6333, lng: -87.0833, departamento: "Chinandega" },
  "el realejo": { lat: 12.55, lng: -87.0167, departamento: "Chinandega" },
  "el viejo": { lat: 12.5333, lng: -87.15, departamento: "Chinandega" },
  "posoltega": { lat: 12.5333, lng: -86.9833, departamento: "Chinandega" },
  "puerto morazan": { lat: 12.5, lng: -87.2, departamento: "Chinandega" },
  "san francisco del norte": { lat: 12.6, lng: -87.0, departamento: "Chinandega" },
  "san pedro del norte": { lat: 12.5833, lng: -86.9667, departamento: "Chinandega" },
  "santo tomas del norte": { lat: 12.6, lng: -87.0167, departamento: "Chinandega" },
  "somotillo": { lat: 12.55, lng: -86.9, departamento: "Chinandega" },
  "villanueva": { lat: 12.4833, lng: -87.1, departamento: "Chinandega" },

  // CHONTALES
  "acoyapa": { lat: 12.25, lng: -85.1, departamento: "Chontales" },
  "comalapa": { lat: 12.25, lng: -85.05, departamento: "Chontales" },
  "el ayote": { lat: 12.35, lng: -85.15, departamento: "Chontales" },
  "juigalpa": { lat: 12.3, lng: -85.2, departamento: "Chontales" },
  "la libertad": { lat: 12.35, lng: -85.25, departamento: "Chontales" },
  "san pedro de lovago": { lat: 12.3, lng: -85.15, departamento: "Chontales" },
  "santo domingo": { lat: 12.25, lng: -85.25, departamento: "Chontales" },
  "santo tomas": { lat: 12.35, lng: -85.2, departamento: "Chontales" },
  "villa sandino": { lat: 12.25, lng: -85.1, departamento: "Chontales" },
  "cuapa": { lat: 12.2, lng: -85.15, departamento: "Chontales" },

  // ESTELÍ
  "condega": { lat: 13.35, lng: -86.75, departamento: "Estelí" },
  "esteli": { lat: 13.45, lng: -86.85, departamento: "Estelí" },
  "la trinidad": { lat: 13.4, lng: -86.75, departamento: "Estelí" },
  "pueblo nuevo": { lat: 13.4, lng: -86.9, departamento: "Estelí" },
  "san juan de limay": { lat: 13.35, lng: -86.9, departamento: "Estelí" },
  "san nicolas": { lat: 13.45, lng: -86.8, departamento: "Estelí" },

  // GRANADA
  "granada": { lat: 11.9333, lng: -85.95, departamento: "Granada" },
  "diria": { lat: 11.8833, lng: -85.9167, departamento: "Granada" },
  "diriomo": { lat: 11.9, lng: -85.9333, departamento: "Granada" },
  "nandaime": { lat: 11.8833, lng: -85.9, departamento: "Granada" },

  // JINOTEGA
  "el cuá": { lat: 13.15, lng: -85.6, departamento: "Jinotega" },
  "jinotega": { lat: 13.1, lng: -85.4833, departamento: "Jinotega" },
  "la concordia": { lat: 13.15, lng: -85.4, departamento: "Jinotega" },
  "san jose de bocay": { lat: 13.4, lng: -85.7, departamento: "Jinotega" },
  "san rafael del norte": { lat: 13.45, lng: -85.65, departamento: "Jinotega" },
  "san sebastian de yali": { lat: 13.4, lng: -85.55, departamento: "Jinotega" },
  "santa maria de pantasma": { lat: 13.25, lng: -85.55, departamento: "Jinotega" },
  "wiwili": { lat: 13.35, lng: -85.8, departamento: "Jinotega" },
  "wiwili de jinotega": { lat: 13.35, lng: -85.8, departamento: "Jinotega" },

  // LEÓN
  "achuapa": { lat: 12.6, lng: -86.9, departamento: "León" },
  "el jicaral": { lat: 12.6, lng: -86.75, departamento: "León" },
  "el sauce": { lat: 12.55, lng: -86.85, departamento: "León" },
  "la paz centro": { lat: 12.3333, lng: -86.6667, departamento: "León" },
  "larreynaga": { lat: 12.5, lng: -86.85, departamento: "León" },
  "leon": { lat: 12.4333, lng: -86.875, departamento: "León" },
  "nagarote": { lat: 12.2667, lng: -86.55, departamento: "León" },
  "quezalguaque": { lat: 12.45, lng: -86.9, departamento: "León" },
  "santa rosa del peñon": { lat: 12.4, lng: -86.65, departamento: "León" },
  "telica": { lat: 12.5, lng: -86.85, departamento: "León" },

  // MADRIZ
  "las sabanas": { lat: 13.55, lng: -86.55, departamento: "Madriz" },
  "palacagüina": { lat: 13.5, lng: -86.55, departamento: "Madriz" },
  "san jose de cusmapa": { lat: 13.6, lng: -86.6, departamento: "Madriz" },
  "san juan de rio coco": { lat: 13.55, lng: -86.45, departamento: "Madriz" },
  "san lucas": { lat: 13.5, lng: -86.5, departamento: "Madriz" },
  "somoto": { lat: 13.3, lng: -86.55, departamento: "Madriz" },
  "telpaneca": { lat: 13.55, lng: -86.45, departamento: "Madriz" },
  "totogalpa": { lat: 13.5, lng: -86.5, departamento: "Madriz" },
  "yalagüina": { lat: 13.5, lng: -86.55, departamento: "Madriz" },

  // MANAGUA
  "el crucero": { lat: 12.0, lng: -86.4, departamento: "Managua" },
  "managua": { lat: 12.1364, lng: -86.2514, departamento: "Managua" },
  "mateare": { lat: 12.0, lng: -86.4, departamento: "Managua" },
  "san francisco libre": { lat: 12.0, lng: -86.35, departamento: "Managua" },
  "san rafael del sur": { lat: 11.8, lng: -86.4, departamento: "Managua" },
  "ticuantepe": { lat: 12.0, lng: -86.3, departamento: "Managua" },
  "tipitapa": { lat: 12.2, lng: -86.1, departamento: "Managua" },
  "villa el carmen": { lat: 12.0, lng: -86.4, departamento: "Managua" },
  "ciudad sandino": { lat: 12.05, lng: -86.3, departamento: "Managua" },

  // MASAYA
  "catarina": { lat: 11.85, lng: -85.95, departamento: "Masaya" },
  "la concepcion": { lat: 11.8833, lng: -85.9167, departamento: "Masaya" },
  "masatepe": { lat: 11.9, lng: -86.1, departamento: "Masaya" },
  "masaya": { lat: 11.8766, lng: -86.1956, departamento: "Masaya" },
  "nandasmo": { lat: 11.8833, lng: -85.9, departamento: "Masaya" },
  "niquinohomo": { lat: 11.8667, lng: -85.9167, departamento: "Masaya" },
  "nindiri": { lat: 11.8833, lng: -85.95, departamento: "Masaya" },
  "san juan de oriente": { lat: 11.8667, lng: -85.9, departamento: "Masaya" },
  "tisma": { lat: 11.8833, lng: -85.95, departamento: "Masaya" },

  // MATAGALPA
  "ciudad dario": { lat: 12.8, lng: -85.8, departamento: "Matagalpa" },
  "el tuma - la dalia": { lat: 12.9, lng: -85.7, departamento: "Matagalpa" },
  "esquipulas": { lat: 12.9, lng: -85.75, departamento: "Matagalpa" },
  "matagalpa": { lat: 12.9333, lng: -85.6167, departamento: "Matagalpa" },
  "matiguás": { lat: 12.9, lng: -85.7, departamento: "Matagalpa" },
  "muy muy": { lat: 12.8, lng: -85.75, departamento: "Matagalpa" },
  "rancho grande": { lat: 12.9, lng: -85.8, departamento: "Matagalpa" },
  "rio blanco": { lat: 12.9, lng: -85.7, departamento: "Matagalpa" },
  "san dionisio": { lat: 12.85, lng: -85.7, departamento: "Matagalpa" },
  "san isidro": { lat: 12.85, lng: -85.75, departamento: "Matagalpa" },
  "san ramon": { lat: 12.9, lng: -85.7, departamento: "Matagalpa" },
  "sebaco": { lat: 12.8, lng: -85.75, departamento: "Matagalpa" },
  "s sebaco": { lat: 12.8, lng: -85.75, departamento: "Matagalpa" },
  "terrabona": { lat: 12.8, lng: -85.7, departamento: "Matagalpa" },
  "waslala": { lat: 12.9, lng: -85.7, departamento: "Matagalpa" },

  // NUEVA SEGOVIA
  "ciudad antigua": { lat: 13.5, lng: -86.3, departamento: "Nueva Segovia" },
  "dipilto": { lat: 13.6, lng: -86.3, departamento: "Nueva Segovia" },
  "el jiícaro": { lat: 13.5, lng: -86.2, departamento: "Nueva Segovia" },
  "jalapa": { lat: 13.6, lng: -86.2, departamento: "Nueva Segovia" },
  "macuelizo": { lat: 13.5, lng: -86.25, departamento: "Nueva Segovia" },
  "mozonte": { lat: 13.55, lng: -86.25, departamento: "Nueva Segovia" },
  "murra": { lat: 13.6, lng: -86.15, departamento: "Nueva Segovia" },
  "ocotal": { lat: 13.6333, lng: -86.2833, departamento: "Nueva Segovia" },
  "quilali": { lat: 13.7, lng: -86.2, departamento: "Nueva Segovia" },
  "san fernando": { lat: 13.6, lng: -86.25, departamento: "Nueva Segovia" },
  "santa maria": { lat: 13.55, lng: -86.2, departamento: "Nueva Segovia" },

  // RACCN (Zelaya Norte)
  "bonanza": { lat: 14.0, lng: -85.8, departamento: "RACCN" },
  "karawala": { lat: 13.8, lng: -85.9, departamento: "RACCN" },
  "mulukuku": { lat: 13.9, lng: -85.7, departamento: "RACCN" },
  "nueva sembrada": { lat: 13.9, lng: -85.8, departamento: "RACCN" },
  "prinzapolka": { lat: 13.9, lng: -85.9, departamento: "RACCN" },
  "puerto cabezas": { lat: 14.0, lng: -85.9, departamento: "RACCN" },
  "rosita": { lat: 14.0, lng: -85.7, departamento: "RACCN" },
  "siuna": { lat: 14.0, lng: -85.7, departamento: "RACCN" },
  "waspan": { lat: 14.3, lng: -85.9, departamento: "RACCN" },

  // RACCS (Zelaya Sur)
  "bluefields": { lat: 12.0, lng: -85.9, departamento: "RACCS" },
  "corn island": { lat: 12.2, lng: -83.05, departamento: "RACCS" },
  "el coral": { lat: 12.1, lng: -85.9, departamento: "RACCS" },
  "el rama": { lat: 12.1, lng: -85.9, departamento: "RACCS" },
  "el tortuguero": { lat: 12.1, lng: -85.9, departamento: "RACCS" },
  "kukra hill": { lat: 12.1, lng: -85.9, departamento: "RACCS" },
  "la cruz de rio grande": { lat: 12.1, lng: -85.9, departamento: "RACCS" },
  "la desembocadura de rio grande": { lat: 12.1, lng: -85.9, departamento: "RACCS" },
  "desembocadura de rio grande": { lat: 12.1, lng: -85.9, departamento: "RACCS" },
  "laguna de perlas": { lat: 12.1, lng: -85.9, departamento: "RACCS" },
  "muelle de los bueyes": { lat: 12.1, lng: -85.9, departamento: "RACCS" },
  "nueva guinea": { lat: 12.1, lng: -85.9, departamento: "RACCS" },
  "paiwas": { lat: 12.1, lng: -85.9, departamento: "RACCS" },
  "wawlita": { lat: 12.1, lng: -85.9, departamento: "RACCS" },

  // RÍO SAN JUAN
  "el almendro": { lat: 11.7, lng: -85.4, departamento: "Río San Juan" },
  "el castillo": { lat: 11.7, lng: -85.4, departamento: "Río San Juan" },
  "la conquista": { lat: 11.7, lng: -85.4, departamento: "Río San Juan" },
  "morrito": { lat: 11.7, lng: -85.4, departamento: "Río San Juan" },
  "san carlos": { lat: 11.7, lng: -85.4, departamento: "Río San Juan" },
  "san juan del norte": { lat: 11.7, lng: -85.4, departamento: "Río San Juan" },
  "san miguelito": { lat: 11.7, lng: -85.4, departamento: "Río San Juan" },

  // RIVAS
  "altagracia": { lat: 11.9, lng: -85.9, departamento: "Rivas" },
  "belen": { lat: 11.9, lng: -85.9, departamento: "Rivas" },
  "buenos aires": { lat: 11.9, lng: -85.9, departamento: "Rivas" },
  "cardenas": { lat: 11.9, lng: -85.9, departamento: "Rivas" },
  "moyogalpa": { lat: 11.9, lng: -85.9, departamento: "Rivas" },
  "potosi": { lat: 11.9, lng: -85.9, departamento: "Rivas" },
  "rivas": { lat: 11.9, lng: -85.9, departamento: "Rivas" },
  "san jorge": { lat: 11.9, lng: -85.9, departamento: "Rivas" },
  "san juan del sur": { lat: 11.9, lng: -85.9, departamento: "Rivas" },
  "tola": { lat: 11.9, lng: -85.9, departamento: "Rivas" },
};

export function getMunicipioCoordenada(municipio: string | null | undefined): MunicipioCoordenada | null {
  if (!municipio) return null;
  // Normalizar: minúsculas, sin acentos, sin espacios extra
  const key = municipio
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
  if (MUNICIPIO_DB[key]) return MUNICIPIO_DB[key];
  // Fallback: intentar con la versión sin tildes pero manteniendo ü (ej. matiguás -> matiguas)
  const key2 = municipio
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ü/g, "u")
    .trim();
  if (MUNICIPIO_DB[key2]) return MUNICIPIO_DB[key2];
  return null;
}
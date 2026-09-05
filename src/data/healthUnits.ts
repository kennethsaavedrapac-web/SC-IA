import { HealthCenter } from "../types";
import boaco from "./healthUnits/Boaco.json";
import carazo from "./healthUnits/Carazo.json";
import chinandega from "./healthUnits/Chinandega.json";
import chontales from "./healthUnits/Chontales.json";
import esteli from "./healthUnits/Esteli.json";
import granada from "./healthUnits/Granada.json";
import jinotega from "./healthUnits/Jinotega.json";
import leon from "./healthUnits/Leon.json";
import madriz from "./healthUnits/Madriz.json";
import managua from "./healthUnits/Managua.json";
import masaya from "./healthUnits/Masaya.json";
import matagalpa from "./healthUnits/Matagalpa.json";
import nuevaSegovia from "./healthUnits/Nueva Segovia.json";
import raccn from "./healthUnits/RACCN.json";
import raccs from "./healthUnits/RACCS.json";
import rioSanJuan from "./healthUnits/Rio San Juan.json";
import rivas from "./healthUnits/Rivas.json";
import zelaya from "./healthUnits/zelaya.json";

interface HealthUnitSource {
  numero: number;
  silais: string | null;
  nombre: string;
  tipo_unidad_salud: string;
  departamento_region: string | null;
  municipio: string | null;
  localidad: string | null;
  zona: string | null;
  telefono: string | null;
  latitud: number | null;
  longitud: number | null;
}

interface DepartmentSource {
  departamento: string;
  total_registros: number;
  unidades_salud: HealthUnitSource[];
}

const HEALTH_UNIT_DATABASE = [
  boaco,
  carazo,
  chinandega,
  chontales,
  esteli,
  granada,
  jinotega,
  leon,
  madriz,
  managua,
  masaya,
  matagalpa,
  nuevaSegovia,
  raccn,
  raccs,
  rioSanJuan,
  rivas,
  zelaya,
] as DepartmentSource[];

const NICARAGUA_BOUNDS = {
  north: 15.2,
  south: 10.6,
  west: -87.8,
  east: -82.5,
};

function normalizeText(value: string | null | undefined, fallback = "Sin dato"): string {
  const cleanValue = value?.toString().trim();
  return cleanValue || fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function coordinateToMapPosition(unit: HealthUnitSource, index: number): { lat: number; lng: number; hasCoordinates: boolean } {
  if (typeof unit.latitud === "number" && typeof unit.longitud === "number") {
    const top = ((NICARAGUA_BOUNDS.north - unit.latitud) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100;
    const left = ((unit.longitud - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100;

    return {
      lat: clamp(top, 6, 94),
      lng: clamp(left, 6, 94),
      hasCoordinates: true,
    };
  }

  const row = Math.floor(index / 18);
  const col = index % 18;

  return {
    lat: 12 + ((row * 11) % 76),
    lng: 8 + ((col * 5) % 84),
    hasCoordinates: false,
  };
}

function estimateDuration(index: number): number {
  return 5 + (index % 16);
}

export const DOCTORS_HEALTH_CENTERS: HealthCenter[] = [
  {
    id: "doctor-blandino-granada",
    name: "Dr Blandino",
    type: "Clínica ambulatoria",
    schedule: "Abierto las 24 horas",
    distance: "Granada · Granada",
    durationMin: 5,
    lat: clamp(((NICARAGUA_BOUNDS.north - 11.945867797136797) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100, 6, 94),
    lng: clamp(((-85.95375189209479 - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100, 6, 94),
    latitude: 11.945867797136797,
    longitude: -85.95375189209479,
    department: "Granada",
    municipality: "Granada",
    locality: "W2WW+8FQ, Granada",
    zone: "Urbana",
    phone: "8978 1214",
    silais: "Granada",
    sourceNumber: 1,
    hasCoordinates: true,
  },
  {
    id: "doctor-ramirez-delagneau-granada",
    name: "Consultorio Médico, Dr. Ramírez Delagneau",
    type: "Médico de familia",
    schedule: "Cerrado · Abre a las 8 a.m. del lunes",
    distance: "Granada · Granada",
    durationMin: 7,
    lat: clamp(((NICARAGUA_BOUNDS.north - 11.935758506467625) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100, 6, 94),
    lng: clamp(((-85.9623402489296 - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100, 6, 94),
    latitude: 11.935758506467625,
    longitude: -85.9623402489296,
    department: "Granada",
    municipality: "Granada",
    locality: "Frente colegio María auxiliadora primaria, Granada 43000",
    zone: "Urbana",
    phone: "7546 4691",
    silais: "Granada",
    sourceNumber: 2,
    hasCoordinates: true,
  },
  {
    id: "doctor-ericka-ortega-granada",
    name: "Consultorio Médico Dra. Ericka Ortega",
    type: "Nefrólogo",
    schedule: "No especificado",
    distance: "Granada · Granada",
    durationMin: 8,
    lat: clamp(((NICARAGUA_BOUNDS.north - 11.928272815776879) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100, 6, 94),
    lng: clamp(((-85.94715401535156 - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100, 6, 94),
    latitude: 11.928272815776879,
    longitude: -85.94715401535156,
    department: "Granada",
    municipality: "Granada",
    locality: "Alcaldía 4 cuadras al Este, Granada",
    zone: "Urbana",
    phone: "8799 9026",
    silais: "Granada",
    sourceNumber: 3,
    hasCoordinates: true,
  },
  {
    id: "doctor-laura-martinez",
    name: "Dra. Laura Martínez",
    type: "Cardiología",
    schedule: "Lun - Vie: 8:00 AM - 4:00 PM",
    distance: "Granada · Granada",
    durationMin: 6,
    lat: clamp(((NICARAGUA_BOUNDS.north - 11.9390) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100, 6, 94),
    lng: clamp(((-85.9580 - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100, 6, 94),
    latitude: 11.9390,
    longitude: -85.9580,
    department: "Granada",
    municipality: "Granada",
    locality: "Calle Real Xalteva, Granada",
    zone: "Urbana",
    phone: "8888 1122",
    silais: "Granada",
    sourceNumber: 4,
    hasCoordinates: true,
  },
  {
    id: "doctor-carlos-gomez",
    name: "Dr. Carlos Gómez",
    type: "Dermatología",
    schedule: "Lun - Sáb: 9:00 AM - 5:00 PM",
    distance: "Granada · Granada",
    durationMin: 7,
    lat: clamp(((NICARAGUA_BOUNDS.north - 11.9320) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100, 6, 94),
    lng: clamp(((-85.9610 - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100, 6, 94),
    latitude: 11.9320,
    longitude: -85.9610,
    department: "Granada",
    municipality: "Granada",
    locality: "Bo. Xalteva, Granada",
    zone: "Urbana",
    phone: "8888 3344",
    silais: "Granada",
    sourceNumber: 5,
    hasCoordinates: true,
  },
  {
    id: "doctor-ana-ruiz",
    name: "Dra. Ana Ruiz",
    type: "Pediatría",
    schedule: "Lun - Vie: 8:00 AM - 3:00 PM",
    distance: "Granada · Granada",
    durationMin: 5,
    lat: clamp(((NICARAGUA_BOUNDS.north - 11.9375) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100, 6, 94),
    lng: clamp(((-85.9510 - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100, 6, 94),
    latitude: 11.9375,
    longitude: -85.9510,
    department: "Granada",
    municipality: "Granada",
    locality: "Calle La Libertad, Granada",
    zone: "Urbana",
    phone: "8888 5566",
    silais: "Granada",
    sourceNumber: 6,
    hasCoordinates: true,
  },
  {
    id: "doctor-sofia-navarro",
    name: "Dra. Sofia Navarro",
    type: "Ginecología",
    schedule: "Lun - Vie: 9:00 AM - 4:00 PM",
    distance: "Granada · Granada",
    durationMin: 8,
    lat: clamp(((NICARAGUA_BOUNDS.north - 11.9310) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100, 6, 94),
    lng: clamp(((-85.9540 - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100, 6, 94),
    latitude: 11.9310,
    longitude: -85.9540,
    department: "Granada",
    municipality: "Granada",
    locality: "Calle El Comercio, Granada",
    zone: "Urbana",
    phone: "8888 7788",
    silais: "Granada",
    sourceNumber: 7,
    hasCoordinates: true,
  },
  {
    id: "doctor-mateo-torres",
    name: "Dr. Mateo Torres",
    type: "Traumatología",
    schedule: "Lun - Sáb: 8:00 AM - 2:00 PM",
    distance: "Granada · Granada",
    durationMin: 9,
    lat: clamp(((NICARAGUA_BOUNDS.north - 11.9420) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100, 6, 94),
    lng: clamp(((-85.9570 - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100, 6, 94),
    latitude: 11.9420,
    longitude: -85.9570,
    department: "Granada",
    municipality: "Granada",
    locality: "Bo. Palmira, Granada",
    zone: "Urbana",
    phone: "8888 9900",
    silais: "Granada",
    sourceNumber: 8,
    hasCoordinates: true,
  },
  {
    id: "doctor-valeria-castro",
    name: "Dra. Valeria Castro",
    type: "Medicina General",
    schedule: "Abierto hoy hasta 5:00 PM",
    distance: "Granada · Granada",
    durationMin: 4,
    lat: clamp(((NICARAGUA_BOUNDS.north - 11.9340) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100, 6, 94),
    lng: clamp(((-85.9530 - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100, 6, 94),
    latitude: 11.9340,
    longitude: -85.9530,
    department: "Granada",
    municipality: "Granada",
    locality: "Parque Central 1 c. al Sur, Granada",
    zone: "Urbana",
    phone: "8888 0011",
    silais: "Granada",
    sourceNumber: 9,
    hasCoordinates: true,
  },
];

export const PHARMACIES_HEALTH_CENTERS: HealthCenter[] = [
  {
    id: "pharmacy-ramirez-granada",
    name: "Farmacia Ramírez",
    type: "Farmacia",
    schedule: "Abierto hoy hasta 8:00 PM",
    distance: "Granada · Granada",
    durationMin: 5,
    lat: clamp(((NICARAGUA_BOUNDS.north - 11.940831887184457) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100, 6, 94),
    lng: clamp(((-85.95255430178374 - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100, 6, 94),
    latitude: 11.940831887184457,
    longitude: -85.95255430178374,
    department: "Granada",
    municipality: "Granada",
    locality: "Granada, Nicaragua",
    zone: "Urbana",
    phone: "50588888908",
    silais: "Granada",
    sourceNumber: 101,
    hasCoordinates: true,
  },
  {
    id: "pharmacy-guapinol-granada",
    name: "Farmacia Guapinol",
    type: "Farmacia",
    schedule: "Abierto hoy hasta 7:00 PM",
    distance: "Granada · Granada",
    durationMin: 7,
    lat: clamp(((NICARAGUA_BOUNDS.north - 11.9365) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100, 6, 94),
    lng: clamp(((-85.9515 - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100, 6, 94),
    latitude: 11.9365,
    longitude: -85.9515,
    department: "Granada",
    municipality: "Granada",
    locality: "Granada, Nicaragua",
    zone: "Urbana",
    phone: "50588888917",
    silais: "Granada",
    sourceNumber: 102,
    hasCoordinates: true,
  },
  {
    id: "pharmacy-mas-salud-granada",
    name: "Farmacia Más Salud",
    type: "Farmacia",
    schedule: "Abierto hoy hasta 9:00 PM",
    distance: "Granada · Granada",
    durationMin: 6,
    lat: clamp(((NICARAGUA_BOUNDS.north - 11.9325) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100, 6, 94),
    lng: clamp(((-85.9560 - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100, 6, 94),
    latitude: 11.9325,
    longitude: -85.9560,
    department: "Granada",
    municipality: "Granada",
    locality: "Granada, Nicaragua",
    zone: "Urbana",
    phone: "50588888914",
    silais: "Granada",
    sourceNumber: 103,
    hasCoordinates: true,
  },
  {
    id: "pharmacy-praga-inmaculada-granada",
    name: "Farmacia Praga - Inmaculada",
    type: "Farmacia",
    schedule: "Abierto 24 horas",
    distance: "Granada · Granada",
    durationMin: 6,
    lat: clamp(((NICARAGUA_BOUNDS.north - 11.9360) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100, 6, 94),
    lng: clamp(((-85.9530 - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100, 6, 94),
    latitude: 11.9360,
    longitude: -85.9530,
    department: "Granada",
    municipality: "Granada",
    locality: "Calle La Inmaculada, Granada",
    zone: "Urbana",
    phone: "50588888884",
    silais: "Granada",
    sourceNumber: 104,
    hasCoordinates: true,
  },
  {
    id: "pharmacy-la-conchita-granada",
    name: "Farmacia La Conchita",
    type: "Farmacia",
    schedule: "Abierto hoy hasta 8:00 PM",
    distance: "Granada · Granada",
    durationMin: 5,
    lat: clamp(((NICARAGUA_BOUNDS.north - 11.9345) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100, 6, 94),
    lng: clamp(((-85.9545 - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100, 6, 94),
    latitude: 11.9345,
    longitude: -85.9545,
    department: "Granada",
    municipality: "Granada",
    locality: "Granada, Nicaragua",
    zone: "Urbana",
    phone: "50588888910",
    silais: "Granada",
    sourceNumber: 105,
    hasCoordinates: true,
  },
  {
    id: "pharmacy-divino-nino-granada",
    name: "Farmacia Divino Niño",
    type: "Farmacia",
    schedule: "Abierto hoy hasta 9:00 PM",
    distance: "Granada · Granada",
    durationMin: 4,
    lat: clamp(((NICARAGUA_BOUNDS.north - 11.9380) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100, 6, 94),
    lng: clamp(((-85.9540 - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100, 6, 94),
    latitude: 11.9380,
    longitude: -85.9540,
    department: "Granada",
    municipality: "Granada",
    locality: "Granada, Nicaragua",
    zone: "Urbana",
    phone: "50588888909",
    silais: "Granada",
    sourceNumber: 106,
    hasCoordinates: true,
  },
  {
    id: "pharmacy-la-fe-granada",
    name: "Farmacia La Fe",
    type: "Farmacia",
    schedule: "Abierto hoy hasta 7:00 PM",
    distance: "Granada · Granada",
    durationMin: 8,
    lat: clamp(((NICARAGUA_BOUNDS.north - 11.9315) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100, 6, 94),
    lng: clamp(((-85.9490 - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100, 6, 94),
    latitude: 11.9315,
    longitude: -85.9490,
    department: "Granada",
    municipality: "Granada",
    locality: "Granada, Nicaragua",
    zone: "Urbana",
    phone: "50588888916",
    silais: "Granada",
    sourceNumber: 107,
    hasCoordinates: true,
  },
  {
    id: "pharmacy-espiritu-santo-granada",
    name: "Farmacia Espíritu Santo",
    type: "Farmacia",
    schedule: "Abierto hoy hasta 8:00 PM",
    distance: "Granada · Granada",
    durationMin: 9,
    lat: clamp(((NICARAGUA_BOUNDS.north - 11.9280) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100, 6, 94),
    lng: clamp(((-85.9460 - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100, 6, 94),
    latitude: 11.9280,
    longitude: -85.9460,
    department: "Granada",
    municipality: "Granada",
    locality: "Carretera NIC-39, Granada",
    zone: "Urbana",
    phone: "50588888906",
    silais: "Granada",
    sourceNumber: 108,
    hasCoordinates: true,
  },
  {
    id: "pharmacy-praga-central-granada",
    name: "Farmacia Praga - Central",
    type: "Farmacia",
    schedule: "Abierto hoy hasta 10:00 PM",
    distance: "Granada · Granada",
    durationMin: 5,
    lat: clamp(((NICARAGUA_BOUNDS.north - 11.9330) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100, 6, 94),
    lng: clamp(((-85.9575 - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100, 6, 94),
    latitude: 11.9330,
    longitude: -85.9575,
    department: "Granada",
    municipality: "Granada",
    locality: "C. Real Xalteva, Granada",
    zone: "Urbana",
    phone: "50588888885",
    silais: "Granada",
    sourceNumber: 109,
    hasCoordinates: true,
  },
  {
    id: "pharmacy-cocibolca-granada",
    name: "Farmacia Cocibolca",
    type: "Farmacia",
    schedule: "Abierto hoy hasta 9:00 PM",
    distance: "Granada · Granada",
    durationMin: 4,
    lat: clamp(((NICARAGUA_BOUNDS.north - 11.9342) / (NICARAGUA_BOUNDS.north - NICARAGUA_BOUNDS.south)) * 100, 6, 94),
    lng: clamp(((-85.9550 - NICARAGUA_BOUNDS.west) / (NICARAGUA_BOUNDS.east - NICARAGUA_BOUNDS.west)) * 100, 6, 94),
    latitude: 11.9342,
    longitude: -85.9550,
    department: "Granada",
    municipality: "Granada",
    locality: "Granada, Nicaragua",
    zone: "Urbana",
    phone: "50588888907",
    silais: "Granada",
    sourceNumber: 110,
    hasCoordinates: true,
  },
];

const BASE_HEALTH_CENTERS: HealthCenter[] = HEALTH_UNIT_DATABASE.flatMap((department) =>
  department.unidades_salud.map((unit, unitIndex) => {
    const globalIndex = HEALTH_UNIT_DATABASE
      .slice(0, HEALTH_UNIT_DATABASE.indexOf(department))
      .reduce((total, current) => total + current.unidades_salud.length, 0) + unitIndex;
    const position = coordinateToMapPosition(unit, globalIndex);
    const rawDept = department.departamento || "Nicaragua";
    const departmentName = rawDept === "RACCN" || rawDept === "RACCS"
      ? rawDept
      : rawDept.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    const municipality = normalizeText(unit.municipio);
    const zone = normalizeText(unit.zona);

    return {
      id: `${department.departamento.toLowerCase().replace(/\s+/g, "-")}-${unit.numero}-${unitIndex}`,
      name: normalizeText(unit.nombre),
      type: normalizeText(unit.tipo_unidad_salud),
      schedule: "Registro oficial MINSA",
      distance: `${municipality} · ${departmentName}`,
      durationMin: estimateDuration(globalIndex),
      lat: position.lat,
      lng: position.lng,
      latitude: unit.latitud ?? undefined,
      longitude: unit.longitud ?? undefined,
      department: departmentName,
      municipality,
      locality: normalizeText(unit.localidad),
      zone,
      phone: unit.telefono ?? undefined,
      silais: normalizeText(unit.silais, department.departamento),
      sourceNumber: unit.numero,
      hasCoordinates: position.hasCoordinates,
    };
  }),
);

export const HEALTH_CENTERS: HealthCenter[] = [...DOCTORS_HEALTH_CENTERS, ...PHARMACIES_HEALTH_CENTERS, ...BASE_HEALTH_CENTERS];

export const HEALTH_CENTER_DEPARTMENTS = Array.from(
  new Set(HEALTH_CENTERS.map((center) => center.department)),
).sort((a, b) => (a || "").localeCompare(b || "", "es"));

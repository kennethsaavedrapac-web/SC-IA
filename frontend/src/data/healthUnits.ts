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

export const HEALTH_CENTER_TOTAL = HEALTH_UNIT_DATABASE.reduce(
  (total, department) => total + department.unidades_salud.length,
  0,
);

export const HEALTH_CENTERS: HealthCenter[] = HEALTH_UNIT_DATABASE.flatMap((department) =>
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

export const HEALTH_CENTER_DEPARTMENTS = Array.from(
  new Set(HEALTH_CENTERS.map((center) => center.department)),
).sort((a, b) => (a || "").localeCompare(b || "", "es"));

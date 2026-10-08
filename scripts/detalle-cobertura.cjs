// Verificar cuántos centros tienen coincidencias exactas por municipio
const fs = require('fs');
const path = require('path');

const MUNICIPIOS = {
  "boaco": { lat: 12.4667, lng: -85.6833, departamento: "Boaco" },
  "managua": { lat: 12.1364, lng: -86.2514, departamento: "Managua" },
  "granada": { lat: 11.9333, lng: -85.95, departamento: "Granada" },
  "leon": { lat: 12.4333, lng: -86.875, departamento: "León" },
  "masaya": { lat: 11.8766, lng: -86.1956, departamento: "Masaya" },
  "chinandega": { lat: 12.625, lng: -87.125, departamento: "Chinandega" },
  "esteli": { lat: 13.45, lng: -86.85, departamento: "Estelí" },
  "jinotega": { lat: 13.1, lng: -85.4833, departamento: "Jinotega" },
  "matagalpa": { lat: 12.9333, lng: -85.6167, departamento: "Matagalpa" },
  "rivas": { lat: 11.9, lng: -85.9, departamento: "Rivas" },
  "carazo": { lat: 11.85, lng: -86.2, departamento: "Carazo" },
  "chontales": { lat: 12.3, lng: -85.2, departamento: "Chontales" },
  "madriz": { lat: 13.3, lng: -86.55, departamento: "Madriz" },
  "nueva segovia": { lat: 13.6333, lng: -86.2833, departamento: "Nueva Segovia" },
  "rio san juan": { lat: 11.7, lng: -85.4, departamento: "Río San Juan" },
  "raccn": { lat: 14.0, lng: -85.9, departamento: "RACCN" },
  "raccs": { lat: 12.0, lng: -85.9, departamento: "RACCS" },
  "zelaya": { lat: 12.0, lng: -85.9, departamento: "Zelaya" }
};

function norm(s) {
  if (!s) return '';
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function getMunicipioCoordenada(municipio) {
  const key = norm(municipio);
  if (MUNICIPIOS[key]) return MUNICIPIOS[key];
  return null;
}

const dir = path.join(__dirname, '..', 'src', 'data', 'healthUnits');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

let total = 0, conMunicipio = 0, sinMunicipio = 0, sinCoordsJSON = 0;

for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  for (const u of data.unidades_salud) {
    total++;
    const tieneCoordsJSON = typeof u.latitud === "number" && typeof u.longitud === "number";
    tieneCoordsJSON ? sinCoordsJSON++ : null;
    
    if (u.municipio) {
      const coord = getMunicipioCoordenada(u.municipio);
      if (coord) {
        conMunicipio++;
      } else {
        sinMunicipio++;
      }
    } else {
      sinMunicipio++; // No tiene municipio definido
    }
  }
}

console.log('=== DETALLE DE COBERTURA POR MUNICIPIO ===');
console.log('Total centros:', total);
console.log('Con coordenadas JSON:', sinCoordsJSON, '(' + (sinCoordsJSON/total*100).toFixed(1) + '%)');
console.log('Con coordenadas por municipio:', conMunicipio, '(' + (conMunicipio/total*100).toFixed(1) + '%)');
console.log('Sin coordenadas (ni JSON ni municipio):', sinMunicipio, '(' + (sinMunicipio/total*100).toFixed(1) + '%)');
console.log('');
console.log('Mejora: ahora', conMunicipio + sinCoordsJSON, 'centros tienen ubicación (' + ((conMunicipio + sinCoordsJSON)/total*100).toFixed(1) + '%)');
// Verificar cobertura usando la tabla REAL de 158 municipios
const fs = require('fs');
const path = require('path');

// Extraer las claves del archivo municipioCoordenadas.ts
const municipioFile = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'municipioCoordenadas.ts'), 'utf8');
const keyMatches = [...municipioFile.matchAll(/"([^"]+)":\s*\{\s*lat:/g)];
const MUNICIPIOS = new Set(keyMatches.map(m => m[1]));

console.log('Municipios en tabla:', MUNICIPIOS.size);

function norm(s) {
  if (!s) return '';
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

const dir = path.join(__dirname, '..', 'src', 'data', 'healthUnits');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

let total = 0, conCoordsJSON = 0, conMunicipio = 0, sinNada = 0;
const municipiosSinCoords = new Map();

for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  for (const u of data.unidades_salud) {
    total++;
    const tieneCoordsJSON = typeof u.latitud === "number" && typeof u.longitud === "number";

    if (tieneCoordsJSON) {
      conCoordsJSON++;
    } else if (u.municipio && MUNICIPIOS.has(norm(u.municipio))) {
      conMunicipio++;
    } else {
      sinNada++;
      const m = u.municipio || '(sin municipio)';
      const key = m.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
      if (!MUNICIPIOS.has(key)) {
        municipiosSinCoords.set(m, (municipiosSinCoords.get(m) || 0) + 1);
      }
    }
  }
}

console.log('');
console.log('=== COBERTURA REAL CON TABLA DE 158 MUNICIPIOS ===');
console.log('Total centros:', total);
console.log('Con coordenadas JSON reales:', conCoordsJSON, '(' + (conCoordsJSON / total * 100).toFixed(1) + '%)');
console.log('Con coordenadas por municipio:', conMunicipio, '(' + (conMunicipio / total * 100).toFixed(1) + '%)');
console.log('Sin coordenadas (fallback grilla):', sinNada, '(' + (sinNada / total * 100).toFixed(1) + '%)');
console.log('');
console.log('TOTAL CON UBICACIÓN REAL:', conCoordsJSON + conMunicipio, '(' + ((conCoordsJSON + conMunicipio) / total * 100).toFixed(1) + '%)');
console.log('');

if (municipiosSinCoords.size > 0) {
  console.log('=== MUNICIPIOS NO ENCONTRADOS EN TABLA ===');
  const sorted = [...municipiosSinCoords.entries()].sort((a, b) => b[1] - a[1]);
  for (const [m, count] of sorted) {
    console.log('  -', m, '(' + count + ' centros)');
  }
}
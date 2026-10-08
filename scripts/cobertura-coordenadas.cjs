const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'src', 'data', 'healthUnits');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
let total = 0, withCoords = 0, withoutCoords = 0;
for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  for (const u of data.unidades_salud) {
    total++;
    if (u.latitud != null && u.longitud != null) withCoords++; else withoutCoords++;
  }
}
console.log('TOTAL centros:', total);
console.log('Con coordenadas reales:', withCoords);
console.log('Sin coordenadas:', withoutCoords);
console.log('Cobertura: ' + (withCoords / total * 100).toFixed(1) + '%');
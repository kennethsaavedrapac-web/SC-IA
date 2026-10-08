const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'src', 'data', 'healthUnits');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

function norm(s) {
  if (!s) return '';
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

// Verificar Matiguás en Matagalpa.json
const matFile = 'Matagalpa.json';
const data = JSON.parse(fs.readFileSync(path.join(dir, matFile), 'utf8'));

for (const u of data.unidades_salud) {
  if (u.municipio && /matigu|ji|cu|enon|agui/gi.test(u.municipio)) {
    console.log('JSON municipio:', JSON.stringify(u.municipio));
    console.log('  norm:', JSON.stringify(norm(u.municipio)));
    console.log('  chars:', [...u.municipio].map(c => c.charCodeAt(0).toString(16)));
  }
}
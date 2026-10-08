const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'src', 'data', 'healthUnits');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
const municipios = new Map();
for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const dept = data.departamento;
  for (const u of data.unidades_salud) {
    const m = (u.municipio || '').trim();
    if (m) {
      const key = m.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      if (!municipios.has(key)) {
        municipios.set(key, { original: m, departamento: dept, count: 0 });
      }
      municipios.get(key).count++;
    }
  }
}
const sorted = [...municipios.values()].sort((a, b) => a.departamento.localeCompare(b.departamento));
for (const m of sorted) {
  console.log(m.departamento + ' | ' + m.original + ' (' + m.count + ')');
}
console.log('TOTAL MUNICIPIOS UNICOS: ' + municipios.size);
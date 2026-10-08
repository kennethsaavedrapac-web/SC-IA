const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'src', 'data', 'healthUnits');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

// Simular la tabla de municipios
const MUNICIPIOS = new Set([
  "boaco","camoapa","san lorenzo","san jose de los remates","santa lucia","teustepe",
  "diriamba","dolores","el rosario","jinotepe","la paz de oriente","san marcos","santa teresa",
  "chinandega","chichigalpa","corinto","cinco pinos","el realejo","el viejo","posoltega","puerto morazan","san francisco del norte","san pedro del norte","santo tomas del norte","somotillo","villanueva",
  "acoyapa","comalapa","el ayote","juigalpa","la libertad","san pedro de lovago","santo domingo","santo tomas","villa sandino","cuapa",
  "condega","esteli","la trinidad","pueblo nuevo","san juan de limay","san nicolas",
  "granada","diria","diriomo","nandaime",
  "el cuá","jinotega","la concordia","san jose de bocay","san rafael del norte","san sebastian de yali","santa maria de pantasma","wiwili","wiwili de jinotega",
  "achuapa","el jicaral","el sauce","la paz centro","larreynaga","leon","nagarote","quezalguaque","santa rosa del peñon","telica",
  "las sabanas","palacagüina","san jose de cusmapa","san juan de rio coco","san lucas","somoto","telpaneca","totogalpa","yalagüina",
  "el crucero","managua","mateare","san francisco libre","san rafael del sur","ticuantepe","tipitapa","villa el carmen","ciudad sandino",
  "catarina","la concepcion","masatepe","masaya","nandasmo","niquinohomo","nindiri","san juan de oriente","tisma",
  "ciudad dario","el tuma - la dalia","esquipulas","matagalpa","matiguás","muy muy","rancho grande","rio blanco","san dionisio","san isidro","san ramon","sebaco","s sebaco","terrabona","waslala",
  "ciudad antigua","dipilto","el jiícaro","jalapa","macuelizo","mozonte","murra","ocotal","quilali","san fernando","santa maria",
  "bonanza","karawala","mulukuku","nueva sembrada","prinzapolka","puerto cabezas","rosita","siuna","waspan",
  "bluefields","corn island","el coral","el rama","el tortuguero","kukra hill","la cruz de rio grande","la desembocadura de rio grande","desembocadura de rio grande","laguna de perlas","muelle de los bueyes","nueva guinea","paiwas","wawlita",
  "el almendro","el castillo","la conquista","morrito","san carlos","san juan del norte","san miguelito",
  "altagracia","belen","buenos aires","cardenas","moyogalpa","potosi","rivas","san jorge","san juan del sur","tola"
]);

function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

let total = 0, conCoordenadasReales = 0, conCoordenadasMunicipio = 0, sinCoordenadas = 0;
for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  for (const u of data.unidades_salud) {
    total++;
    if (u.latitud != null && u.longitud != null) {
      conCoordenadasReales++;
    } else if (u.municipio && MUNICIPIOS.has(norm(u.municipio))) {
      conCoordenadasMunicipio++;
    } else {
      sinCoordenadas++;
    }
  }
}

console.log('=== ANÁLISIS DE COBERTURA DEL MAPA ===');
console.log('Total centros:', total);
console.log('Con coordenadas reales (JSON):', conCoordenadasReales);
console.log('Con coordenadas por municipio (NUEVO):', conCoordenadasMunicipio);
console.log('Sin coordenadas (fallback grilla):', sinCoordenadas);
console.log('');
console.log('Total que aparecen en el mapa con ubicación real:', conCoordenadasReales + conCoordenadasMunicipio, '(' + ((conCoordenadasReales + conCoordenadasMunicipio) / total * 100).toFixed(1) + '%)');
console.log('Antes de la mejora:', conCoordenadasReales, '(' + (conCoordenadasReales / total * 100).toFixed(1) + '%)');
// fix.js
const fs = require('fs');
const path = require('path');

const frontendPackagePath = path.join(__dirname, 'frontend', 'package.json');
const backendServerPath = path.join(__dirname, 'backend', 'server.ts');

console.log('Iniciando correcciones...');

// 1. Frontend: Actualizar package.json
try {
  if (fs.existsSync(frontendPackagePath)) {
    const pkg = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
    pkg.dependencies = pkg.dependencies || {};
    
    const depsToAdd = {
      "@supabase/supabase-js": "^2.39.2",
      "lucide-react": "^0.303.0",
      "motion": "^11.0.0",
      "qrcode.react": "^3.1.0",
      "jspdf": "^2.5.1"
    };

    let updated = false;
    for (const [dep, version] of Object.entries(depsToAdd)) {
      if (!pkg.dependencies[dep]) {
        pkg.dependencies[dep] = version;
        updated = true;
      }
    }

    if (updated) {
      fs.writeFileSync(frontendPackagePath, JSON.stringify(pkg, null, 2) + '\n');
      console.log('✅ frontend/package.json: Dependencias agregadas exitosamente.');
    } else {
      console.log('✅ frontend/package.json: Las dependencias ya estaban instaladas.');
    }
  } else {
    console.log('❌ Error: No se encontró frontend/package.json');
  }
} catch (error) {
  console.error('❌ Error procesando frontend/package.json:', error.message);
}

// 2. Backend: Limpiar server.ts
try {
  if (fs.existsSync(backendServerPath)) {
    const originalContent = fs.readFileSync(backendServerPath, 'utf8');
    const lines = originalContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Comentar imports de vite o referencias a createServer de vite
      if (
        (line.includes('import') && line.includes('vite')) ||
        line.includes('vite.middlewares') ||
        line.includes('createViteServer') ||
        (line.includes('createServer') && line.includes('vite'))
      ) {
        if (!line.trim().startsWith('//')) {
          lines[i] = '// ' + line;
        }
      }
    }
    
    const content = lines.join('\n');

    if (content !== originalContent) {
      fs.writeFileSync(backendServerPath, content);
      console.log('✅ backend/server.ts: Referencias a Vite comentadas exitosamente.');
    } else {
      console.log('✅ backend/server.ts: No se encontraron referencias activas a Vite.');
    }
  } else {
    console.log('❌ Error: No se encontró backend/server.ts');
  }
} catch (error) {
  console.error('❌ Error procesando backend/server.ts:', error.message);
}

console.log('Proceso completado.');

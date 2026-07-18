// clean-server.js
const fs = require('fs');
const path = require('path');

const backendServerPath = path.join(__dirname, 'backend', 'server.ts');

console.log('Limpiando sintaxis rota de Vite en backend/server.ts...');

try {
  if (fs.existsSync(backendServerPath)) {
    let content = fs.readFileSync(backendServerPath, 'utf8');
    const originalContent = content;

    // 1. Limpiar cualquier import o declaración de Vite que haya quedado (comentado o no)
    content = content.split('\n')
      .filter(line => 
        !line.includes('from "vite"') && 
        !line.includes("from 'vite'") && 
        !line.includes("createViteServer")
      )
      .join('\n');

    // 2. Localizar el bloque if (process.env.NODE_ENV !== "production") { ... }
    const startMarker = 'if (process.env.NODE_ENV !== "production") {';
    const endMarker = '} else {';
    
    if (content.includes(startMarker) && content.includes(endMarker)) {
        const startIndex = content.indexOf(startMarker) + startMarker.length;
        const endIndex = content.indexOf(endMarker);
        const blockContent = content.substring(startIndex, endIndex);
        
        // Si el bloque contiene la configuración rota (middlewareMode, appType, server:), lo vaciamos
        if (blockContent.includes('middlewareMode') || blockContent.includes('appType') || blockContent.includes('server:')) {
            content = content.substring(0, startIndex) + 
                      '\n    console.log("Development mode: API Server running. (Frontend Vite is handled separately)");\n  ' + 
                      content.substring(endIndex);
        }
    }

    if (content !== originalContent) {
      fs.writeFileSync(backendServerPath, content, 'utf8');
      console.log('✅ backend/server.ts: Limpieza exitosa. Código roto de Vite removido de raíz.');
    } else {
      console.log('ℹ️ No se detectó el bloque problemático. El archivo podría ya estar limpio.');
    }

  } else {
    console.error('❌ Error: No se encontró el archivo backend/server.ts.');
  }
} catch (error) {
  console.error('❌ Error inesperado limpiando backend/server.ts:', error);
}

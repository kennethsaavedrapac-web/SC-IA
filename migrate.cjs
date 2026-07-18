/**
 * migrate.js
 * Script de Automatización Quirúrgica - Arquitectura Monorepo
 * -----------------------------------------------------------
 * Este script reestructura el proyecto separando el código en 
 * los workspaces 'frontend' y 'backend', inyecta configuraciones
 * y repara automáticamente las rutas de importación.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');

function move(src, dest) {
  const srcPath = path.join(ROOT_DIR, src);
  const destPath = path.join(ROOT_DIR, dest);
  if (fs.existsSync(srcPath)) {
    // Asegurar que el directorio padre del destino existe
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.renameSync(srcPath, destPath);
    console.log(`✅ Movido: ${src} -> ${dest}`);
  } else {
    console.warn(`⚠️ Omitido (no encontrado): ${src}`);
  }
}

function remove(target) {
  const targetPath = path.join(ROOT_DIR, target);
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
    console.log(`🗑️ Eliminado: ${target}`);
  }
}

function write(target, content) {
  const targetPath = path.join(ROOT_DIR, target);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content.trim() + '\n', 'utf8');
  console.log(`📝 Escrito: ${target}`);
}

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      walk(filePath, callback);
    } else {
      callback(filePath);
    }
  });
}

console.log('🚀 INICIANDO MIGRACIÓN ARQUITECTÓNICA AUTÓNOMA...\n');

// -------------------------------------------------------------
// 1. OPERACIÓN DE ARCHIVOS
// -------------------------------------------------------------
console.log('📁 Creando Workspaces...');
fs.mkdirSync(FRONTEND_DIR, { recursive: true });
fs.mkdirSync(BACKEND_DIR, { recursive: true });

console.log('\n📦 Distribuyendo dominios...');
move('api', 'backend/api');
move('server.ts', 'backend/server.ts');
move('public', 'frontend/public');
move('src', 'frontend/src');
move('index.html', 'frontend/index.html');
move('vite.config.ts', 'frontend/vite.config.ts');

// Reubicar componente huérfano (después de mover src)
move('MedicalCentersMap.tsx', 'frontend/src/components/MedicalCentersMap.tsx');

console.log('\n🧹 Purgando archivos redundantes...');
remove('useGeolocation.ts');
remove('dist');


// -------------------------------------------------------------
// 2. ESCRITURA DE CONFIGURACIONES
// -------------------------------------------------------------
console.log('\n⚙️ Inyectando Archivos de Configuración...');

write('package.json', `
{
  "name": "sc-ia-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend"
  ],
  "scripts": {
    "dev": "concurrently \\"npm run dev -w frontend\\" \\"npm run dev -w backend\\"",
    "build": "npm run build -w frontend",
    "install:all": "npm install"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
`);

write('frontend/package.json', `
{
  "name": "frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "svelte": "^4.2.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
`);

write('backend/package.json', `
{
  "name": "backend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "npx tsx server.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "firebase-admin": "^12.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.6",
    "tsx": "^4.7.0",
    "typescript": "^5.2.2"
  }
}
`);

write('frontend/vite.config.ts', `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
`);

write('vercel.json', `
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/backend/api/$1" },
    { "source": "/(.*)", "destination": "/frontend/dist/$1" }
  ]
}
`);


// -------------------------------------------------------------
// 3. CIRUGÍA DE CÓDIGO (REGEX AUTOMATIZADO)
// -------------------------------------------------------------
console.log('\n🔬 Ejecutando Microcirugía de Código...');

// Reparación A: Importaciones de MedicalCentersMap en el Frontend
const componentsDir = path.join(FRONTEND_DIR, 'src', 'components');
walk(path.join(FRONTEND_DIR, 'src'), (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Captura imports estáticos y dinámicos hacia MedicalCentersMap
    const regex = /(import\s+.*?from\s+|import\()(['"])(?:\.\.\/|\.\/)+MedicalCentersMap(?:\.tsx)?\2/g;
    
    if (regex.test(content)) {
      // Calcular la nueva ruta relativa exacta desde el archivo actual hacia components/
      let relPath = path.relative(path.dirname(filePath), componentsDir);
      relPath = relPath ? relPath.replace(/\\/g, '/') : '.';
      if (!relPath.startsWith('.')) relPath = './' + relPath;
      
      content = content.replace(regex, (match, prefix, quote) => {
        return `${prefix}${quote}${relPath}/MedicalCentersMap${quote}`;
      });
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`🔧 Rutas UI reparadas en: frontend/${path.relative(path.join(FRONTEND_DIR, 'src'), filePath).replace(/\\/g, '/')}`);
    }
  }
});

// Reparación B: Rutas a los JSON estáticos en el Backend
walk(path.join(BACKEND_DIR, 'api'), (filePath) => {
  if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Captura rutas como '../../src/data/healthUnits/' y añade un nivel '../' y 'frontend/'
    const regex = /(['"])(?:\.\.\/)+src\/data\/healthUnits\//g;
    
    if (regex.test(content)) {
      content = content.replace(regex, (match, quote) => {
        const upCount = (match.match(/\.\.\//g) || []).length;
        const newUps = '../'.repeat(upCount + 1);
        return `${quote}${newUps}frontend/src/data/healthUnits/`;
      });
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`🔧 Rutas JSON reparadas en: backend/${path.relative(path.join(BACKEND_DIR, 'api'), filePath).replace(/\\/g, '/')}`);
    }
  }
});

console.log('\n✅ MIGRACIÓN COMPLETADA. LA NUEVA ERA HA COMENZADO.');

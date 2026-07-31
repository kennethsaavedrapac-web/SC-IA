import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            if (id.includes('@supabase')) return 'supabase-vendor';
            if (id.includes('motion') || id.includes('lucide-react')) return 'ui-vendor';
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('dompurify')) return 'pdf-vendor';
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api': 'http://localhost:3000',
      },
      
      
      hmr: process.env.DISABLE_HMR !== 'true',
      
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

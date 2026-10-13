import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        input: {
          main: path.resolve(process.cwd(), 'index.html'),
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (
                id.includes('node_modules/three/') ||
                id.includes('node_modules/globe.gl/') ||
                id.includes('node_modules/three-globe/')
              ) {
                return 'three-globe-vendor';
              }
              if (
                id.includes('node_modules/jspdf/') ||
                id.includes('node_modules/html2canvas/') ||
                id.includes('node_modules/canvg/') ||
                id.includes('node_modules/dompurify/') ||
                id.includes('node_modules/pako/') ||
                id.includes('node_modules/fflate/') ||
                id.includes('node_modules/fast-png/') ||
                id.includes('node_modules/stackblur-canvas/') ||
                id.includes('node_modules/svg-pathdata/') ||
                id.includes('node_modules/rgbcolor/')
              ) {
                return 'pdf-canvas-vendor';
              }
              if (
                id.includes('node_modules/framer-motion/') ||
                id.includes('node_modules/motion/') ||
                id.includes('node_modules/motion-dom/') ||
                id.includes('node_modules/motion-utils/')
              ) {
                return 'motion-vendor';
              }
              if (
                id.includes('node_modules/firebase/') ||
                id.includes('node_modules/@firebase/') ||
                id.includes('node_modules/re2js/') ||
                id.includes('node_modules/idb/')
              ) {
                return 'firebase-vendor';
              }
              if (
                id.includes('node_modules/lightweight-charts/') ||
                id.includes('node_modules/chart.js/') ||
                id.includes('node_modules/react-chartjs-2/') ||
                id.includes('node_modules/recharts/') ||
                id.includes('node_modules/fancy-canvas/') ||
                id.includes('node_modules/decimal.js-light/') ||
                id.includes('node_modules/es-toolkit/') ||
                id.includes('node_modules/eventemitter3/') ||
                id.includes('node_modules/@reduxjs/') ||
                id.includes('node_modules/redux/')
              ) {
                return 'charts-vendor';
              }
              if (id.includes('node_modules/lucide-react/')) {
                return 'icons-vendor';
              }
              if (
                id.includes('node_modules/react/') ||
                id.includes('node_modules/react-dom/') ||
                id.includes('node_modules/react-is/') ||
                id.includes('node_modules/scheduler/')
              ) {
                return 'react-vendor';
              }
              if (id.includes('node_modules/hls.js/')) {
                return 'hls-vendor';
              }
              if (id.includes('node_modules/date-fns/')) {
                return 'date-vendor';
              }
              return 'common-vendor';
            }
            if (id.includes('/src/components/encyclopedia/') || id.includes('/src/components/EncyclopediaOfIndicators')) {
              return 'encyclopedia-vendor';
            }
            if (id.includes('/src/literacy/')) {
              return 'literacy-vendor';
            }
            if (id.includes('/src/education/')) {
              return 'education-vendor';
            }
          }
        }
      }
    },
    server: {
      headers: {
        'X-Service-Worker-Version': '5.0.0-kill-switch',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
        'CDN-Cache-Control': 'no-store'
      },
      strictPort: false,
      hmr: {
        port: 24688,
        clientPort: 443,
        overlay: false
      },
      watch: {
        usePolling: false
      }
    },
    preview: {
      headers: {
        'X-Service-Worker-Version': '5.0.0-kill-switch',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
        'CDN-Cache-Control': 'no-store'
      }
    },
  };
});

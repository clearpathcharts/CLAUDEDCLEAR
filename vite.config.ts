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
              if (id.includes('three') || id.includes('globe.gl') || id.includes('three-globe')) {
                return 'three-globe-vendor';
              }
              if (id.includes('jspdf') || id.includes('html2canvas')) {
                return 'pdf-canvas-vendor';
              }
              if (id.includes('framer-motion') || id.includes('motion')) {
                return 'motion-vendor';
              }
              if (id.includes('firebase')) {
                return 'firebase-vendor';
              }
              if (
                id.includes('lightweight-charts') ||
                id.includes('chart.js') ||
                id.includes('react-chartjs-2') ||
                id.includes('recharts')
              ) {
                return 'charts-vendor';
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
        'X-Service-Worker-Version': '4.0.0-firmware-val',
        'Cache-Control': 'no-cache, must-revalidate'
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
        'X-Service-Worker-Version': '4.0.0-firmware-val',
        'Cache-Control': 'no-cache, must-revalidate'
      }
    },
  };
});

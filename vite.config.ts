import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  assetsInclude: ['**/*.wasm'],
  publicDir: 'public',
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.wasm')) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        manualChunks: {
          // Vendor chunk for node_modules dependencies
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // GSAP chunk for animations
          gsap: ['gsap'],
          // Three.js chunk for 3D graphics
          three: ['three', 'cannon-es'],
          // UI libraries chunk
          ui: ['lucide-react', 'framer-motion'],
          // Chart.js chunk
          charts: ['chart.js'],
          // Audio/WebSocket chunk
          audio: ['@elevenlabs/elevenlabs-js', 'ws'],
          // Utilities chunk
          utils: ['simplex-noise', 'box2d-wasm'],
        },
      },
    },
  },
});

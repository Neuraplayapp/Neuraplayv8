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
    watch: {
      // Wait for file writes to finish before triggering updates
      awaitWriteFinish: {
        // Wait 500ms for file writes to stabilize
        stabilityThreshold: 500,
        // Poll every 100ms to check if file is stable
        pollInterval: 100
      },
      // Exclude large static assets from file watching
      ignored: [
        // Video files
        '**/public/assets/Videos/**',
        '**/assets/Videos/**',
        '**/*.mp4',
        '**/*.mov',
        '**/*.avi',
        '**/*.wmv',
        '**/*.flv',
        '**/*.webm',
        
        // Large audio files  
        '**/public/assets/music/**',
        '**/assets/music/**',
        '**/*.mp3',
        '**/*.wav',
        '**/*.flac',
        '**/*.m4a',
        
        // Large image files
        '**/*.png',
        '**/*.jpg',
        '**/*.jpeg',
        '**/*.gif',
        '**/*.bmp',
        '**/*.tiff',
        
        // Other large assets
        '**/*.wasm',
        '**/*.zip',
        '**/*.exe',
        
        // Specific large files
        '**/fast-noise-lite.js',
        '**/Implement the transitional animatio.txt',
        
        // Node modules and build outputs
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
      ]
    }
  },
  assetsInclude: ['**/*.wasm'],
  publicDir: 'public',
  build: {
    rollupOptions: {
      // Exclude legacy folders from the build
      external: [
        'src/components/legacy/**',
        'src/services/legacy/**'
      ],
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

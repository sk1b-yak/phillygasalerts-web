import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 9500,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:9400',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        manualChunks: {
          'deck-gl': [
            '@deck.gl/react',
            '@deck.gl/core',
            '@deck.gl/layers',
            '@deck.gl/geo-layers',
            '@deck.gl/aggregation-layers',
          ],
          'charts': ['lightweight-charts'],
          'motion': ['framer-motion'],
        },
      },
    },
  },
})

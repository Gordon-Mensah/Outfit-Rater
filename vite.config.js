import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',          // ← ADD THIS LINE ONLY
  server: {
    host: true,
    port: 5173,
    strictPort: false
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 10000,
    strictPort: false,
    allowedHosts: ['outfit-rater.onrender.com', '.onrender.com']
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    },
    minify: 'esbuild',
    sourcemap: false
  }
})
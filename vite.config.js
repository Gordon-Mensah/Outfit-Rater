import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
  // ✅ ADDED: Cache busting configuration
  build: {
    // Generate unique filenames with hash for each build
    // This forces browsers to download new files instead of using cache
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    },
    // Minify for better performance
    minify: 'terser',
    // Generate smaller files
    sourcemap: false
  }
})
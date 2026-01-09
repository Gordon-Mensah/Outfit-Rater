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
  }
})
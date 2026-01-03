import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Admin Panel Vite Configuration
// Runs on a separate port (5174) from the main frontend (5173)
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'admin'),
  build: {
    outDir: path.resolve(__dirname, 'dist-admin'),
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    proxy: {
      '/api/v1': {
        target: 'http://49.232.11.108:3001',
        changeOrigin: true,
        rewrite: (path) => path // Keep the path as-is (don't strip /api/v1)
      }
    }
  }
})

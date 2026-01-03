import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api/wechat': {
        target: 'https://api.weixin.qq.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wechat/, '/cgi-bin')
      },
      '/api/v1': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path // Keep the path as-is (don't strip /api/v1)
      }
    }
  }
})
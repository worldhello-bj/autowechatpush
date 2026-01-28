import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './shared/src')
    }
  },
  css: {
    postcss: './postcss.config.js'
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: ['**/backend/data/**']
    },
    proxy: {
      '/api/wechat': {
        target: 'https://api.weixin.qq.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wechat/, '/cgi-bin')
      },
      '/api/v1': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})

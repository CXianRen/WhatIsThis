import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // 或者 'http://172.18.41.198:8000'
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '') // 如果后端路由是 /api/xxx 就不要 rewrite
      }
    }
  }
});
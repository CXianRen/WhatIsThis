import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 或 host: '0.0.0.0'
    port: 5000,
    proxy: {
      '/api': {
        target: 'http://172.18.41.198:8000',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
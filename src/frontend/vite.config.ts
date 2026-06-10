import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:8080',
        changeOrigin: true,
        secure: false
      },
      '/ws-smiling-wallet': {
        target: 'https://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }

})
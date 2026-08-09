import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080', // <-- Changed from localhost to 127.0.0.1
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
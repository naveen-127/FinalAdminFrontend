import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default {
  server: {
    host: '0.0.0.0', // or true to use the system's IP
    port: 5173,
    proxy: {
      '/adminhome/derivation': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
}


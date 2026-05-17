import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Configuración más conservadora para evitar problemas con Context
      fastRefresh: true,
      babel: {
        plugins: []
      }
    })
  ],
  server: {
    port: 3000,
    host: true, // Permitir acceso desde la red
    hmr: {
      overlay: false // Desactivar overlay de errores que puede causar problemas
    },
    proxy: {
      '/api': {
        target: 'http://192.168.1.36:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  optimizeDeps: {
    exclude: ['react-router-dom'] // Evitar pre-bundling problemático
  }
})

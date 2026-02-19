import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/eum': {
        target: 'http://api.eum.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/eum/, ''),
        secure: false,
      },
      '/api/vworld': {
        target: 'https://api.vworld.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vworld/, ''),
        secure: false,
      },
      '/vworld_map': {
        target: 'http://map.vworld.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/vworld_map/, ''),
        secure: false,
      }
    }
  },
  build: {
    minify: false
  }
})

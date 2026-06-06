import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // Menjadikan output build relative path agar cocok untuk GitHub Pages / file:///
  server: {
    port: 3000,
    proxy: {
      '/api/live': {
        target: 'https://bemo.uptangkutan-bandung.id/map/live',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/live/, ''),
      },
      '/api/tmb': {
        target: 'https://bemo.uptangkutan-bandung.id/map/tmb/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tmb/, ''),
      },
    },
  },
})

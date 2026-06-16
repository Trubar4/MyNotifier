import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base = Repository-Name für GitHub Pages (https://<user>.github.io/MyNotifier/)
export default defineConfig({
  base: '/MyNotifier/',
  plugins: [react()],
  server: {
    fs: {
      // Erlaubt Zugriff auf das design-system außerhalb des demo-tool Ordners
      allow: ['..'],
    },
  },
})

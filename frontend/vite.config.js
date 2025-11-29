import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // expose to LAN for mobile preview
    port: 3000,
    open: true
  },
  preview: {
    port: 3001
  }
})

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The browser talks to one origin; /api is forwarded to the Express backend
    // (this keeps the httpOnly login cookie working without CORS tricks).
    proxy: { '/api': { target: 'http://localhost:3715', changeOrigin: true } },
  },
})

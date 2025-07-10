import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:5001')
  },
  server: {
    host: true,
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://xploithub.com',
        'https://www.xploithub.com',
        'https://*.vercel.app'
      ],
      credentials: true
    },
    // Proxy disabled - using direct API calls via VITE_API_URL
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:5001',
    //     changeOrigin: true
    //   }
    // }
  }
})

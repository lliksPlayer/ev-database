import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('recharts')) return 'charts'
          if (id.includes('firebase')) return 'firebase'
          if (id.includes('@dnd-kit') || id.includes('xlsx')) return 'admin-tools'
          if (
            id.includes('react') ||
            id.includes('scheduler') ||
            id.includes('react-router') ||
            id.includes('i18next') ||
            id.includes('lucide-react')
          ) {
            return 'app-vendor'
          }
        },
      },
    },
  },
})

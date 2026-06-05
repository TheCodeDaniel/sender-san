import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/sender-san/',
  plugins: [react()],
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
})

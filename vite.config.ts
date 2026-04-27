import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/phila-turf-examples/',
  server: {
    port: 5173,
  },
})

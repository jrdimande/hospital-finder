import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/mozgis': {
        target: 'https://www.mozgis.gov.mz',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mozgis/, '/server/rest/services'),
      },
    },
  },
})

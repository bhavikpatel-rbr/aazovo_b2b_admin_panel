import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import dynamicImport from 'vite-plugin-dynamic-import'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), dynamicImport()],
  assetsInclude: ['**/*.md'],
  define: {
    'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL),
    'process.env.REACT_APP_USE_APPLICATION_ENCRYPT_STORAGE': JSON.stringify(process.env.REACT_APP_USE_APPLICATION_ENCRYPT_STORAGE),
    'process.env.REACT_APP_ENCRYPTSTORAGE_SECRET_KEY': JSON.stringify(process.env.REACT_APP_ENCRYPTSTORAGE_SECRET_KEY)
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
    },
  
  },
  build: {
    outDir: 'build'
  }
})

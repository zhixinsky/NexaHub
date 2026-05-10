import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/contents': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/activities': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/products': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/pages': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/attachmentapi': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/upload': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/public': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});

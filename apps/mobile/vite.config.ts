import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import path from 'node:path';

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5176,
    strictPort: true,
    proxy: {
      '/public': { target: 'http://localhost:3000', changeOrigin: true },
      '/contents': { target: 'http://localhost:3000', changeOrigin: true },
      '/products': { target: 'http://localhost:3000', changeOrigin: true },
      '/activities': { target: 'http://localhost:3000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3000', changeOrigin: true }
    }
  }
});

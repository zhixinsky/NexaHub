import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import os from 'node:os';

function getLanIPAddress() {
  const interfaces = os.networkInterfaces();
  const ignoredName = /(loopback|virtual|vmware|vbox|hyper-v|docker|wsl|tun|tap|singbox)/i;

  for (const [name, list] of Object.entries(interfaces)) {
    if (ignoredName.test(name)) continue;
    for (const item of list || []) {
      if (item.family === 'IPv4' && !item.internal && !item.address.startsWith('127.')) {
        return item.address;
      }
    }
  }

  return 'localhost';
}

const DEV_RELAXED_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https: http:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https: http:",
  "font-src 'self' data: https:",
  "connect-src *",
  "worker-src 'self' blob:",
  "frame-src 'self' https: http:"
].join('; ');

export default defineConfig(({ mode }) => {
  const publicOrigin = `http://${getLanIPAddress()}:5173`;

  return {
    plugins: [vue()],
    define: {
      'import.meta.env.VITE_PUBLIC_ORIGIN': JSON.stringify(publicOrigin)
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      ...(mode === 'development'
        ? {
            headers: {
              'Content-Security-Policy': DEV_RELAXED_CSP
            }
          }
        : {}),
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        '/diy-editor': {
          target: 'http://localhost:5174',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => {
            const [pathname, search = ''] = path.split('?');
            if (pathname === '/diy-editor' || pathname === '/diy-editor/') {
              return `/diy-editor/index.html${search ? `?${search}` : ''}`;
            }
            return path;
          }
        },
        '/static/diy/images': {
          target: 'http://localhost:5174',
          changeOrigin: true
        },
        '/images': {
          target: 'http://localhost:5174',
          changeOrigin: true
        },
        '/static/plugins': {
          target: 'http://localhost:5174',
          changeOrigin: true
        },
        '/mobile': {
          target: 'http://localhost:5175',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => {
            const [pathname, search = ''] = path.split('?');
            if (pathname === '/mobile') {
              return `/mobile/${search ? `?${search}` : ''}`;
            }
            return path;
          }
        }
      }
    }
  };
});

/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
  proxy: {
    '/auth': { target: 'http://localhost:3000', changeOrigin: true },
    '/products': { target: 'http://localhost:3000', changeOrigin: true },
    '/categories': { target: 'http://localhost:3000', changeOrigin: true },
    '/upload': { target: 'http://localhost:3000', changeOrigin: true },
    '/uploads': { target: 'http://localhost:3000', changeOrigin: true },
    '/wallet': { target: 'http://localhost:3000', changeOrigin: true },
    '/orders': { target: 'http://localhost:3000', changeOrigin: true },
    '/admin': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      bypass(req) {
        if (req.headers.accept?.includes('text/html')) {
          return '/index.html';
        }
      },
    },
    '/payments': { target: 'http://localhost:3000', changeOrigin: true },
    '/mock-payment': { target: 'http://localhost:3000', changeOrigin: true },
    '/notifications': { target: 'http://localhost:3000', changeOrigin: true },
    '/reviews': { target: 'http://localhost:3000', changeOrigin: true },
    '/health': { target: 'http://localhost:3000', changeOrigin: true },
    '/chat': { target: 'http://localhost:3000', changeOrigin: true },
    '/ws': { target: 'ws://localhost:3000', ws: true, changeOrigin: true },
  },
  allowedHosts: ['.loca.lt', 'localhost'],
},
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    root: './',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
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
      '/auth': 'http://localhost:3000',
      '/products': 'http://localhost:3000',
      '/categories': 'http://localhost:3000',
      '/upload': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
      '/wallet': 'http://localhost:3000',
      '/orders': 'http://localhost:3000',
      '/admin': 'http://localhost:3000',
      '/payments': 'http://localhost:3000',
      '/mock-payment': 'http://localhost:3000',
      '/notifications': 'http://localhost:3000',
      '/reviews': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    },
    allowedHosts: ['.loca.lt', 'localhost'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    root: './',
    include: ['src/app/__tests__/**/*.test.{ts,tsx}'],
  },
});
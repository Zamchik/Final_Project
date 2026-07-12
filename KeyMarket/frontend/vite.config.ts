/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
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
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/bridge/ws': {
        target: 'http://localhost:9810',
        ws: true,
        changeOrigin: true
      }
    }
  }
});
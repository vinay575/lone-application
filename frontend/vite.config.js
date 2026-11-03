import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Build to the repository root so Vercel's default "dist" output (and the
  // Express static server) find the same folder.
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: { port: 5173 },
  build: { outDir: 'dist' },
  resolve: {
    alias: {
      '@business': path.resolve(__dirname, '@business'),
      '@libs': path.resolve(__dirname, '@libs'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },
});

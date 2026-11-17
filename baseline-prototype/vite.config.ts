import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' so the built files work from any folder (e.g. GitHub Pages at /baseline-prototype/dist/)
export default defineConfig({
  plugins: [react()],
  base: './',
});

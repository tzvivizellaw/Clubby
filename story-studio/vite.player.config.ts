import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Builds the standalone story player (used by the HTML export) into a single
 * self-contained IIFE script. The main app imports it as a raw string.
 */
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: 'src/generated',
    emptyOutDir: false,
    copyPublicDir: false,
    minify: true,
    lib: {
      entry: 'src/player/standalone.tsx',
      formats: ['iife'],
      name: 'HasipurPlayer',
      fileName: () => 'player-bundle.js',
    },
  },
});

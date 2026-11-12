import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5180, strictPort: false },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
  },
  test: {
    environment: 'jsdom',
    alias: { phaser: new URL('./src/tests/phaserStub.ts', import.meta.url).pathname },
    include: ['src/tests/**/*.test.ts'],
  },
} as any);

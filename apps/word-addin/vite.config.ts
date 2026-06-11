import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        taskpane: resolve(__dirname, 'src/taskpane.html'),
        commands: resolve(__dirname, 'src/commands.html'),
      },
    },
  },
  server: {
    port: 3002,
    https: false,
    cors: true,
    host: true,
  },
});

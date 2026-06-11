import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        taskpane: 'src/taskpane.html',
        commands: 'src/commands.html',
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

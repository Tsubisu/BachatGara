import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const PORT = parseInt(env.VITE_PORT || '3000', 10);

  return {
    plugins: [react()],
    server: {
      port: PORT,
    },
  };
});

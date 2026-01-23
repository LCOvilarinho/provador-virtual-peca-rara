
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // FIX: Cast process as any to resolve "Property 'cwd' does not exist on type 'Process'"
  // while maintaining standard loadEnv usage in the Node.js context.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Injeta a API_KEY para que process.env.API_KEY funcione no código do cliente
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    build: {
      outDir: 'dist',
      target: 'esnext',
      sourcemap: false
    },
    server: {
      port: 3000
    }
  };
});

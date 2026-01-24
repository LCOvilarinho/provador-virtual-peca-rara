import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Use process.cwd() with explicit import to avoid typing conflicts
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Definimos como uma string que o Vite pode substituir, mas sem quebrar o acesso global
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

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'process';

export default defineConfig(({ mode }) => {
  // Carrega as variáveis do arquivo .env com base no modo (development ou production)
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Mapeia a API_KEY para o código cliente, priorizando a variável de sistema
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY)
    },
    server: {
      port: 3000
    },
    build: {
      outDir: 'dist',
      target: 'esnext'
    }
  };
});

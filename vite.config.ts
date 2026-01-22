import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './'  // Caminhos relativos: corrige tela preta em deploy
})

/// <reference types="vitest/config" />
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// ANALYZE=1 npm run build gera dist/stats.html (composição do bundle, com
// tamanhos gzip e brotli) para a medição da T45; sem a variável o build é o
// mesmo de sempre.
const analisarBundle = process.env.ANALYZE === '1'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    analisarBundle && visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true, template: 'treemap' }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    // Default de 5000ms fica apertado quando a suíte inteira roda em
    // paralelo (vários workers do Vitest disputando CPU) e um teste depende
    // de debounce + round-trip via MSW + digitação simulada — vira flakiness
    // de infraestrutura de teste, não falha de comportamento do componente.
    testTimeout: 10000,
  },
})

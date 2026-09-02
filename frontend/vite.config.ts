/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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

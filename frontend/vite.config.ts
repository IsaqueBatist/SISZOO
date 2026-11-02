/// <reference types="vitest/config" />
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

const analisarBundle = process.env.ANALYZE === '1'

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
    testTimeout: 10000,
  },
})

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'performance',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup/performance.setup.ts'],
    include: ['src/**/*.performance.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: [
      'src/**/*.unit.{test,spec}.{js,ts,jsx,tsx}',
      'src/**/*.integration.{test,spec}.{js,ts,jsx,tsx}',
      'src/**/*.security.{test,spec}.{js,ts,jsx,tsx}',
      'src/**/*.e2e.{test,spec}.{js,ts,jsx,tsx}',
      'node_modules/**',
      'dist/**',
      'coverage/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/performance',
      include: ['src/services/**/*.{js,ts,jsx,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
        'src/test/**',
        'src/**/*.d.ts'
      ]
    },
    testTimeout: 60000,
    hookTimeout: 60000,
    teardownTimeout: 60000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
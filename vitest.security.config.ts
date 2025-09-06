import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'security',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup/security.setup.ts'],
    include: ['src/**/*.security.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: [
      'src/**/*.unit.{test,spec}.{js,ts,jsx,tsx}',
      'src/**/*.integration.{test,spec}.{js,ts,jsx,tsx}',
      'src/**/*.performance.{test,spec}.{js,ts,jsx,tsx}',
      'src/**/*.e2e.{test,spec}.{js,ts,jsx,tsx}',
      'node_modules/**',
      'dist/**',
      'coverage/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/security',
      include: ['src/services/**/*.{js,ts,jsx,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
        'src/test/**',
        'src/**/*.d.ts'
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/assets': path.resolve(__dirname, './src/assets'),
    },
  },
  optimizeDeps: {
    include: [
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'firebase/functions',
      'firebase/analytics',
    ],
  },
  build: {
    // Optimize build output
    minify: 'esbuild',
    target: 'es2015',
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/storage',
            'firebase/functions',
            'firebase/analytics',
          ],
          'ui-vendor': [
            'framer-motion',
            '@heroicons/react/24/outline',
            '@heroicons/react/24/solid',
            'react-hot-toast',
          ],
          'form-vendor': [
            'react-hook-form',
            'yup',
            '@hookform/resolvers/yup',
          ],
          'utils-vendor': [
            'zustand',
            'clsx',
            'date-fns',
          ],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Source maps for production debugging
    sourcemap: false,
    // Asset optimization
    assetsInlineLimit: 4096,
    // Output directory
    outDir: 'dist',
    // Clear output directory before build
    emptyOutDir: true,
    // CSS code splitting
    cssCodeSplit: true,
  },
  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})

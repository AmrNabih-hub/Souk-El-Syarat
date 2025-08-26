import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Performance optimizations
  build: {
    // Target modern browsers for smaller bundle
    target: 'esnext',
    // Enable minification
    minify: 'esbuild',
    // Optimize chunks
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          ui: ['framer-motion', '@heroicons/react'],
          utils: ['zustand', 'react-router-dom', 'react-hot-toast']
        },
        // Optimize asset filenames
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      }
    },
    // Source maps for production debugging (can be disabled for smaller builds)
    sourcemap: false,
    // Report compressed file sizes
    reportCompressedSize: true,
    // Optimize CSS
    cssCodeSplit: true,
  },
  // Optimize dev server
  server: {
    // Enable compression
    cors: true,
    // Optimize HMR
    hmr: {
      overlay: true
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'framer-motion',
      'zustand',
      'react-hot-toast'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  // Enable advanced optimizations
  esbuild: {
    // Remove console.log in production
    drop: ['console', 'debugger'],
    // Optimize for smaller builds
    legalComments: 'none',
    // Target modern JS
    target: 'esnext'
  },
  // CSS optimizations
  css: {
    // Enable CSS modules optimization
    modules: {
      localsConvention: 'camelCase'
    },
    // PostCSS optimizations
    postcss: {
      plugins: [
        // Add autoprefixer and other optimizations if needed
      ]
    }
  },
  // Asset optimizations
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp']
})

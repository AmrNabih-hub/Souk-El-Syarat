import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react({
        // Enable React 19 features
        jsxRuntime: 'automatic',
        fastRefresh: true,
        // Enable strict mode for better development experience
        strictMode: true
      })
    ],
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    
    build: {
      // Optimize for production
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      minify: 'terser',
      
      // Enable tree shaking and code splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunks for better caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'firebase-vendor': [
              'firebase/app',
              'firebase/auth',
              'firebase/firestore',
              'firebase/storage',
              'firebase/functions',
              'firebase/analytics'
            ],
            'ui-vendor': [
              'framer-motion',
              '@heroicons/react/24/outline',
              '@heroicons/react/24/solid',
              'react-hot-toast',
              'lucide-react'
            ],
            'form-vendor': [
              'react-hook-form',
              '@hookform/resolvers',
              'yup'
            ],
            'query-vendor': [
              '@tanstack/react-query'
            ]
          }
        }
      },
      
      // Source maps for production debugging
      sourcemap: mode === 'production' ? false : true,
      
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
      
      // Asset optimization
      assetsInlineLimit: 2048,
      
      // Performance optimizations
      cssCodeSplit: true,
      reportCompressedSize: false,
    },
    
    server: {
      port: 5173,
      host: true,
      
      // Proxy configuration for local development
      proxy: mode === 'development' ? {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        }
      } : {}
    },
    
    preview: {
      port: 4173,
      host: true,
    },
    
    // Environment variables
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    
    // Optimization for CI builds
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    
    // CSS optimization - Tailwind CSS handled by PostCSS config
    css: {
      postcss: {
        plugins: [
          tailwindcss,
          autoprefixer,
        ],
      },
      devSourcemap: true
    }
  }
})

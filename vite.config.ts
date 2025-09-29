import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    
    build: {
      // Optimize for production
      target: 'es2015',
      outDir: 'dist',
      assetsDir: 'assets',
      minify: 'terser',
      
      // Enable tree shaking
        rollupOptions: {
          external: [],
          output: {
            manualChunks: {
              // Separate vendor chunks for better caching
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'ui-vendor': [
                'framer-motion',
                '@heroicons/react/24/outline',
                '@heroicons/react/24/solid',
                'react-hot-toast'
              ]
            }
          }
        },
      
      // Source maps for production debugging
      sourcemap: mode === 'production' ? false : true,
      
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
      
      // Asset optimization
      assetsInlineLimit: 4096,
    },
    
    server: {
      port: 5000,
      host: '0.0.0.0',
      allowedHosts: true,
      
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
    
    // CSS optimization
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`
        }
      }
    }
  }
})

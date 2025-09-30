import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Unified Vite configuration for both development and production
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      react({
        jsxRuntime: 'automatic'
      })
    ],
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      // Enhanced resolution for better compatibility
      conditions: ['import', 'module', 'browser', 'default'],
      mainFields: ['browser', 'module', 'main'],
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    },

    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'framer-motion',
        'react-hot-toast',
        'clsx',
        'date-fns',
        'lucide-react',
        '@headlessui/react',
        '@heroicons/react/24/outline',
        '@heroicons/react/24/solid',
        'react-hook-form',
        '@hookform/resolvers/yup',
        'yup',
        'zustand'
      ],
      exclude: [
        '@aws-amplify/backend', 
        '@aws-amplify/backend-cli',
        'aws-amplify' // Exclude to avoid resolution issues
      ],
      esbuildOptions: {
        target: 'es2020'
      }
    },
    
    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      minify: isProduction ? 'terser' : false,
      
      // Production-optimized terser options
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.warn'],
          passes: 2
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false
        }
      } : undefined,
      
      // Optimized rollup options
      rollupOptions: {
        output: {
          // Smart chunking strategy for better caching
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['framer-motion', '@heroicons/react/24/outline', '@heroicons/react/24/solid', 'react-hot-toast', '@headlessui/react', 'lucide-react'],
            'utils-vendor': ['date-fns', 'clsx', 'zustand', 'yup'],
            'form-vendor': ['react-hook-form', '@hookform/resolvers']
          },
          
          // Optimized file naming for caching
          chunkFileNames: isProduction ? 'js/[name]-[hash].js' : 'js/[name].js',
          entryFileNames: isProduction ? 'js/[name]-[hash].js' : 'js/[name].js',
          assetFileNames: (assetInfo) => {
            if (!assetInfo.name) return 'assets/[name]-[hash][extname]';
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `images/[name]-[hash][extname]`;
            }
            if (/css/i.test(ext)) {
              return `css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
        }
      },
      
      // Source maps only in development
      sourcemap: !isProduction,
      
      // Build optimizations
      chunkSizeWarningLimit: 1000,
      assetsInlineLimit: 4096,
      cssCodeSplit: true,
      reportCompressedSize: isProduction,
    },
    
    server: {
      port: 5000,
      host: '0.0.0.0',
      // Critical for Replit: allow all hosts (proxy support)
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
      port: 5000,
      host: '0.0.0.0',
    },
    
    // Environment variables
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __BUILD_TARGET__: JSON.stringify(mode),
    },
    
    // ESBuild optimizations
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
      legalComments: isProduction ? 'none' : 'inline',
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

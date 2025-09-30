import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Production-specific Vite configuration for AWS Amplify deployment
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react({
        jsxRuntime: 'automatic',
        fastRefresh: false // Disable for production
      })
    ],
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      // Enhanced resolution for production
      conditions: ['import', 'module', 'browser', 'default'],
      mainFields: ['browser', 'module', 'main'],
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    },
    
    // Simplified optimizeDeps for production
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
        'aws-amplify' // Exclude for now to avoid resolution issues
      ],
      force: true,
      esbuildOptions: {
        target: 'es2020'
      }
    },
    
    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      minify: 'terser',
      
      // Production-optimized terser options
      terserOptions: {
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
      },
      
      // Optimized rollup options for production
      rollupOptions: {
        output: {
          // Production chunking strategy
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['framer-motion', '@heroicons/react', 'react-hot-toast', '@headlessui/react', 'lucide-react'],
            'utils-vendor': ['date-fns', 'clsx', 'zustand', 'yup'],
            'form-vendor': ['react-hook-form', '@hookform/resolvers']
          },
          
          // Optimized file naming for caching
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
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
      
      // Production optimizations
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      assetsInlineLimit: 4096,
      cssCodeSplit: true,
      reportCompressedSize: true,
      write: true,
    },
    
    server: {
      port: 5173,
      host: true
    },
    
    preview: {
      port: 5000,
      host: '0.0.0.0'
    },
    
    // Production environment variables
    define: {
      'process.env.NODE_ENV': '"production"',
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __BUILD_TARGET__: '"production"'
    },
    
    // Production esbuild settings
    esbuild: {
      drop: ['console', 'debugger'],
      legalComments: 'none'
    }
  }
})
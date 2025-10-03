import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// Professional Vite configuration for Appwrite Sites deployment
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'
  const isDevelopment = mode === 'development'
  
  return {
    plugins: [
      react({
        jsxRuntime: 'automatic',
        babel: {
          plugins: isDevelopment ? [] : []
        }
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['app-icon.svg', 'robots.txt', 'icon-*.png'],
        manifest: {
          name: 'Souk El-Sayarat - سوق السيارات',
          short_name: 'Souk El-Sayarat',
          description: 'Professional Egyptian car marketplace',
          theme_color: '#f59e0b',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/app-icon.svg',
              sizes: '256x256',
              type: 'image/svg+xml',
            },
            {
              src: '/app-icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/cloud\.appwrite\.io\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'appwrite-resources',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false, // Disable in development
        },
      })
    ],
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
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
        'zustand',
        'appwrite'
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
      sourcemap: false, // Disable source maps for production
      
      // Production-optimized terser options
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
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
            'form-vendor': ['react-hook-form', '@hookform/resolvers'],
            'appwrite-vendor': ['appwrite']
          },
          
          // Optimized file naming for caching
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
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
      
      // Build optimizations
      chunkSizeWarningLimit: 1000,
      assetsInlineLimit: 4096,
      cssCodeSplit: true,
      reportCompressedSize: isProduction,
      emptyOutDir: true, // Clean dist folder before build
    },
    
    server: {
      port: 5000,
      host: '0.0.0.0',
      cors: true,
    },
    
    preview: {
      port: 5000,
      host: '0.0.0.0',
      cors: true,
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
      target: 'es2020',
      logOverride: { 'this-is-undefined-in-esm': 'silent' }
    },
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true, // Enable sourcemaps for debugging
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui-vendor': ['framer-motion', '@heroicons/react/24/outline', '@headlessui/react'],
          'supabase': ['@supabase/supabase-js', '@supabase/auth-helpers-react'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'yup'],
          'utils': ['clsx', 'date-fns', 'crypto-js'],
          'query': ['@tanstack/react-query'],
          'store': ['zustand'],
          'charts': ['recharts'],
          
          // App-specific chunks - using actual existing files
          'pages-core': [
            'src/pages/HomePage',
            'src/pages/AboutPage',
            'src/pages/ContactPage'
          ],
          'pages-customer': [
            'src/pages/customer/MarketplacePage',
            'src/pages/customer/CustomerDashboard'
          ],
          'pages-vendor': [
            'src/pages/VendorApplicationPage',
            'src/pages/vendor/VendorDashboard'
          ],
          'pages-auth': [
            'src/pages/auth/LoginPage',
            'src/pages/auth/RegisterPage'
          ],
          'components-ui': [
            'src/components/ui/EnhancedHeroSlider',
            'src/components/ui/LoadingScreen',
            'src/components/ui/EgyptianLoader'
          ]
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for now to debug
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'framer-motion',
      '@tanstack/react-query'
    ]
  }
})

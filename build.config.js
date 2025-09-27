/**
 * Build Configuration for Souk El-Syarat
 * Advanced build optimization and deployment settings
 */

export const buildConfig = {
  // Build optimization settings
  optimization: {
    minify: true,
    treeshake: true,
    splitChunks: true,
    compression: 'gzip',
    sourcemap: process.env.NODE_ENV === 'development',
  },

  // Chunk splitting strategy
  chunks: {
    vendor: {
      react: ['react', 'react-dom', 'react-router-dom'],
      ui: [
        'framer-motion',
        '@heroicons/react/24/outline',
        '@heroicons/react/24/solid',
        'react-hot-toast',
      ],
      forms: [
        'react-hook-form',
        'yup',
        '@hookform/resolvers/yup',
      ],
      utils: [
        'zustand',
        'clsx',
        'date-fns',
      ],
    },
  },

  // Asset optimization
  assets: {
    inlineLimit: 4096,
    imageOptimization: true,
    fontOptimization: true,
  },

  // Performance budgets
  performance: {
    maxAssetSize: 500000, // 500KB
    maxEntrypointSize: 1000000, // 1MB
    hints: 'warning',
  },

  // PWA Configuration
  pwa: {
    enabled: true,
    name: 'Souk El-Syarat',
    shortName: 'Souk',
    description: 'Modern E-commerce Marketplace for Egyptian Automotive Market',
    themeColor: '#D4AF37',
    backgroundColor: '#1A1A1A',
    icons: [
      {
        src: '/app-icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  },

  // Environment-specific settings
  environments: {
    development: {
      sourcemap: true,
      minify: false,
      optimization: false,
    },
    staging: {
      sourcemap: true,
      minify: true,
      optimization: true,
    },
    production: {
      sourcemap: false,
      minify: true,
      optimization: true,
      analytics: true,
    },
  },
};

export default buildConfig;

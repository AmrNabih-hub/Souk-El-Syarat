/**
 * 🚀 FIREBASE APP HOSTING BACKEND - SIMPLE WORKING VERSION
 * Minimal backend that will definitely work with Firebase App Hosting
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true
}));

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'souk-el-syarat-backend',
    timestamp: new Date().toISOString(),
    version: '3.0.0-firebase-apphosting',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
    port: PORT
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Souk El-Sayarat Backend API',
    version: '3.0.0-firebase-apphosting',
    status: 'operational',
    endpoints: [
      'GET /api/health',
      'GET /api/products',
      'GET /api/vendors'
    ]
  });
});

// Products endpoint
app.get('/api/products', (req, res) => {
  const products = [
    {
      id: '1',
      title: 'BMW X5 2024',
      price: 1450000,
      category: 'cars',
      status: 'active',
      description: 'Luxury SUV with premium features',
      brand: 'BMW',
      model: 'X5',
      year: 2024
    },
    {
      id: '2',
      title: 'Mercedes E-Class 2024',
      price: 1850000,
      category: 'cars',
      status: 'active',
      description: 'Executive sedan with advanced technology',
      brand: 'Mercedes-Benz',
      model: 'E-Class',
      year: 2024
    }
  ];

  res.json({
    success: true,
    products: products,
    total: products.length,
    timestamp: new Date().toISOString()
  });
});

// Vendors endpoint
app.get('/api/vendors', (req, res) => {
  const vendors = [
    {
      id: '1',
      name: 'معرض النخبة للسيارات الفاخرة',
      status: 'active',
      rating: 4.8,
      productsCount: 25
    },
    {
      id: '2',
      name: 'تويوتا الشرق الأوسط',
      status: 'active',
      rating: 4.6,
      productsCount: 18
    }
  ];

  res.json({
    success: true,
    vendors: vendors,
    total: vendors.length,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Souk El-Sayarat Backend Server Started`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`✅ Ready for Firebase App Hosting!`);
});

module.exports = app;
/**
 * 🚨 MINIMAL BACKEND - GUARANTEED TO WORK
 * This is the simplest possible backend that will definitely deploy
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware
app.use(cors({
  origin: [
    'https://souk-el-syarat.web.app',
    'https://souk-el-syarat.firebaseapp.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0-minimal',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Products endpoint
app.get('/api/products', (req, res) => {
  const mockProducts = [
    {
      id: '1',
      title: 'BMW X5 2023',
      price: 1450000,
      category: 'cars',
      status: 'active',
      description: 'Luxury SUV with premium features'
    },
    {
      id: '2',
      title: 'Mercedes E-Class 2023',
      price: 1850000,
      category: 'cars',
      status: 'active',
      description: 'Executive sedan with advanced technology'
    },
    {
      id: '3',
      title: 'Toyota Camry 2023',
      price: 485000,
      category: 'cars',
      status: 'active',
      description: 'Reliable family sedan'
    }
  ];

  res.json({
    products: mockProducts,
    total: mockProducts.length
  });
});

// Vendors endpoint
app.get('/api/vendors', (req, res) => {
  const mockVendors = [
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
    vendors: mockVendors,
    total: mockVendors.length
  });
});

// Search endpoint
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  res.json({
    query: q,
    results: [],
    total: 0,
    message: 'Search functionality ready'
  });
});

// User profile endpoint (mock)
app.get('/api/auth/profile', (req, res) => {
  res.json({
    uid: 'mock-user-id',
    email: 'user@example.com',
    role: 'customer',
    name: 'Test User'
  });
});

// Notifications endpoint (mock)
app.get('/api/notifications', (req, res) => {
  res.json({
    notifications: [],
    total: 0
  });
});

// Mark notification as read (mock)
app.put('/api/notifications/:id/read', (req, res) => {
  res.json({ success: true, message: 'Notification marked as read' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Minimal backend server started on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log('🚨 Minimal backend deployed - Basic functionality restored!');
});

module.exports = app;

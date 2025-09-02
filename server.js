const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Souk El-Syarat Backend',
    version: '1.0.0',
    status: 'running'
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'Souk El-Syarat API',
    endpoints: ['/health', '/api', '/api/products']
  });
});

// Simple products endpoint
app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    products: [
      { id: 1, name: 'Test Product', price: 100 }
    ],
    message: 'Firebase connection will be added after deployment succeeds'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

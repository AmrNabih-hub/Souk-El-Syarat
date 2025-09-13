/**
 * 🚀 SOUK EL-SAYARAT APP HOSTING SERVER
 * Simplified server following latest Firebase App Hosting requirements
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'souk-el-sayarat-apphosting',
    version: '1.0.0'
  });
});

// API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    message: 'Souk El-Sayarat Backend API',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login endpoint operational',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/signup', (req, res) => {
  res.json({
    success: true,
    message: 'Signup endpoint operational',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout endpoint operational',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/reset', (req, res) => {
  res.json({
    success: true,
    message: 'Password reset endpoint operational',
    timestamp: new Date().toISOString()
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'API endpoint not found'
    });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Souk El-Sayarat App Hosting Server running on port ${PORT}`);
});

module.exports = app;

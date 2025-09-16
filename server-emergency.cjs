const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'souk-el-sayarat-backend-emergency',
        version: 'EMERGENCY-FIX-1.0.0'
    });
});

// API status
app.get('/api/status', (req, res) => {
    res.json({
        message: 'Souk El-Sayarat Backend - EMERGENCY FIX',
        status: 'operational',
        timestamp: new Date().toISOString()
    });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
    res.json({
        success: true,
        message: 'Login endpoint - EMERGENCY FIX',
        data: { email: req.body.email, token: 'emergency-token' }
    });
});

app.post('/api/auth/signup', (req, res) => {
    res.json({
        success: true,
        message: 'Signup endpoint - EMERGENCY FIX',
        data: { email: req.body.email, name: req.body.name }
    });
});

// Products endpoint
app.get('/api/products', (req, res) => {
    res.json({
        products: [],
        total: 0,
        status: 'operational'
    });
});

// Orders endpoint
app.post('/api/orders', (req, res) => {
    res.json({
        success: true,
        message: 'Order created - EMERGENCY FIX',
        orderId: 'EMERGENCY-' + Date.now()
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('ðŸš¨ EMERGENCY BACKEND STARTED on port', PORT);
});

module.exports = app;

/**
 * 🚀 SOUK EL-SAYARAT - COMPREHENSIVE BACKEND SERVER
 * Production-ready backend with zero-error deployment
 * Budget-optimized architecture with comprehensive monitoring
 */

const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const winston = require('winston');
require('dotenv').config();

// Import custom modules
const { dbManager } = require('./config/database');
const { 
  createRateLimiters, 
  createCorsConfig, 
  createHelmetConfig, 
  securityHeaders, 
  requestLogger, 
  errorHandler, 
  notFoundHandler 
} = require('./middleware/security');

// Import routes
const { router: authRoutes } = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const orderRoutes = require('./routes/orders');

// 🚨 COMPREHENSIVE ERROR HANDLING AND LOGGING
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'souk-el-sayarat-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Initialize configuration
const rateLimiters = createRateLimiters();
const corsConfig = createCorsConfig();
const helmetConfig = createHelmetConfig();

// 🚨 EXPRESS APP CONFIGURATION
const app = express();
const PORT = process.env.PORT || 8080;

// 🚨 SECURITY MIDDLEWARE
app.use(require('helmet')(helmetConfig));
app.use(require('cors')(corsConfig[process.env.NODE_ENV || 'development']));
app.use(securityHeaders);
app.use(requestLogger);

// Rate limiting
app.use('/api/', rateLimiters.general);
app.use('/api/auth/', rateLimiters.auth);
app.use('/api/', rateLimiters.api);

// Body parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// 🚨 HEALTH CHECK ENDPOINT
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await dbManager.healthCheck();
    
    const healthCheck = {
      status: dbHealth.allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: dbHealth,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
    
    logger.info('Health check requested', healthCheck);
    
    const statusCode = dbHealth.allHealthy ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 🚨 API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/orders', orderRoutes);

// 🚨 ERROR HANDLING
app.use(notFoundHandler);
app.use(errorHandler);

// 🚨 START SERVER
async function startServer() {
  try {
    // Initialize database connections
    await dbManager.initialize();
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔥 Database connections initialized successfully`);
      logger.info(`📍 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
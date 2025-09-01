"use strict";
/**
 * Professional CORS Configuration
 * Based on Latest Security Standards (August 2025)
 * Implements OWASP recommendations and modern best practices
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.preflightHandler = exports.corsErrorHandler = exports.customCorsMiddleware = exports.corsOptions = void 0;
const cors_1 = __importDefault(require("cors"));
// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isStaging = process.env.NODE_ENV === 'staging';
const isProduction = process.env.NODE_ENV === 'production' || !process.env.NODE_ENV;
/**
 * Allowed origins based on environment
 * Following Zero Trust security model
 */
const getAllowedOrigins = () => {
    const baseOrigins = [
        // Production domains
        'https://souk-el-syarat.web.app',
        'https://souk-el-syarat.firebaseapp.com',
        'https://www.souk-el-syarat.com', // Future custom domain
        'https://souk-el-syarat.com', // Future custom domain without www
    ];
    // Development origins (only in dev mode)
    const devOrigins = isDevelopment ? [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://[::1]:3000', // IPv6 localhost
        'http://[::1]:5173', // IPv6 localhost
    ] : [];
    // Staging origins
    const stagingOrigins = isStaging ? [
        'https://staging.souk-el-syarat.web.app',
        'https://beta.souk-el-syarat.com',
    ] : [];
    return [...baseOrigins, ...devOrigins, ...stagingOrigins];
};
/**
 * Dynamic origin validation function
 * Implements pattern matching for subdomains
 */
const originValidator = (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, Postman, server-to-server)
    if (!origin) {
        return callback(null, true);
    }
    const allowedOrigins = getAllowedOrigins();
    // Exact match check - return the specific origin
    if (allowedOrigins.includes(origin)) {
        return callback(null, origin);
    }
    // Pattern matching for preview/feature branches
    const allowedPatterns = [
        /^https:\/\/preview-[\w-]+\.souk-el-syarat\.web\.app$/, // Firebase preview URLs
        /^https:\/\/[\w-]+--souk-el-syarat\.web\.app$/, // Firebase preview channels
    ];
    const isAllowedPattern = allowedPatterns.some(pattern => pattern.test(origin));
    if (isAllowedPattern) {
        return callback(null, origin);
    }
    // Log rejected origins for monitoring
    console.warn(`CORS: Rejected origin: ${origin}`);
    // CRITICAL: Block the request completely for unauthorized origins
    return callback(null, false);
};
/**
 * Professional CORS configuration
 * Following OWASP CORS Security Cheat Sheet
 */
exports.corsOptions = {
    origin: originValidator,
    credentials: true, // Allow cookies and auth headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Request-ID',
        'X-Trace-ID',
        'X-API-Key',
        'X-Client-Version',
        'X-Platform',
        'Accept-Language',
        'Cache-Control',
        'Pragma',
    ],
    exposedHeaders: [
        'X-Total-Count',
        'X-Page-Count',
        'X-Request-ID',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'Content-Range',
        'ETag',
        'Link',
    ],
    maxAge: 86400, // 24 hours cache for preflight
    preflightContinue: false,
    optionsSuccessStatus: 204, // For legacy browser support
};
/**
 * Custom CORS middleware with additional security
 */
const customCorsMiddleware = () => {
    return (req, res, next) => {
        // CRITICAL: Override any default headers with secure values
        res.removeHeader('X-Powered-By');
        // Add security headers regardless of CORS
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block'); // Force XSS protection
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        // Add HSTS for production
        if (isProduction) {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }
        // Content Security Policy
        const cspDirectives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.googletagmanager.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://identitytoolkit.googleapis.com https://firestore.googleapis.com wss://firestore.googleapis.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests"
        ];
        res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
        // Add request ID for tracing
        const requestId = req.headers['x-request-id'] || generateRequestId();
        res.setHeader('X-Request-ID', requestId);
        next();
    };
};
exports.customCorsMiddleware = customCorsMiddleware;
/**
 * Generate unique request ID for tracing
 */
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * CORS Error Handler
 */
const corsErrorHandler = (err, req, res, next) => {
    if (err && err.message && err.message.includes('CORS')) {
        res.status(403).json({
            error: 'CORS Policy Violation',
            message: 'Origin not allowed by CORS policy',
            origin: req.headers.origin || 'unknown',
            timestamp: new Date().toISOString()
        });
    }
    else {
        next(err);
    }
};
exports.corsErrorHandler = corsErrorHandler;
/**
 * Preflight request handler for OPTIONS
 */
const preflightHandler = (req, res) => {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Max-Age', '86400');
    res.status(204).send();
};
exports.preflightHandler = preflightHandler;
exports.default = (0, cors_1.default)(exports.corsOptions);
//# sourceMappingURL=cors-config.js.map
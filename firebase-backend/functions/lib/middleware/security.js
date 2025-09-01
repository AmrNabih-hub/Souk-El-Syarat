"use strict";
/**
 * Advanced Security Middleware Suite
 * Based on OWASP Top 10 (2025) and Latest Security Standards
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySecurity = exports.securityAuditLogger = exports.requestSizeLimiter = exports.parameterPollutionPrevention = exports.mongoSanitizer = exports.securityHeaders = exports.inputSanitizer = exports.requestSignatureValidator = exports.apiKeyValidator = exports.strictRateLimiter = exports.createRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const hpp_1 = __importDefault(require("hpp"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * Rate Limiting Configuration
 * Implements adaptive rate limiting based on user behavior
 */
const createRateLimiter = (options = {}) => {
    const defaults = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true, // Return rate limit info in headers
        legacyHeaders: false,
        handler: (req, res) => {
            const rateLimitInfo = req.rateLimit;
            res.status(429).json({
                error: 'Rate limit exceeded',
                message: 'Too many requests. Please try again later.',
                retryAfter: rateLimitInfo === null || rateLimitInfo === void 0 ? void 0 : rateLimitInfo.resetTime,
                limit: rateLimitInfo === null || rateLimitInfo === void 0 ? void 0 : rateLimitInfo.limit,
                remaining: rateLimitInfo === null || rateLimitInfo === void 0 ? void 0 : rateLimitInfo.remaining,
                reset: new Date((rateLimitInfo === null || rateLimitInfo === void 0 ? void 0 : rateLimitInfo.resetTime) || Date.now()).toISOString()
            });
        },
        skip: (req) => {
            // Skip rate limiting for health checks
            return req.path === '/api/health';
        },
        keyGenerator: (req) => {
            var _a;
            // Use combination of IP and user ID if authenticated
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
            const ip = req.ip || req.connection.remoteAddress || 'unknown';
            return userId ? `${ip}:${userId}` : ip;
        }
    };
    return (0, express_rate_limit_1.default)(Object.assign(Object.assign({}, defaults), options));
};
exports.createRateLimiter = createRateLimiter;
/**
 * Strict rate limiter for sensitive endpoints
 */
exports.strictRateLimiter = (0, exports.createRateLimiter)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 requests per window for sensitive operations
    message: 'Too many attempts. Please try again later.'
});
/**
 * API Key validation for partner integrations
 */
const apiKeyValidator = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return next(); // API key is optional
    }
    // Validate API key format (UUID v4)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(apiKey)) {
        return res.status(401).json({
            error: 'Invalid API key format',
            code: 'auth/invalid-api-key'
        });
    }
    // In production, validate against database
    // For now, we'll accept valid format
    req.apiKey = apiKey;
    next();
};
exports.apiKeyValidator = apiKeyValidator;
/**
 * Request signing validation for high-security operations
 */
const requestSignatureValidator = (secret) => {
    return (req, res, next) => {
        const signature = req.headers['x-signature'];
        const timestamp = req.headers['x-timestamp'];
        if (!signature || !timestamp) {
            return res.status(401).json({
                error: 'Missing request signature',
                code: 'auth/missing-signature'
            });
        }
        // Check timestamp is within 5 minutes
        const requestTime = parseInt(timestamp);
        const currentTime = Date.now();
        if (Math.abs(currentTime - requestTime) > 5 * 60 * 1000) {
            return res.status(401).json({
                error: 'Request timestamp expired',
                code: 'auth/timestamp-expired'
            });
        }
        // Verify signature
        const payload = `${req.method}:${req.path}:${timestamp}:${JSON.stringify(req.body)}`;
        const expectedSignature = crypto_1.default
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
        if (signature !== expectedSignature) {
            return res.status(401).json({
                error: 'Invalid request signature',
                code: 'auth/invalid-signature'
            });
        }
        next();
    };
};
exports.requestSignatureValidator = requestSignatureValidator;
/**
 * Input sanitization middleware
 */
const inputSanitizer = (req, res, next) => {
    // Sanitize body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    // Sanitize query parameters
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    // Sanitize params
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
};
exports.inputSanitizer = inputSanitizer;
/**
 * Deep sanitization function
 */
function sanitizeObject(obj) {
    if (typeof obj === 'string') {
        // Remove potential XSS vectors
        return obj
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/[<>]/g, '')
            .trim();
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            // Prevent prototype pollution
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                continue;
            }
            sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
    }
    return obj;
}
/**
 * Security headers using Helmet
 */
exports.securityHeaders = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: [
                "'self'",
                "https://*.googleapis.com",
                "https://*.firebaseio.com",
                "wss://*.firebaseio.com"
            ],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
});
/**
 * MongoDB injection prevention
 */
exports.mongoSanitizer = (0, express_mongo_sanitize_1.default)({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`Potential MongoDB injection attempt blocked: ${key}`);
    }
});
/**
 * HTTP Parameter Pollution prevention
 */
exports.parameterPollutionPrevention = (0, hpp_1.default)({
    whitelist: ['sort', 'filter', 'page', 'limit'] // Allow these parameters to have arrays
});
/**
 * Request size limits
 */
exports.requestSizeLimiter = {
    json: '10mb',
    urlencoded: { extended: true, limit: '10mb' },
    raw: '10mb',
    text: '10mb'
};
/**
 * Security audit logger
 */
const securityAuditLogger = (req, res, next) => {
    var _a;
    const startTime = Date.now();
    // Log security-relevant information
    const auditLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid,
        apiKey: req.apiKey,
        origin: req.headers.origin,
        referer: req.headers.referer
    };
    // Log response
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const completeLog = Object.assign(Object.assign({}, auditLog), { statusCode: res.statusCode, duration, suspicious: res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429 });
        if (completeLog.suspicious) {
            console.warn('Security audit:', completeLog);
        }
    });
    next();
};
exports.securityAuditLogger = securityAuditLogger;
/**
 * Combined security middleware
 */
const applySecurity = (app) => {
    // Apply all security middlewares in order
    app.use(exports.securityHeaders);
    app.use(exports.mongoSanitizer);
    app.use(exports.parameterPollutionPrevention);
    app.use(exports.inputSanitizer);
    app.use(exports.apiKeyValidator);
    app.use(exports.securityAuditLogger);
    // Apply rate limiting
    app.use('/api/', (0, exports.createRateLimiter)());
    app.use('/api/auth/', exports.strictRateLimiter);
    app.use('/api/orders/', exports.strictRateLimiter);
    return app;
};
exports.applySecurity = applySecurity;
//# sourceMappingURL=security.js.map
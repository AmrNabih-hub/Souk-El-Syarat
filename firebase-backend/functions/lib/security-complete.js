"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictOriginCheck = void 0;
const ALLOWED_ORIGINS = [
    'https://souk-el-syarat.web.app',
    'https://souk-el-syarat.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
];
const strictOriginCheck = (req, res, next) => {
    const origin = req.headers.origin || req.headers.referer;
    if (!origin) {
        return next();
    }
    const isAllowed = ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
    if (!isAllowed) {
        console.warn(`BLOCKED: Unauthorized origin attempt from ${origin}`);
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Origin not allowed',
            code: 'CORS_ORIGIN_BLOCKED'
        });
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Request-ID');
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    next();
};
exports.strictOriginCheck = strictOriginCheck;
//# sourceMappingURL=security-complete.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = void 0;
const requestIdMiddleware = (req, res, next) => {
    // Generate request ID
    const requestId = req.headers['x-request-id'] ||
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Attach to request
    req.id = requestId;
    // FORCE header on response (multiple times to combat Cloud Run)
    res.setHeader('X-Request-ID', requestId);
    // Override send to ensure header persists
    const originalSend = res.send;
    res.send = function (data) {
        res.setHeader('X-Request-ID', requestId);
        return originalSend.call(this, data);
    };
    // Override json to ensure header persists  
    const originalJson = res.json;
    res.json = function (data) {
        res.setHeader('X-Request-ID', requestId);
        return originalJson.call(this, data);
    };
    next();
};
exports.requestIdMiddleware = requestIdMiddleware;
//# sourceMappingURL=request-id.js.map
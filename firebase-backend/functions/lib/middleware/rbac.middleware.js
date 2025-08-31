"use strict";
/**
 * Advanced Role-Based Access Control (RBAC) Middleware
 * Professional Security Implementation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSIONS = exports.ROLE_HIERARCHY = void 0;
exports.hasPermission = hasPermission;
exports.hasMinimumRole = hasMinimumRole;
exports.requirePermission = requirePermission;
exports.requireRole = requireRole;
exports.checkDynamicPermission = checkDynamicPermission;
exports.auditLog = auditLog;
exports.rateLimitByRole = rateLimitByRole;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// Role Hierarchy (higher number = more permissions)
exports.ROLE_HIERARCHY = {
    guest: 0,
    customer: 1,
    premium_customer: 2,
    inspector: 3,
    analytics_viewer: 4,
    customer_service: 5,
    content_manager: 6,
    vendor: 7,
    verified_vendor: 8,
    vendor_manager: 9,
    moderator: 10,
    finance_manager: 11,
    admin2: 12, // Chat admin
    admin: 13,
    super_admin: 14
};
// Permission Matrix
exports.PERMISSIONS = {
    // Super Admin - Full access
    super_admin: ['*'],
    // Admin - Almost full access
    admin: [
        'users.*',
        'products.*',
        'orders.*',
        'vendors.*',
        'chat.*',
        'analytics.*',
        'content.*',
        'moderation.*',
        'finance.view',
        'finance.process',
        'system.config'
    ],
    // Finance Manager
    finance_manager: [
        'finance.*',
        'orders.view',
        'orders.update',
        'vendors.payments',
        'analytics.financial',
        'reports.generate',
        'refunds.process',
        'subscriptions.manage'
    ],
    // Moderator
    moderator: [
        'products.moderate',
        'users.warn',
        'users.suspend',
        'content.moderate',
        'reviews.moderate',
        'reports.handle',
        'listings.hide',
        'chat.moderate'
    ],
    // Vendor Manager
    vendor_manager: [
        'vendors.*',
        'vendor_applications.*',
        'commissions.set',
        'vendor_categories.manage',
        'vendor_performance.view'
    ],
    // Content Manager
    content_manager: [
        'content.*',
        'categories.*',
        'promotions.*',
        'seo.*',
        'blog.*',
        'homepage.edit',
        'featured.manage'
    ],
    // Customer Service
    customer_service: [
        'orders.view',
        'orders.update',
        'customers.view',
        'returns.process',
        'notifications.send',
        'chat.support',
        'tickets.manage'
    ],
    // Verified Vendor
    verified_vendor: [
        'products.create',
        'products.update',
        'products.delete',
        'products.bulk',
        'orders.vendor_view',
        'analytics.vendor',
        'promotions.create',
        'direct_transfer.request'
    ],
    // Regular Vendor
    vendor: [
        'products.create',
        'products.update',
        'products.delete',
        'orders.vendor_view',
        'analytics.vendor_basic'
    ],
    // Inspector
    inspector: [
        'cars.inspect',
        'cars.verify',
        'cars.certify',
        'listings.flag',
        'technical_specs.update'
    ],
    // Premium Customer
    premium_customer: [
        'orders.create',
        'orders.view_own',
        'chat.create',
        'reviews.create',
        'premium_deals.access',
        'priority_support.access'
    ],
    // Regular Customer
    customer: [
        'orders.create',
        'orders.view_own',
        'chat.create',
        'reviews.create',
        'profile.update_own'
    ],
    // Analytics Viewer
    analytics_viewer: [
        'analytics.view',
        'reports.view',
        'trends.view',
        'exports.create'
    ],
    // Chat Admin (admin2)
    admin2: [
        'chat.*',
        'notifications.send',
        'users.view',
        'support_tickets.*'
    ]
};
// Check if user has specific permission
function hasPermission(role, permission) {
    const rolePermissions = exports.PERMISSIONS[role] || [];
    // Check for wildcard permission
    if (rolePermissions.includes('*'))
        return true;
    // Check for exact permission
    if (rolePermissions.includes(permission))
        return true;
    // Check for wildcard in permission category
    const permissionCategory = permission.split('.')[0];
    if (rolePermissions.includes(`${permissionCategory}.*`))
        return true;
    return false;
}
// Check role hierarchy
function hasMinimumRole(userRole, requiredRole) {
    const userLevel = exports.ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = exports.ROLE_HIERARCHY[requiredRole] || 0;
    return userLevel >= requiredLevel;
}
// Middleware to check specific permission
function requirePermission(permission) {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }
            // Get user role from database
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            const userRole = (userData === null || userData === void 0 ? void 0 : userData.role) || 'customer';
            // Check permission
            if (!hasPermission(userRole, permission)) {
                return res.status(403).json({
                    success: false,
                    error: `Permission denied. Required: ${permission}`,
                    userRole
                });
            }
            // Add role to request for later use
            req.userRole = userRole;
            req.permissions = exports.PERMISSIONS[userRole];
            next();
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: 'Permission check failed'
            });
        }
    };
}
// Middleware to require minimum role
function requireRole(minimumRole) {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }
            // Get user role from database
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            const userRole = (userData === null || userData === void 0 ? void 0 : userData.role) || 'customer';
            // Check role hierarchy
            if (!hasMinimumRole(userRole, minimumRole)) {
                return res.status(403).json({
                    success: false,
                    error: `Insufficient role. Required: ${minimumRole}`,
                    userRole
                });
            }
            // Add role to request
            req.userRole = userRole;
            req.permissions = exports.PERMISSIONS[userRole];
            next();
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: 'Role check failed'
            });
        }
    };
}
// Dynamic permission check
function checkDynamicPermission(resource, action) {
    return async (req, res, next) => {
        try {
            const user = req.user;
            const userRole = req.userRole;
            // Build permission string
            const permission = `${resource}.${action}`;
            // Special case: users can always access their own data
            if (resource === 'profile' && action === 'update_own' && req.params.userId === user.uid) {
                return next();
            }
            if (resource === 'orders' && action === 'view_own' && req.params.userId === user.uid) {
                return next();
            }
            // Check permission
            if (!hasPermission(userRole, permission)) {
                return res.status(403).json({
                    success: false,
                    error: `Permission denied for ${permission}`
                });
            }
            next();
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: 'Dynamic permission check failed'
            });
        }
    };
}
// Audit log middleware
async function auditLog(req, res, next) {
    try {
        const user = req.user;
        const userRole = req.userRole;
        // Log the action
        await db.collection('audit_logs').add({
            userId: (user === null || user === void 0 ? void 0 : user.uid) || 'anonymous',
            userRole,
            method: req.method,
            path: req.path,
            params: req.params,
            query: req.query,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        next();
    }
    catch (error) {
        // Don't block request if audit fails
        console.error('Audit log failed:', error);
        next();
    }
}
// Rate limiting by role
function rateLimitByRole() {
    const limits = {
        super_admin: 10000, // requests per hour
        admin: 5000,
        moderator: 2000,
        vendor: 1000,
        verified_vendor: 1500,
        premium_customer: 800,
        customer: 500,
        guest: 100
    };
    const requests = new Map();
    return (req, res, next) => {
        var _a;
        const userRole = req.userRole || 'guest';
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.uid) || req.ip;
        const key = `${userId}:${userRole}`;
        const now = Date.now();
        const hourAgo = now - 3600000;
        // Get user's requests
        const userRequests = requests.get(key) || [];
        // Filter requests within last hour
        const recentRequests = userRequests.filter((time) => time > hourAgo);
        // Check limit
        const limit = limits[userRole] || limits.guest;
        if (recentRequests.length >= limit) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                retryAfter: 3600 - Math.floor((now - recentRequests[0]) / 1000)
            });
        }
        // Add current request
        recentRequests.push(now);
        requests.set(key, recentRequests);
        // Clean old entries periodically
        if (Math.random() < 0.01) {
            for (const [k, v] of requests.entries()) {
                const filtered = v.filter((time) => time > hourAgo);
                if (filtered.length === 0) {
                    requests.delete(k);
                }
                else {
                    requests.set(k, filtered);
                }
            }
        }
        next();
    };
}
//# sourceMappingURL=rbac.middleware.js.map
/**
 * Advanced Role-Based Access Control (RBAC) Middleware
 * Professional Security Implementation
 */
import { Request, Response, NextFunction } from 'express';
export declare const ROLE_HIERARCHY: {
    guest: number;
    customer: number;
    premium_customer: number;
    inspector: number;
    analytics_viewer: number;
    customer_service: number;
    content_manager: number;
    vendor: number;
    verified_vendor: number;
    vendor_manager: number;
    moderator: number;
    finance_manager: number;
    admin2: number;
    admin: number;
    super_admin: number;
};
export declare const PERMISSIONS: {
    super_admin: string[];
    admin: string[];
    finance_manager: string[];
    moderator: string[];
    vendor_manager: string[];
    content_manager: string[];
    customer_service: string[];
    verified_vendor: string[];
    vendor: string[];
    inspector: string[];
    premium_customer: string[];
    customer: string[];
    analytics_viewer: string[];
    admin2: string[];
};
export declare function hasPermission(role: string, permission: string): boolean;
export declare function hasMinimumRole(userRole: string, requiredRole: string): boolean;
export declare function requirePermission(permission: string): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare function requireRole(minimumRole: string): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare function checkDynamicPermission(resource: string, action: string): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare function auditLog(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function rateLimitByRole(): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=rbac.middleware.d.ts.map
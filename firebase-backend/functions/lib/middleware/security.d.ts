/**
 * Advanced Security Middleware Suite
 * Based on OWASP Top 10 (2025) and Latest Security Standards
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Rate Limiting Configuration
 * Implements adaptive rate limiting based on user behavior
 */
export declare const createRateLimiter: (options?: {}) => import("express-rate-limit").RateLimitRequestHandler;
/**
 * Strict rate limiter for sensitive endpoints
 */
export declare const strictRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * API Key validation for partner integrations
 */
export declare const apiKeyValidator: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Request signing validation for high-security operations
 */
export declare const requestSignatureValidator: (secret: string) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
/**
 * Input sanitization middleware
 */
export declare const inputSanitizer: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Security headers using Helmet
 */
export declare const securityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
/**
 * MongoDB injection prevention
 */
export declare const mongoSanitizer: import("express").Handler;
/**
 * HTTP Parameter Pollution prevention
 */
export declare const parameterPollutionPrevention: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * Request size limits
 */
export declare const requestSizeLimiter: {
    json: string;
    urlencoded: {
        extended: boolean;
        limit: string;
    };
    raw: string;
    text: string;
};
/**
 * Security audit logger
 */
export declare const securityAuditLogger: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Combined security middleware
 */
export declare const applySecurity: (app: any) => any;
//# sourceMappingURL=security.d.ts.map
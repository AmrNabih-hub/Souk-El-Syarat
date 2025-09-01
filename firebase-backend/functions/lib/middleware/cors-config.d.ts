/**
 * Professional CORS Configuration
 * Based on Latest Security Standards (August 2025)
 * Implements OWASP recommendations and modern best practices
 */
import cors from 'cors';
import { Request, Response } from 'express';
/**
 * Professional CORS configuration
 * Following OWASP CORS Security Cheat Sheet
 */
export declare const corsOptions: cors.CorsOptions;
/**
 * Custom CORS middleware with additional security
 */
export declare const customCorsMiddleware: () => (req: Request, res: Response, next: Function) => void;
/**
 * CORS Error Handler
 */
export declare const corsErrorHandler: (err: Error, req: Request, res: Response, next: Function) => void;
/**
 * Preflight request handler for OPTIONS
 */
export declare const preflightHandler: (req: Request, res: Response) => void;
declare const _default: (req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
export default _default;
//# sourceMappingURL=cors-config.d.ts.map
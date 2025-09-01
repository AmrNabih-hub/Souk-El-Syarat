import { Request, Response, NextFunction } from 'express';
export declare const requestIdMiddleware: (req: Request & {
    id?: string;
}, res: Response, next: NextFunction) => void;
//# sourceMappingURL=request-id.d.ts.map
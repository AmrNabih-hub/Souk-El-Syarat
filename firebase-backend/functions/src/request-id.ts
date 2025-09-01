import { Request, Response, NextFunction } from 'express';

export const requestIdMiddleware = (req: Request & { id?: string }, res: Response, next: NextFunction) => {
  // Generate request ID
  const requestId = req.headers['x-request-id'] as string || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Attach to request
  req.id = requestId;
  
  // FORCE header on response (multiple times to combat Cloud Run)
  res.setHeader('X-Request-ID', requestId);
  
  // Override send to ensure header persists
  const originalSend = res.send;
  res.send = function(data: any) {
    res.setHeader('X-Request-ID', requestId);
    return originalSend.call(this, data);
  };
  
  // Override json to ensure header persists  
  const originalJson = res.json;
  res.json = function(data: any) {
    res.setHeader('X-Request-ID', requestId);
    return originalJson.call(this, data);
  };
  
  next();
};

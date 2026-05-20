import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function(body) {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || body?.length || 0,
    };

    // Log different levels based on status code
    if (res.statusCode >= 500) {
      console.error('🔴 ERROR:', JSON.stringify(logData, null, 2));
    } else if (res.statusCode >= 400) {
      console.warn('🟡 WARNING:', JSON.stringify(logData, null, 2));
    } else if (process.env.NODE_ENV === 'development') {
      console.log('🟢 INFO:', JSON.stringify(logData, null, 2));
    }

    return originalSend.call(this, body);
  };

  next();
};
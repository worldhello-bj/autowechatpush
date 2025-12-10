import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/index.js';

// Generate unique request ID
export const generateRequestId = (): string => {
  return uuidv4();
};

// Format API response
export const formatResponse = <T>(
  success: boolean,
  data?: T,
  error?: { code: string; message: string; details?: unknown },
  requestId?: string
): ApiResponse<T> => {
  return {
    success,
    data,
    error,
    meta: {
      requestId: requestId || generateRequestId(),
      timestamp: new Date().toISOString(),
    },
  };
};

// Request ID middleware
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

// Error response helper
export const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
) => {
  const requestId = (res.req as Request).requestId || generateRequestId();
  res.status(statusCode).json(formatResponse(false, undefined, { code, message, details }, requestId));
};

// Success response helper
export const sendSuccess = <T>(res: Response, data: T, statusCode = 200) => {
  const requestId = (res.req as Request).requestId || generateRequestId();
  res.status(statusCode).json(formatResponse(true, data, undefined, requestId));
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        userId: string;
        email: string;
        role: 'user' | 'admin';
      };
    }
  }
}

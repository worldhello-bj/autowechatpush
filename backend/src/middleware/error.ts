import { Request, Response, NextFunction } from 'express';
import { sendError, createLogger } from '../utils/index.js';

const logger = createLogger('error-handler');

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Unhandled error', {
    requestId: req.requestId,
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack,
  });

  // Handle known API errors
  if (error instanceof ApiError) {
    return sendError(res, error.statusCode, error.code, error.message, error.details);
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && 'body' in error) {
    return sendError(res, 400, 'INVALID_JSON', 'Invalid JSON in request body');
  }

  // Handle all other errors
  const isDev = process.env.NODE_ENV === 'development';
  return sendError(
    res,
    500,
    'INTERNAL_ERROR',
    isDev ? error.message : 'An unexpected error occurred',
    isDev ? error.stack : undefined
  );
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  return sendError(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`);
};

/**
 * Async wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

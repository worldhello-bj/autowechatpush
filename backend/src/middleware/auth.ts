import { Request, Response, NextFunction } from 'express';
import { verifyToken, sendError, createLogger } from '../utils/index.js';

const logger = createLogger('auth-guard');

/**
 * Authentication middleware
 * Verifies JWT access token and injects user context into request
 */
export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Missing or invalid authorization header', { 
      requestId: req.requestId,
      path: req.path 
    });
    return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required. Please provide a valid access token.');
  }
  
  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  const payload = verifyToken(token);
  
  if (!payload) {
    logger.warn('Invalid or expired token', { 
      requestId: req.requestId,
      path: req.path 
    });
    return sendError(res, 401, 'INVALID_TOKEN', 'Invalid or expired token. Please login again.');
  }
  
  if (payload.type !== 'access') {
    logger.warn('Wrong token type used', { 
      requestId: req.requestId,
      tokenType: payload.type 
    });
    return sendError(res, 401, 'INVALID_TOKEN_TYPE', 'Please use an access token, not a refresh token.');
  }
  
  // Inject user context into request
  req.user = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };
  
  logger.debug('User authenticated', { 
    requestId: req.requestId,
    userId: payload.userId 
  });
  
  next();
};

/**
 * Optional authentication middleware
 * Allows both authenticated and unauthenticated requests
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Continue without authentication
  }
  
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  
  if (payload && payload.type === 'access') {
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  }
  
  next();
};

/**
 * Admin-only middleware
 * Must be used after authGuard
 */
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required.');
  }
  
  if (req.user.role !== 'admin') {
    logger.warn('Non-admin user attempted admin action', { 
      requestId: req.requestId,
      userId: req.user.userId 
    });
    return sendError(res, 403, 'FORBIDDEN', 'Admin access required.');
  }
  
  next();
};

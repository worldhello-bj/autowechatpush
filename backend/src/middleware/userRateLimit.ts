import { Request, Response, NextFunction } from 'express';
import { sendError, createLogger } from '../utils/index.js';

const logger = createLogger('user-rate-limit');

// In-memory rate limit storage (use Redis in production)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const userRateLimits: Map<string, RateLimitEntry> = new Map();
const ipRateLimits: Map<string, RateLimitEntry> = new Map();

// Default rate limit configuration
interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
}

// Different limits for different user types
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  authenticated: {
    windowMs: 60000,     // 1 minute
    maxRequests: 60,     // 60 requests per minute for logged-in users
  },
  unauthenticated: {
    windowMs: 60000,     // 1 minute
    maxRequests: 20,     // 20 requests per minute for anonymous users
  },
  ai_generation: {
    windowMs: 60000,     // 1 minute
    maxRequests: 10,     // 10 AI generations per minute
  },
  upload: {
    windowMs: 60000,     // 1 minute
    maxRequests: 20,     // 20 uploads per minute
  },
};

/**
 * Get the rate limit key for a request
 */
const getRateLimitKey = (req: Request, type: string): string => {
  const userId = req.user?.userId;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  if (userId) {
    return `user:${userId}:${type}`;
  }
  return `ip:${ip}:${type}`;
};

/**
 * Check and update rate limit
 */
const checkRateLimit = (key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetTime: number } => {
  const now = Date.now();
  let entry = userRateLimits.get(key);
  
  // Reset if window has passed
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }
  
  // Increment count
  entry.count += 1;
  userRateLimits.set(key, entry);
  
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const allowed = entry.count <= config.maxRequests;
  
  return { allowed, remaining, resetTime: entry.resetTime };
};

/**
 * Create a rate limiting middleware for a specific type
 */
export const createUserRateLimit = (type: keyof typeof RATE_LIMITS) => {
  const config = RATE_LIMITS[type] || RATE_LIMITS.authenticated;
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Determine which config to use based on authentication
    let effectiveConfig = config;
    if (!req.user && type === 'authenticated') {
      effectiveConfig = RATE_LIMITS.unauthenticated;
    }
    
    const key = getRateLimitKey(req, type);
    const { allowed, remaining, resetTime } = checkRateLimit(key, effectiveConfig);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', effectiveConfig.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
    
    if (!allowed) {
      logger.warn('Rate limit exceeded', { 
        key, 
        type,
        requestId: req.requestId 
      });
      
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      
      return sendError(
        res, 
        429, 
        'RATE_LIMIT_EXCEEDED', 
        `Too many requests. Please try again in ${retryAfter} seconds.`
      );
    }
    
    next();
  };
};

/**
 * Rate limit middleware for AI generation endpoints
 */
export const aiRateLimit = createUserRateLimit('ai_generation');

/**
 * Rate limit middleware for upload endpoints
 */
export const uploadRateLimit = createUserRateLimit('upload');

/**
 * General authenticated rate limit
 */
export const userRateLimit = createUserRateLimit('authenticated');

/**
 * Clear rate limits for a user (used for testing or admin actions)
 */
export const clearUserRateLimits = (userId: string): void => {
  for (const [key] of userRateLimits) {
    if (key.startsWith(`user:${userId}:`)) {
      userRateLimits.delete(key);
    }
  }
  logger.info('User rate limits cleared', { userId });
};

/**
 * Get current rate limit status for a user
 */
export const getUserRateLimitStatus = (userId: string, type: string = 'authenticated'): {
  count: number;
  limit: number;
  remaining: number;
  resetTime: Date | null;
} => {
  const key = `user:${userId}:${type}`;
  const config = RATE_LIMITS[type as keyof typeof RATE_LIMITS] || RATE_LIMITS.authenticated;
  const entry = userRateLimits.get(key);
  
  if (!entry || Date.now() > entry.resetTime) {
    return {
      count: 0,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: null,
    };
  }
  
  return {
    count: entry.count,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: new Date(entry.resetTime),
  };
};

import { Request, Response } from 'express';
import { sendSuccess, sendError, createLogger } from '../utils/index.js';
import { 
  registerUser, 
  loginUser, 
  loginWithWeChat,
  refreshAccessToken, 
  logoutUser,
  getUserById,
  getUserQuotaStatus
} from '../services/index.js';
import { LoginRequest, RegisterRequest } from '../types/index.js';

const logger = createLogger('auth');

/**
 * User registration
 * POST /api/v1/auth/register
 */
export const register = async (req: Request, res: Response) => {
  try {
    const data = req.body as RegisterRequest;
    logger.info('Registration request', { email: data.email, requestId: req.requestId });
    
    const result = await registerUser(data);
    sendSuccess(res, result, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    logger.error('Registration failed', { error: message, requestId: req.requestId });
    
    if (message.includes('already registered')) {
      return sendError(res, 409, 'EMAIL_EXISTS', message);
    }
    
    sendError(res, 500, 'REGISTRATION_FAILED', message);
  }
};

/**
 * User login
 * POST /api/v1/auth/token
 */
export const login = async (req: Request, res: Response) => {
  try {
    const data = req.body as LoginRequest;
    logger.info('Login request', { email: data.email, requestId: req.requestId });
    
    const result = await loginUser(data);
    sendSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    logger.warn('Login failed', { error: message, requestId: req.requestId });
    
    sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
};

/**
 * WeChat Login
 * POST /api/v1/auth/wechat
 */
export const wechatLogin = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
        return sendError(res, 400, 'MISSING_CODE', 'WeChat code is required');
    }
    logger.info('WeChat login request', { requestId: req.requestId });
    
    const result = await loginWithWeChat(code);
    sendSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'WeChat login failed';
    logger.warn('WeChat login failed', { error: message, requestId: req.requestId });
    
    sendError(res, 500, 'WECHAT_AUTH_FAILED', message);
  }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    logger.info('Token refresh request', { requestId: req.requestId });
    
    const result = await refreshAccessToken(refreshToken);
    sendSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    logger.warn('Token refresh failed', { error: message, requestId: req.requestId });
    
    sendError(res, 401, 'REFRESH_FAILED', message);
  }
};

/**
 * User logout
 * POST /api/v1/auth/logout
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    logger.info('Logout request', { requestId: req.requestId });
    
    logoutUser(refreshToken);
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout failed', { error, requestId: req.requestId });
    sendSuccess(res, { message: 'Logged out' }); // Always return success for logout
  }
};

/**
 * Get current user info
 * GET /api/v1/auth/me
 */
export const me = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }
    
    const user = getUserById(req.user.userId);
    if (!user) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
    }
    
    // Get real-time quota status from quota service
    const quotaStatus = getUserQuotaStatus(req.user.userId);
    if (!quotaStatus) {
      logger.warn('Quota status not found, user may need quota initialization', { userId: req.user.userId });
    }
    const remainingQuota = quotaStatus ? quotaStatus.remainingQuota : user.quota;
    
    sendSuccess(res, {
      id: user.id,
      email: user.email,
      name: user.name,
      quota: remainingQuota,
      role: user.role,
    });
  } catch (error) {
    logger.error('Get user failed', { error, requestId: req.requestId });
    sendError(res, 500, 'SERVER_ERROR', 'Failed to get user info');
  }
};

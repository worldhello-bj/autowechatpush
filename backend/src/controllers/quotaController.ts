import { Request, Response } from 'express';
import { sendSuccess, sendError, createLogger } from '../utils/index.js';
import { 
  getUserQuotaStatus,
  checkQuota,
  addQuotaCredits,
  upgradePlan,
  getUserUsageHistory,
  getUserUsageStats,
  getApiConfigStatus,
  getApiKey,
} from '../services/index.js';
import { updateQuotaSchema, QuotaPlan } from '../types/index.js';

const logger = createLogger('quota');

/**
 * Get current user's quota status
 * GET /api/v1/user/quota
 */
export const getQuotaStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const status = getUserQuotaStatus(req.user.userId);
    
    if (!status) {
      return sendError(res, 404, 'NOT_FOUND', 'Quota status not found');
    }

    logger.debug('Quota status retrieved', { 
      userId: req.user.userId,
      requestId: req.requestId 
    });

    sendSuccess(res, status);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get quota status';
    logger.error('Get quota status failed', { 
      error: message, 
      requestId: req.requestId 
    });
    sendError(res, 500, 'QUOTA_ERROR', message);
  }
};

/**
 * Check if user can perform an action (pre-flight check)
 * GET /api/v1/user/quota/check
 */
export const checkUserQuota = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const credits = parseInt(req.query.credits as string) || 1;
    const result = checkQuota(req.user.userId, credits);

    sendSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check quota';
    logger.error('Check quota failed', { 
      error: message, 
      requestId: req.requestId 
    });
    sendError(res, 500, 'QUOTA_ERROR', message);
  }
};

/**
 * Add credits to user quota (admin only or webhook)
 * POST /api/v1/user/quota/credits
 */
export const addCredits = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    // Only admins can add credits
    if (req.user.role !== 'admin') {
      return sendError(res, 403, 'FORBIDDEN', 'Admin access required');
    }

    const parseResult = updateQuotaSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 400, 'INVALID_REQUEST', 'Invalid request body');
    }

    const { change, reason } = parseResult.data;
    const targetUserId = req.body.userId || req.user.userId;

    const newTotal = addQuotaCredits(targetUserId, change, reason);

    logger.info('Credits added', { 
      targetUserId,
      change,
      reason,
      newTotal,
      adminId: req.user.userId,
      requestId: req.requestId 
    });

    sendSuccess(res, { 
      userId: targetUserId,
      creditsAdded: change,
      newTotal,
      reason 
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add credits';
    logger.error('Add credits failed', { 
      error: message, 
      requestId: req.requestId 
    });
    sendError(res, 500, 'QUOTA_ERROR', message);
  }
};

/**
 * Upgrade user's plan (admin only)
 * POST /api/v1/user/quota/upgrade
 */
export const upgradeUserPlan = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    // Only admins can upgrade plans
    if (req.user.role !== 'admin') {
      return sendError(res, 403, 'FORBIDDEN', 'Admin access required');
    }

    const { userId, plan, expiryDate } = req.body;

    if (!userId || !plan || !Object.values(QuotaPlan).includes(plan)) {
      return sendError(res, 400, 'INVALID_REQUEST', 'Invalid userId or plan');
    }

    const newStatus = upgradePlan(
      userId,
      plan as QuotaPlan,
      expiryDate ? new Date(expiryDate) : undefined
    );

    if (!newStatus) {
      return sendError(res, 404, 'NOT_FOUND', 'User not found');
    }

    logger.info('Plan upgraded', { 
      userId,
      newPlan: plan,
      adminId: req.user.userId,
      requestId: req.requestId 
    });

    sendSuccess(res, newStatus);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upgrade plan';
    logger.error('Upgrade plan failed', { 
      error: message, 
      requestId: req.requestId 
    });
    sendError(res, 500, 'QUOTA_ERROR', message);
  }
};

/**
 * Get usage history for current user
 * GET /api/v1/user/quota/history
 */
export const getUsageHistory = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const history = getUserUsageHistory(req.user.userId, Math.min(limit, 100));

    sendSuccess(res, { history });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get usage history';
    logger.error('Get usage history failed', { 
      error: message, 
      requestId: req.requestId 
    });
    sendError(res, 500, 'QUOTA_ERROR', message);
  }
};

/**
 * Get aggregated usage stats for current user
 * GET /api/v1/user/quota/stats
 */
export const getUsageStats = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const period = (req.query.period as 'day' | 'week' | 'month') || 'month';
    const stats = getUserUsageStats(req.user.userId, period);

    sendSuccess(res, { period, ...stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get usage stats';
    logger.error('Get usage stats failed', { 
      error: message, 
      requestId: req.requestId 
    });
    sendError(res, 500, 'QUOTA_ERROR', message);
  }
};

/**
 * Get API configuration status (whether APIs are configured, not the actual keys)
 * GET /api/v1/user/api-config
 */
export const getApiConfigStatusHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const status = getApiConfigStatus();
    
    logger.debug('API config status retrieved', { 
      userId: req.user.userId,
      requestId: req.requestId 
    });

    sendSuccess(res, status);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get API config status';
    logger.error('Get API config status failed', { 
      error: message, 
      requestId: req.requestId 
    });
    sendError(res, 500, 'CONFIG_ERROR', message);
  }
};

/**
 * Get specific API key for user (returns actual key for authenticated users to use AI services)
 * GET /api/v1/user/api-key/:type
 */
export const getApiKeyHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const keyType = req.params.type as 'google' | 'deepseek' | 'dashscope' | 'wechat';
    
    if (!['google', 'deepseek', 'dashscope', 'wechat'].includes(keyType)) {
      return sendError(res, 400, 'INVALID_KEY_TYPE', 'Invalid API key type');
    }

    const key = getApiKey(keyType);
    
    if (!key) {
      return sendError(res, 404, 'KEY_NOT_CONFIGURED', `${keyType} API key is not configured`);
    }

    logger.debug('API key retrieved', { 
      userId: req.user.userId,
      keyType,
      requestId: req.requestId 
    });

    sendSuccess(res, { key });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get API key';
    logger.error('Get API key failed', { 
      error: message, 
      requestId: req.requestId 
    });
    sendError(res, 500, 'KEY_ERROR', message);
  }
};

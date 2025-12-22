import { Router } from 'express';
import { 
  getQuotaStatus,
  checkUserQuota,
  addCredits,
  upgradeUserPlan,
  getUsageHistory,
  getUsageStats,
  getApiConfigStatusHandler,
} from '../controllers/index.js';
import { authGuard } from '../middleware/index.js';

const router = Router();

/**
 * @route GET /api/v1/user/quota
 * @desc Get current user's quota status
 * @access Private
 */
router.get('/quota', authGuard, getQuotaStatus);

/**
 * @route GET /api/v1/user/quota/check
 * @desc Pre-flight check if user can perform an action
 * @access Private
 */
router.get('/quota/check', authGuard, checkUserQuota);

/**
 * @route POST /api/v1/user/quota/credits
 * @desc Add credits to user quota (admin only)
 * @access Admin
 */
router.post('/quota/credits', authGuard, addCredits);

/**
 * @route POST /api/v1/user/quota/upgrade
 * @desc Upgrade user's plan (admin only)
 * @access Admin
 */
router.post('/quota/upgrade', authGuard, upgradeUserPlan);

/**
 * @route GET /api/v1/user/quota/history
 * @desc Get usage history for current user
 * @access Private
 */
router.get('/quota/history', authGuard, getUsageHistory);

/**
 * @route GET /api/v1/user/quota/stats
 * @desc Get aggregated usage stats for current user
 * @access Private
 */
router.get('/quota/stats', authGuard, getUsageStats);

/**
 * @route GET /api/v1/user/api-config
 * @desc Get API configuration status (whether APIs are configured, not the actual keys)
 * @access Private
 * 
 * NOTE: API keys are never exposed to users. All AI operations should go through
 * backend proxy endpoints (e.g., /api/v1/ai/generate) which use the keys internally.
 */
router.get('/api-config', authGuard, getApiConfigStatusHandler);

export default router;

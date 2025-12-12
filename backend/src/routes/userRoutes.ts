import { Router } from 'express';
import { 
  getQuotaStatus,
  checkUserQuota,
  addCredits,
  upgradeUserPlan,
  getUsageHistory,
  getUsageStats,
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

export default router;

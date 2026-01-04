import { Router } from 'express';
import { generate, chatStream, getQuota, aiHelper, getFeaturesAvailability, importFromUrl } from '../controllers/index.js';
import { validate, optionalAuth, authGuard, aiRateLimit } from '../middleware/index.js';
import { aiChatRequestSchema } from '../types/index.js';

const router = Router();

/**
 * @route POST /api/v1/ai/generate
 * @desc Generate article (non-streaming)
 * @access Public (with optional auth for quota tracking)
 */
router.post('/generate', optionalAuth, aiRateLimit, validate(aiChatRequestSchema), generate);

/**
 * @route POST /api/v1/ai/chat/stream
 * @desc Generate article with SSE streaming
 * @access Public (with optional auth for quota tracking)
 */
router.post('/chat/stream', optionalAuth, aiRateLimit, validate(aiChatRequestSchema), chatStream);

/**
 * @route POST /api/v1/ai/helper
 * @desc AI helper functions (titles, summary, keywords, etc.)
 * @access Public (with optional auth for quota tracking)
 */
router.post('/helper', optionalAuth, aiRateLimit, aiHelper);

/**
 * @route POST /api/v1/ai/import-url
 * @desc Import article from WeChat URL
 * @access Public (with optional auth for quota tracking)
 */
router.post('/import-url', optionalAuth, aiRateLimit, importFromUrl);

/**
 * @route GET /api/v1/ai/features
 * @desc Get AI features availability based on backend configuration
 * @access Public
 */
router.get('/features', getFeaturesAvailability);

/**
 * @route GET /api/v1/ai/quota
 * @desc Get user's AI quota status
 * @access Private
 */
router.get('/quota', authGuard, getQuota);

export default router;

import { Router } from 'express';
import { generate, chatStream, getQuota, aiHelper } from '../controllers/index.js';
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
 * @route GET /api/v1/ai/quota
 * @desc Get user's AI quota status
 * @access Private
 */
router.get('/quota', authGuard, getQuota);

export default router;

import { Router } from 'express';
import { generate, chatStream, getQuota } from '../controllers/index.js';
import { validate, optionalAuth, authGuard } from '../middleware/index.js';
import { aiChatRequestSchema } from '../types/index.js';

const router = Router();

/**
 * @route POST /api/v1/ai/generate
 * @desc Generate article (non-streaming)
 * @access Public (with optional auth for quota tracking)
 */
router.post('/generate', optionalAuth, validate(aiChatRequestSchema), generate);

/**
 * @route POST /api/v1/ai/chat/stream
 * @desc Generate article with SSE streaming
 * @access Public (with optional auth for quota tracking)
 */
router.post('/chat/stream', optionalAuth, validate(aiChatRequestSchema), chatStream);

/**
 * @route GET /api/v1/ai/quota
 * @desc Get user's AI quota status
 * @access Private
 */
router.get('/quota', authGuard, getQuota);

export default router;

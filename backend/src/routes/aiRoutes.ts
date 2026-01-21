import { Router } from 'express';
import { generate, chatStream, getQuota, aiHelper, getFeaturesAvailability, importFromUrl, rewriteArticle } from '../controllers/index.js';
import { validate, authGuard, aiRateLimit } from '../middleware/index.js';
import { aiChatRequestSchema } from '../types/index.js';

const router = Router();

/**
 * @route POST /api/v1/ai/generate
 * @desc Generate article (non-streaming)
 * @access Private (requires authentication)
 */
router.post('/generate', authGuard, aiRateLimit, validate(aiChatRequestSchema), generate);

/**
 * @route POST /api/v1/ai/chat/stream
 * @desc Generate article with SSE streaming
 * @access Private (requires authentication)
 */
router.post('/chat/stream', authGuard, aiRateLimit, validate(aiChatRequestSchema), chatStream);

/**
 * @route POST /api/v1/ai/helper
 * @desc AI helper functions (titles, summary, keywords, etc.)
 * @access Private (requires authentication)
 */
router.post('/helper', authGuard, aiRateLimit, aiHelper);

/**
 * @route POST /api/v1/ai/rewrite
 * @desc Rewrite article content based on DOM structure
 * @access Private (requires authentication)
 */
router.post('/rewrite', authGuard, aiRateLimit, rewriteArticle);

/**
 * @route POST /api/v1/ai/import-url
 * @desc Import article from WeChat URL
 * @access Private (requires authentication)
 */
router.post('/import-url', authGuard, aiRateLimit, importFromUrl);

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

import { Router } from 'express';
import { recordEvent } from '../controllers/index.js';
import { authGuard } from '../middleware/index.js';

const router = Router();

/**
 * @route POST /api/v1/analytics/event
 * @desc Track a user event
 * @access Authenticated users
 */
router.post('/event', authGuard, recordEvent);

export default router;

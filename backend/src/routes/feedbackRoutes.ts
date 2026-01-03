import { Router } from 'express';
import { 
  submitFeedback,
  getMyFeedbacks,
  getFeedback,
} from '../controllers/index.js';
import { authGuard } from '../middleware/index.js';

const router = Router();

// All feedback routes require authentication
router.use(authGuard);

/**
 * @route POST /api/v1/feedback
 * @desc Submit a new feedback
 * @access Authenticated users
 */
router.post('/', submitFeedback);

/**
 * @route GET /api/v1/feedback
 * @desc Get user's own feedbacks
 * @access Authenticated users
 */
router.get('/', getMyFeedbacks);

/**
 * @route GET /api/v1/feedback/:id
 * @desc Get specific feedback by ID
 * @access Authenticated users (own feedback only) or Admin
 */
router.get('/:id', getFeedback);

export default router;

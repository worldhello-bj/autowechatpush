import { Router } from 'express';
import { stitchImages } from '../controllers/index.js';

const router = Router();

/**
 * @route POST /api/v1/utility/stitch-images
 * @desc Stitch multiple images into a single HTML section
 * @access Public (no auth required for this utility endpoint)
 */
router.post('/stitch-images', stitchImages);

export default router;

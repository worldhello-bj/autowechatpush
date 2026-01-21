import { Router } from 'express';
import { stitchImages, getWatermark } from '../controllers/index.js';

const router = Router();

/**
 * @route POST /api/v1/utility/stitch-images
 * @desc Stitch multiple images into a single HTML section
 * @access Public (no auth required for this utility endpoint)
 */
router.post('/stitch-images', stitchImages);

/**
 * @route GET /api/v1/utility/watermark
 * @desc Get system watermark
 * @access Public
 */
router.get('/watermark', getWatermark);

export default router;

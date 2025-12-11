import { Router } from 'express';
import { 
  uploadMaterial, 
  getPresignedUrl, 
  getMaterial, 
  listMaterials, 
  removeMaterial 
} from '../controllers/index.js';
import { authGuard } from '../middleware/index.js';

const router = Router();

/**
 * @route POST /api/v1/materials
 * @desc Upload a material (image, video, GIF, SVG)
 * @access Private
 */
router.post('/', authGuard, uploadMaterial);

/**
 * @route POST /api/v1/materials/presign
 * @desc Get a presigned URL for direct upload (large files)
 * @access Private
 */
router.post('/presign', authGuard, getPresignedUrl);

/**
 * @route GET /api/v1/materials
 * @desc List user's materials with optional type filter
 * @access Private
 */
router.get('/', authGuard, listMaterials);

/**
 * @route GET /api/v1/materials/:id
 * @desc Get a specific material by ID
 * @access Private
 */
router.get('/:id', authGuard, getMaterial);

/**
 * @route DELETE /api/v1/materials/:id
 * @desc Delete a material
 * @access Private
 */
router.delete('/:id', authGuard, removeMaterial);

export default router;

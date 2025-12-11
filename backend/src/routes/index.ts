import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import aiRoutes from './aiRoutes.js';
import materialRoutes from './materialRoutes.js';
import userRoutes from './userRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/ai', aiRoutes);
router.use('/materials', materialRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);

export default router;

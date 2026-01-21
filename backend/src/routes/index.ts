import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import aiRoutes from './aiRoutes.js';
import materialRoutes from './materialRoutes.js';
import userRoutes from './userRoutes.js';
import adminRoutes from './adminRoutes.js';
import utilityRoutes from './utilityRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import feedbackRoutes from './feedbackRoutes.js';
import templateRoutes from './templateRoutes.js';
import draftRoutes from './draftRoutes.js';

const router = Router();

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/ai', aiRoutes);
router.use('/materials', materialRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);
router.use('/utility', utilityRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/templates', templateRoutes);
router.use('/drafts', draftRoutes);

export default router;

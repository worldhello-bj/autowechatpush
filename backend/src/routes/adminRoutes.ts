import { Router } from 'express';
import { 
  getUsers,
  getUser,
  createUser,
  changeUserRole,
  changeUserQuota,
  resetUserPassword,
  removeUser,
  getDashboardStats,
  getConfig,
  patchConfig,
  getAnalytics,
  getUserAnalytics,
  getUserEventHistory,
  getAllEvents,
} from '../controllers/index.js';
import { authGuard, adminOnly } from '../middleware/index.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authGuard);
router.use(adminOnly);

/**
 * @route GET /api/v1/admin/stats
 * @desc Get admin dashboard statistics
 * @access Admin only
 */
router.get('/stats', getDashboardStats);

/**
 * @route GET /api/v1/admin/config
 * @desc Get API configuration
 * @access Admin only
 */
router.get('/config', getConfig);

/**
 * @route PATCH /api/v1/admin/config
 * @desc Update API configuration
 * @access Admin only
 */
router.patch('/config', patchConfig);

/**
 * @route GET /api/v1/admin/users
 * @desc List all users with pagination
 * @access Admin only
 */
router.get('/users', getUsers);

/**
 * @route POST /api/v1/admin/users
 * @desc Create a new user
 * @access Admin only
 */
router.post('/users', createUser);

/**
 * @route GET /api/v1/admin/users/:id
 * @desc Get user by ID
 * @access Admin only
 */
router.get('/users/:id', getUser);

/**
 * @route PATCH /api/v1/admin/users/:id/role
 * @desc Update user role
 * @access Admin only
 */
router.patch('/users/:id/role', changeUserRole);

/**
 * @route PATCH /api/v1/admin/users/:id/quota
 * @desc Update user quota
 * @access Admin only
 */
router.patch('/users/:id/quota', changeUserQuota);

/**
 * @route PATCH /api/v1/admin/users/:id/password
 * @desc Reset user password
 * @access Admin only
 */
router.patch('/users/:id/password', resetUserPassword);

/**
 * @route DELETE /api/v1/admin/users/:id
 * @desc Delete user
 * @access Admin only
 */
router.delete('/users/:id', removeUser);

/**
 * @route GET /api/v1/admin/analytics
 * @desc Get analytics summary
 * @access Admin only
 */
router.get('/analytics', getAnalytics);

/**
 * @route GET /api/v1/admin/analytics/events
 * @desc Get all events with pagination
 * @access Admin only
 */
router.get('/analytics/events', getAllEvents);

/**
 * @route GET /api/v1/admin/analytics/users/:userId
 * @desc Get user activity summary
 * @access Admin only
 */
router.get('/analytics/users/:userId', getUserAnalytics);

/**
 * @route GET /api/v1/admin/analytics/users/:userId/events
 * @desc Get user event history
 * @access Admin only
 */
router.get('/analytics/users/:userId/events', getUserEventHistory);

export default router;

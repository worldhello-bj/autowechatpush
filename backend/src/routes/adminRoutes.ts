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

export default router;

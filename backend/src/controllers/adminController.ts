import { Request, Response } from 'express';
import { sendSuccess, sendError, createLogger } from '../utils/index.js';
import { 
  listAllUsers,
  getUserById,
  updateUserRole,
  updateUserQuota,
  deleteUser,
  updateUserPassword,
  createUserByAdmin,
  getUserStats,
} from '../services/index.js';

const logger = createLogger('admin');

/**
 * List all users
 * GET /api/v1/admin/users
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    
    logger.info('Admin listing users', { 
      adminId: req.user?.userId,
      page,
      limit,
      requestId: req.requestId 
    });
    
    const result = listAllUsers(page, limit);
    sendSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list users';
    logger.error('Failed to list users', { error: message, requestId: req.requestId });
    sendError(res, 500, 'LIST_USERS_FAILED', message);
  }
};

/**
 * Get user by ID
 * GET /api/v1/admin/users/:id
 */
export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = getUserById(id);
    
    if (!user) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
    }
    
    sendSuccess(res, user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    logger.error('Failed to get user', { error: message, requestId: req.requestId });
    sendError(res, 500, 'GET_USER_FAILED', message);
  }
};

/**
 * Create a new user (admin only)
 * POST /api/v1/admin/users
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, quota } = req.body;
    
    if (!email || !password || !name) {
      return sendError(res, 400, 'INVALID_REQUEST', 'Missing required fields: email, password, name');
    }
    
    logger.info('Admin creating user', { 
      adminId: req.user?.userId,
      email,
      role,
      requestId: req.requestId 
    });
    
    const user = await createUserByAdmin({
      email,
      password,
      name,
      role: role || 'user',
      quota,
    });
    
    sendSuccess(res, user, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user';
    logger.error('Failed to create user', { error: message, requestId: req.requestId });
    
    if (message.includes('already registered')) {
      return sendError(res, 409, 'EMAIL_EXISTS', message);
    }
    
    sendError(res, 500, 'CREATE_USER_FAILED', message);
  }
};

/**
 * Update user role
 * PATCH /api/v1/admin/users/:id/role
 */
export const changeUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role || !['user', 'admin'].includes(role)) {
      return sendError(res, 400, 'INVALID_ROLE', 'Role must be "user" or "admin"');
    }
    
    logger.info('Admin updating user role', { 
      adminId: req.user?.userId,
      targetUserId: id,
      newRole: role,
      requestId: req.requestId 
    });
    
    const user = updateUserRole(id, role);
    if (!user) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
    }
    
    sendSuccess(res, user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user role';
    logger.error('Failed to update user role', { error: message, requestId: req.requestId });
    sendError(res, 500, 'UPDATE_ROLE_FAILED', message);
  }
};

/**
 * Update user quota
 * PATCH /api/v1/admin/users/:id/quota
 */
export const changeUserQuota = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quota } = req.body;
    
    if (typeof quota !== 'number') {
      return sendError(res, 400, 'INVALID_QUOTA', 'Quota must be a number');
    }
    
    logger.info('Admin updating user quota', { 
      adminId: req.user?.userId,
      targetUserId: id,
      newQuota: quota,
      requestId: req.requestId 
    });
    
    const user = getUserById(id);
    if (!user) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
    }
    
    // Calculate the change needed to reach the desired quota
    const change = quota - user.quota;
    const newQuota = updateUserQuota(id, change);
    
    sendSuccess(res, { userId: id, quota: newQuota });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user quota';
    logger.error('Failed to update user quota', { error: message, requestId: req.requestId });
    sendError(res, 500, 'UPDATE_QUOTA_FAILED', message);
  }
};

/**
 * Reset user password
 * PATCH /api/v1/admin/users/:id/password
 */
export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return sendError(res, 400, 'INVALID_PASSWORD', 'Password must be at least 6 characters');
    }
    
    logger.info('Admin resetting user password', { 
      adminId: req.user?.userId,
      targetUserId: id,
      requestId: req.requestId 
    });
    
    const success = await updateUserPassword(id, password);
    if (!success) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
    }
    
    sendSuccess(res, { message: 'Password reset successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reset password';
    logger.error('Failed to reset password', { error: message, requestId: req.requestId });
    sendError(res, 500, 'RESET_PASSWORD_FAILED', message);
  }
};

/**
 * Delete user
 * DELETE /api/v1/admin/users/:id
 */
export const removeUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (req.user?.userId === id) {
      return sendError(res, 400, 'CANNOT_DELETE_SELF', 'Cannot delete your own account');
    }
    
    logger.info('Admin deleting user', { 
      adminId: req.user?.userId,
      targetUserId: id,
      requestId: req.requestId 
    });
    
    const success = deleteUser(id);
    if (!success) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
    }
    
    sendSuccess(res, { deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete user';
    logger.error('Failed to delete user', { error: message, requestId: req.requestId });
    
    if (message.includes('last admin')) {
      return sendError(res, 400, 'LAST_ADMIN', message);
    }
    
    sendError(res, 500, 'DELETE_USER_FAILED', message);
  }
};

/**
 * Get admin dashboard stats
 * GET /api/v1/admin/stats
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const stats = getUserStats();
    sendSuccess(res, stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get stats';
    logger.error('Failed to get dashboard stats', { error: message, requestId: req.requestId });
    sendError(res, 500, 'STATS_FAILED', message);
  }
};

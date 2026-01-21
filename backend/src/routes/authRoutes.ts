import { Router } from 'express';
import { register, login, wechatLogin, refresh, logout, me } from '../controllers/index.js';
import { validate, authGuard } from '../middleware/index.js';
import { loginSchema, registerSchema, refreshTokenSchema } from '../types/index.js';

const router = Router();

/**
 * @route POST /api/v1/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validate(registerSchema), register);

/**
 * @route POST /api/v1/auth/token
 * @desc Login user and get tokens
 * @access Public
 */
router.post('/token', validate(loginSchema), login);

/**
 * @route POST /api/v1/auth/wechat
 * @desc Login/Register with WeChat Code
 * @access Public
 */
router.post('/wechat', wechatLogin);

/**
 * @route POST /api/v1/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', validate(refreshTokenSchema), refresh);

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout user
 * @access Public
 */
router.post('/logout', logout);

/**
 * @route GET /api/v1/auth/me
 * @desc Get current user info
 * @access Private
 */
router.get('/me', authGuard, me);

export default router;

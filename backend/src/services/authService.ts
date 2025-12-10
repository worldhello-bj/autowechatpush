import { v4 as uuidv4 } from 'uuid';
import { 
  User, 
  UserSession, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse 
} from '../types/index.js';
import { 
  hashPassword, 
  verifyPassword, 
  generateAccessToken, 
  generateRefreshToken,
  verifyToken,
  parseExpiry,
  createLogger 
} from '../utils/index.js';
import { config } from '../config/index.js';

const logger = createLogger('auth-service');

// In-memory storage (for demo purposes - replace with PostgreSQL in production)
const users: Map<string, User> = new Map();
const sessions: Map<string, UserSession> = new Map();

// Index for email lookup
const emailIndex: Map<string, string> = new Map(); // email -> userId

/**
 * Register a new user
 */
export const registerUser = async (data: RegisterRequest): Promise<AuthResponse> => {
  logger.info('Registering new user', { email: data.email });
  
  // Check if email already exists
  if (emailIndex.has(data.email.toLowerCase())) {
    throw new Error('Email already registered');
  }
  
  const userId = uuidv4();
  const passwordHash = await hashPassword(data.password);
  const now = new Date();
  
  const user: User = {
    id: userId,
    email: data.email.toLowerCase(),
    passwordHash,
    name: data.name,
    createdAt: now,
    updatedAt: now,
    quota: 100, // Initial quota for new users
    role: 'user',
  };
  
  // Store user
  users.set(userId, user);
  emailIndex.set(user.email, userId);
  
  // Generate tokens
  const tokenPayload = { userId, email: user.email, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  
  // Store session
  const session: UserSession = {
    userId,
    refreshToken,
    expiresAt: new Date(Date.now() + parseExpiry(config.JWT_REFRESH_EXPIRY)),
    createdAt: now,
  };
  sessions.set(refreshToken, session);
  
  logger.info('User registered successfully', { userId });
  
  return {
    accessToken,
    refreshToken,
    user: {
      id: userId,
      email: user.email,
      name: user.name,
      quota: user.quota,
      role: user.role,
    },
  };
};

/**
 * Login user
 */
export const loginUser = async (data: LoginRequest): Promise<AuthResponse> => {
  logger.info('User login attempt', { email: data.email });
  
  const userId = emailIndex.get(data.email.toLowerCase());
  if (!userId) {
    logger.warn('Login failed - user not found', { email: data.email });
    throw new Error('Invalid email or password');
  }
  
  const user = users.get(userId);
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  const isValidPassword = await verifyPassword(data.password, user.passwordHash);
  if (!isValidPassword) {
    logger.warn('Login failed - invalid password', { email: data.email });
    throw new Error('Invalid email or password');
  }
  
  // Generate tokens
  const tokenPayload = { userId, email: user.email, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  
  // Store session
  const session: UserSession = {
    userId,
    refreshToken,
    expiresAt: new Date(Date.now() + parseExpiry(config.JWT_REFRESH_EXPIRY)),
    createdAt: new Date(),
  };
  sessions.set(refreshToken, session);
  
  logger.info('User logged in successfully', { userId });
  
  return {
    accessToken,
    refreshToken,
    user: {
      id: userId,
      email: user.email,
      name: user.name,
      quota: user.quota,
      role: user.role,
    },
  };
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
  logger.info('Refreshing access token');
  
  // Verify the refresh token
  const payload = verifyToken(refreshToken);
  if (!payload || payload.type !== 'refresh') {
    throw new Error('Invalid refresh token');
  }
  
  // Check if session exists
  const session = sessions.get(refreshToken);
  if (!session) {
    throw new Error('Session not found');
  }
  
  // Check if session expired
  if (session.expiresAt < new Date()) {
    sessions.delete(refreshToken);
    throw new Error('Session expired');
  }
  
  // Get user
  const user = users.get(session.userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Generate new tokens
  const tokenPayload = { userId: user.id, email: user.email, role: user.role };
  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);
  
  // Delete old session, create new one
  sessions.delete(refreshToken);
  const newSession: UserSession = {
    userId: user.id,
    refreshToken: newRefreshToken,
    expiresAt: new Date(Date.now() + parseExpiry(config.JWT_REFRESH_EXPIRY)),
    createdAt: new Date(),
  };
  sessions.set(newRefreshToken, newSession);
  
  logger.info('Access token refreshed successfully', { userId: user.id });
  
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Logout user (invalidate refresh token)
 */
export const logoutUser = (refreshToken: string): boolean => {
  logger.info('User logout');
  return sessions.delete(refreshToken);
};

/**
 * Get user by ID
 */
export const getUserById = (userId: string): Omit<User, 'passwordHash'> | null => {
  const user = users.get(userId);
  if (!user) return null;
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Update user quota
 */
export const updateUserQuota = (userId: string, change: number): number => {
  const user = users.get(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  user.quota = Math.max(0, user.quota + change);
  user.updatedAt = new Date();
  users.set(userId, user);
  
  logger.info('User quota updated', { userId, newQuota: user.quota, change });
  
  return user.quota;
};

/**
 * Check if user has sufficient quota
 */
export const checkUserQuota = (userId: string, required: number = 1): boolean => {
  const user = users.get(userId);
  if (!user) return false;
  return user.quota >= required;
};

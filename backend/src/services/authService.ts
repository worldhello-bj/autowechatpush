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

// Constants
const ADMIN_UNLIMITED_QUOTA = 999999;

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
  
  const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
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

/**
 * Seed initial admin user from environment variables
 * Called during server startup
 */
export const seedAdminUser = async (): Promise<void> => {
  const adminEmail = config.ADMIN_EMAIL.toLowerCase();
  
  // Check if admin already exists
  if (emailIndex.has(adminEmail)) {
    logger.info('Admin user already exists', { email: adminEmail });
    return;
  }
  
  const userId = uuidv4();
  const passwordHash = await hashPassword(config.ADMIN_PASSWORD);
  const now = new Date();
  
  const adminUser: User = {
    id: userId,
    email: adminEmail,
    passwordHash,
    name: config.ADMIN_NAME,
    createdAt: now,
    updatedAt: now,
    quota: ADMIN_UNLIMITED_QUOTA,
    role: 'admin',
  };
  
  users.set(userId, adminUser);
  emailIndex.set(adminEmail, userId);
  
  logger.info('Admin user seeded successfully', { email: adminEmail, userId });
};

/**
 * List all users (admin only)
 */
export const listAllUsers = (page: number = 1, limit: number = 20): {
  users: Omit<User, 'passwordHash'>[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
} => {
  const allUsers = Array.from(users.values()).map(user => {
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
  
  // Sort by creation date (newest first)
  allUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  const total = allUsers.length;
  const offset = (page - 1) * limit;
  const paged = allUsers.slice(offset, offset + limit);
  
  return {
    users: paged,
    total,
    page,
    limit,
    hasMore: offset + paged.length < total,
  };
};

/**
 * Get user statistics (admin only)
 */
export const getUserStats = (): {
  totalUsers: number;
  adminCount: number;
  userCount: number;
  totalQuotaAllocated: number;
} => {
  const allUsers = Array.from(users.values());
  
  return {
    totalUsers: allUsers.length,
    adminCount: allUsers.filter(u => u.role === 'admin').length,
    userCount: allUsers.filter(u => u.role === 'user').length,
    totalQuotaAllocated: allUsers.reduce((sum, u) => sum + u.quota, 0),
  };
};

/**
 * Update user role (admin only)
 */
export const updateUserRole = (userId: string, newRole: 'user' | 'admin'): Omit<User, 'passwordHash'> | null => {
  const user = users.get(userId);
  if (!user) return null;
  
  user.role = newRole;
  user.updatedAt = new Date();
  users.set(userId, user);
  
  logger.info('User role updated', { userId, newRole });
  
  const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Delete user (admin only)
 */
export const deleteUser = (userId: string): boolean => {
  const user = users.get(userId);
  if (!user) return false;
  
  // Don't allow deleting the last admin
  const adminCount = Array.from(users.values()).filter(u => u.role === 'admin').length;
  if (user.role === 'admin' && adminCount <= 1) {
    throw new Error('Cannot delete the last admin user');
  }
  
  users.delete(userId);
  emailIndex.delete(user.email);
  
  // Also delete all sessions for this user
  for (const [token, session] of sessions) {
    if (session.userId === userId) {
      sessions.delete(token);
    }
  }
  
  logger.info('User deleted', { userId, email: user.email });
  return true;
};

/**
 * Update user password (admin or self)
 */
export const updateUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
  const user = users.get(userId);
  if (!user) return false;
  
  user.passwordHash = await hashPassword(newPassword);
  user.updatedAt = new Date();
  users.set(userId, user);
  
  // Invalidate all sessions for this user (force re-login)
  for (const [token, session] of sessions) {
    if (session.userId === userId) {
      sessions.delete(token);
    }
  }
  
  logger.info('User password updated', { userId });
  return true;
};

/**
 * Create user by admin (without email verification)
 */
export const createUserByAdmin = async (data: {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  quota?: number;
}): Promise<Omit<User, 'passwordHash'>> => {
  const email = data.email.toLowerCase();
  
  if (emailIndex.has(email)) {
    throw new Error('Email already registered');
  }
  
  const userId = uuidv4();
  const passwordHash = await hashPassword(data.password);
  const now = new Date();
  
  const user: User = {
    id: userId,
    email,
    passwordHash,
    name: data.name,
    createdAt: now,
    updatedAt: now,
    quota: data.quota ?? 100,
    role: data.role,
  };
  
  users.set(userId, user);
  emailIndex.set(email, userId);
  
  logger.info('User created by admin', { userId, email, role: data.role });
  
  const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

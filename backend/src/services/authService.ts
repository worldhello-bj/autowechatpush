import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  User, 
  UserSession, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  QuotaPlan,
} from '../types/index.js';
import { 
  hashPassword, 
  verifyPassword, 
  generateAccessToken, 
  generateRefreshToken,
  verifyToken,
  parseExpiry,
  createLogger,
  createJsonStorage,
} from '../utils/index.js';
import { config } from '../config/index.js';
import { initializeUserQuota, setUserTotalQuota, getUserQuotaStatus } from './quotaService.js';

const logger = createLogger('auth-service');

// File paths for persistence
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// In-memory storage with disk persistence
const users: Map<string, User> = new Map();
const sessions: Map<string, UserSession> = new Map();

// Index for email lookup
const emailIndex: Map<string, string> = new Map(); // email -> userId

// Index for username (name) lookup
const nameIndex: Map<string, string> = new Map(); // name (lowercase) -> userId

// Index for WeChat OpenID lookup
const openIdIndex: Map<string, string> = new Map(); // openId -> userId

// Constants
const ADMIN_UNLIMITED_QUOTA = 999999;

// Serialization types for persistence
type UserSerialized = Omit<User, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

interface PersistedUserData {
  users: UserSerialized[];
  version: string;
}

// Create optimized JSON storage instance (compact mode for efficiency)
const storage = createJsonStorage<PersistedUserData>(USERS_FILE, {
  prettyPrint: false, // Use compact JSON to save space and CPU
  debounceMs: 2000,
});

// Ensure pending debounced data is flushed on graceful shutdown
process.on('SIGTERM', async () => {
  try {
    await storage.flush();
  } finally {
    process.exit(0);
  }
});

process.on('SIGINT', async () => {
  try {
    await storage.flush();
  } finally {
    process.exit(0);
  }
});

/**
 * Persist user data to disk using optimized JSON storage
 */
const persistData = () => {
  const payload: PersistedUserData = {
    version: '1.0',
    users: Array.from(users.values()).map(u => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    })),
  };
  
  storage.save(payload);
};

/**
 * Validate date string
 */
const isValidDateString = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
};

/**
 * Load user data from disk using optimized JSON storage
 */
const loadData = async () => {
  try {
    const parsed = await storage.load();
    
    if (!parsed) {
      logger.info('No existing user data file found, starting fresh');
      return;
    }
    
    if (!Array.isArray(parsed.users)) {
      logger.warn('User data file malformed (no users array), skipping load');
      return;
    }

    // Load and validate each user
    let loadedCount = 0;
    parsed.users.forEach(u => {
      if (
        !u ||
        typeof u.id !== 'string' ||
        typeof u.email !== 'string' ||
        typeof u.passwordHash !== 'string' ||
        typeof u.name !== 'string' ||
        typeof u.quota !== 'number' ||
        !['user', 'admin'].includes(u.role) ||
        !isValidDateString(u.createdAt) ||
        !isValidDateString(u.updatedAt)
      ) {
        logger.warn('Skipping invalid user entry in data file', { userId: u?.id });
        return;
      }

      const user: User = {
        ...u,
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
      };

      users.set(user.id, user);
      emailIndex.set(user.email.toLowerCase(), user.id);
      nameIndex.set(user.name.toLowerCase(), user.id);
      if (user.openId) {
        openIdIndex.set(user.openId, user.id);
      }
      loadedCount++;
    });

    logger.info('User data loaded from disk', { userCount: loadedCount });
  } catch (error) {
    logger.error('Failed to load user data from disk', { error });
  }
};

/**
 * Initialize user data store (load from disk)
 */
export const initUserStore = async (): Promise<void> => {
  await loadData();
};

/**
 * Login or Register with WeChat Code
 */
export const loginWithWeChat = async (code: string): Promise<AuthResponse> => {
  // Exchange code for openid (MOCKED for now if env vars missing, or try real call)
  const appId = process.env.WECHAT_MINI_APP_ID;
  const secret = process.env.WECHAT_MINI_APP_SECRET;

  let openId = '';

  if (!appId || !secret) {
       // Fallback for development without credentials
       logger.warn('WeChat AppID/Secret not configured, using mock OpenID based on code');
       openId = `mock_openid_${code}`;
  } else {
       const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
       const res = await fetch(url);
       const data = await res.json() as any;
       if (data.errcode) {
           throw new Error(`WeChat Auth Error: ${data.errmsg}`);
       }
       openId = data.openid;
  }

  let userId = openIdIndex.get(openId);
  
  if (userId) {
       // User exists, login
       const user = users.get(userId)!;
       
       // Generate tokens
       const tokenPayload = { userId, email: user.email, role: user.role };
       const accessToken = generateAccessToken(tokenPayload);
       const refreshToken = generateRefreshToken(tokenPayload);
       
       // Create session
       const session: UserSession = {
          userId,
          refreshToken,
          expiresAt: new Date(Date.now() + parseExpiry(config.JWT_REFRESH_EXPIRY)),
          createdAt: new Date(),
       };
       sessions.set(refreshToken, session);
       
       logger.info('User logged in via WeChat', { userId });

       // Get real-time quota status
       const quotaStatus = getUserQuotaStatus(userId);
       if (!quotaStatus) {
         logger.warn('Quota status not found for WeChat user, user may need quota initialization', { userId });
       }
       const remainingQuota = quotaStatus ? quotaStatus.remainingQuota : user.quota;

       return { accessToken, refreshToken, user: { id: userId, email: user.email, name: user.name, quota: remainingQuota, role: user.role } };
  } else {
       // Register new user
       const newUserId = uuidv4();
       const now = new Date();
       const randomSuffix = randomUUID().slice(0, 8);
       // Use a fake email that won't collide
       const email = `${openId}@wechat.local`.toLowerCase();
       const name = `WeChatUser_${randomSuffix}`;
       // Random password (user won't use it)
       const passwordHash = await hashPassword(randomUUID());
       
       const newUser: User = {
           id: newUserId,
           email,
           name,
           passwordHash,
           createdAt: now,
           updatedAt: now,
           quota: 50, // Starter quota for WeChat users
           role: 'user',
           openId: openId
       };
       
       users.set(newUserId, newUser);
       emailIndex.set(email, newUserId);
       nameIndex.set(name.toLowerCase(), newUserId);
       openIdIndex.set(openId, newUserId);
       
       persistData();
       initializeUserQuota(newUserId, QuotaPlan.FREE);
       
       const tokenPayload = { userId: newUserId, email: newUser.email, role: newUser.role };
       const accessToken = generateAccessToken(tokenPayload);
       const refreshToken = generateRefreshToken(tokenPayload);
       
       const session: UserSession = {
          userId: newUserId,
          refreshToken,
          expiresAt: new Date(Date.now() + parseExpiry(config.JWT_REFRESH_EXPIRY)),
          createdAt: now,
       };
       sessions.set(refreshToken, session);
       
       logger.info('User registered via WeChat', { userId: newUserId });

       // Get real-time quota status
       const quotaStatus = getUserQuotaStatus(newUserId);
       if (!quotaStatus) {
         logger.warn('Quota status not found for new WeChat user, user may need quota initialization', { userId: newUserId });
       }
       const remainingQuota = quotaStatus ? quotaStatus.remainingQuota : newUser.quota;

       return { accessToken, refreshToken, user: { id: newUserId, email: newUser.email, name: newUser.name, quota: remainingQuota, role: newUser.role } };
  }
};

/**
 * Register a new user
 */
export const registerUser = async (data: RegisterRequest): Promise<AuthResponse> => {
  logger.info('Registering new user', { email: data.email });
  
  // Check if email already exists
  if (emailIndex.has(data.email.toLowerCase())) {
    throw new Error('Email already registered');
  }
  
  // Check if username already exists
  if (nameIndex.has(data.name.toLowerCase())) {
    throw new Error('Username already taken');
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
  nameIndex.set(user.name.toLowerCase(), userId);
  
  // Persist user data to disk
  persistData();
  
  // Initialize quota service for this user (FREE plan by default)
  initializeUserQuota(userId, QuotaPlan.FREE);
  
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
  
  // Get real-time quota status
  const quotaStatus = getUserQuotaStatus(userId);
  if (!quotaStatus) {
    logger.warn('Quota status not found for new user, user may need quota initialization', { userId });
  }
  const remainingQuota = quotaStatus ? quotaStatus.remainingQuota : user.quota;
  
  return {
    accessToken,
    refreshToken,
    user: {
      id: userId,
      email: user.email,
      name: user.name,
      quota: remainingQuota,
      role: user.role,
    },
  };
};

/**
 * Login user (supports email or username)
 */
export const loginUser = async (data: LoginRequest): Promise<AuthResponse> => {
  const identifier = data.email.toLowerCase(); // Can be email or username
  logger.info('User login attempt', { identifier });
  
  // Try to find user by email first, then by username
  let userId = emailIndex.get(identifier);
  if (!userId) {
    userId = nameIndex.get(identifier);
  }
  
  if (!userId) {
    logger.warn('Login failed - user not found', { identifier });
    throw new Error('Invalid email/username or password');
  }
  
  const user = users.get(userId);
  if (!user) {
    throw new Error('Invalid email/username or password');
  }
  
  const isValidPassword = await verifyPassword(data.password, user.passwordHash);
  if (!isValidPassword) {
    logger.warn('Login failed - invalid password', { identifier });
    throw new Error('Invalid email/username or password');
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
  
  // Get real-time quota status
  const quotaStatus = getUserQuotaStatus(userId);
  if (!quotaStatus) {
    logger.warn('Quota status not found for user, user may need quota initialization', { userId });
  }
  const remainingQuota = quotaStatus ? quotaStatus.remainingQuota : user.quota;
  
  return {
    accessToken,
    refreshToken,
    user: {
      id: userId,
      email: user.email,
      name: user.name,
      quota: remainingQuota,
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
  
  // Persist user data to disk
  persistData();

  // Keep quota service in sync for enforcement
  setUserTotalQuota(userId, user.quota);
  
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
  nameIndex.set(config.ADMIN_NAME.toLowerCase(), userId);
  
  // Persist user data to disk
  persistData();
  
  // Initialize quota service for admin with ENTERPRISE plan
  initializeUserQuota(userId, QuotaPlan.ENTERPRISE);
  setUserTotalQuota(userId, adminUser.quota);
  
  logger.info('Admin user seeded successfully', { email: adminEmail, userId });
};

/**
 * Seed a default test user for development/demo purposes
 * Called during server startup (only in non-production environments)
 */
export const seedTestUser = async (): Promise<void> => {
  // Only seed test user in non-production environments for security
  if (config.NODE_ENV === 'production') {
    logger.info('Skipping test user seeding in production environment');
    return;
  }
  
  const testUsername = 'test';  // Username for login (also used as name field)
  const testEmail = 'test@local.dev'.toLowerCase();  // Email for the user
  
  // Check if test user already exists (by username)
  if (nameIndex.has(testUsername)) {
    logger.info('Test user already exists', { username: testUsername });
    return;
  }
  
  const userId = uuidv4();
  const passwordHash = await hashPassword('123456');
  const now = new Date();
  
  const testUser: User = {
    id: userId,
    email: testEmail,
    passwordHash,
    name: testUsername,  // Username for login (name field is used as login identifier)
    createdAt: now,
    updatedAt: now,
    quota: 1000, // Generous quota for testing
    role: 'user',
  };
  
  users.set(userId, testUser);
  emailIndex.set(testEmail, userId);
  nameIndex.set(testUsername.toLowerCase(), userId);
  
  // Persist user data to disk
  persistData();
  
  // Initialize quota service for test user with FREE plan
  initializeUserQuota(userId, QuotaPlan.FREE);
  setUserTotalQuota(userId, testUser.quota);
  
  logger.info('Test user seeded successfully', { username: testUsername, email: testEmail, userId });
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
  
  // Persist user data to disk
  persistData();
  
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
  nameIndex.delete(user.name.toLowerCase());
  
  // Persist user data to disk
  persistData();
  
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
  
  // Persist user data to disk
  persistData();
  
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
  
  if (nameIndex.has(data.name.toLowerCase())) {
    throw new Error('Username already taken');
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
  nameIndex.set(data.name.toLowerCase(), userId);
  
  // Persist user data to disk
  persistData();
  
  // Initialize quota service: admins get ENTERPRISE, regular users get FREE plan
  const quotaPlan = data.role === 'admin' ? QuotaPlan.ENTERPRISE : QuotaPlan.FREE;
  initializeUserQuota(userId, quotaPlan);
  setUserTotalQuota(userId, user.quota);
  
  logger.info('User created by admin', { userId, email, role: data.role });
  
  const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

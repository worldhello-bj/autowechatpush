import { v4 as uuidv4 } from 'uuid';
import { 
  QuotaPlan,
  PLAN_LIMITS,
  UserQuotaStatus,
  UsageRecord,
  QuotaCheckResult,
} from '../types/index.js';
import { createLogger } from '../utils/index.js';

const logger = createLogger('quota-service');

// In-memory storage (replace with PostgreSQL/Redis in production)
interface UserQuotaData {
  userId: string;
  plan: QuotaPlan;
  totalQuota: number;
  dailyUsed: number;
  monthlyUsed: number;
  lastDailyReset: Date;
  lastMonthlyReset: Date;
  expiryDate?: Date;
}

const userQuotas: Map<string, UserQuotaData> = new Map();
const usageRecords: UsageRecord[] = [];

// Maximum usage records to keep in memory
const MAX_USAGE_RECORDS = 10000;

/**
 * Initialize quota for a new user
 */
export const initializeUserQuota = (userId: string, plan: QuotaPlan = QuotaPlan.FREE): void => {
  const limits = PLAN_LIMITS[plan];
  const now = new Date();
  
  userQuotas.set(userId, {
    userId,
    plan,
    totalQuota: limits.monthlyLimit,
    dailyUsed: 0,
    monthlyUsed: 0,
    lastDailyReset: now,
    lastMonthlyReset: now,
  });

  logger.info('User quota initialized', { userId, plan });
};

/**
 * Get start of day for reset calculations
 */
const getStartOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get start of month for reset calculations
 */
const getStartOfMonth = (date: Date): Date => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Check and reset quotas if needed (daily/monthly)
 */
const checkAndResetQuotas = (quotaData: UserQuotaData): void => {
  const now = new Date();
  const todayStart = getStartOfDay(now);
  const monthStart = getStartOfMonth(now);

  // Reset daily quota if it's a new day
  if (quotaData.lastDailyReset < todayStart) {
    quotaData.dailyUsed = 0;
    quotaData.lastDailyReset = now;
    logger.debug('Daily quota reset', { userId: quotaData.userId });
  }

  // Reset monthly quota if it's a new month
  if (quotaData.lastMonthlyReset < monthStart) {
    quotaData.monthlyUsed = 0;
    quotaData.lastMonthlyReset = now;
    logger.debug('Monthly quota reset', { userId: quotaData.userId });
  }
};

/**
 * Get user's quota status
 */
export const getUserQuotaStatus = (userId: string): UserQuotaStatus | null => {
  let quotaData = userQuotas.get(userId);
  
  if (!quotaData) {
    // Auto-initialize for new users
    initializeUserQuota(userId);
    quotaData = userQuotas.get(userId)!;
  }

  checkAndResetQuotas(quotaData);
  
  const limits = PLAN_LIMITS[quotaData.plan];
  const usedQuota = quotaData.monthlyUsed;
  const remainingQuota = Math.max(0, quotaData.totalQuota - usedQuota);

  // Calculate next daily reset
  const resetDate = new Date();
  resetDate.setDate(resetDate.getDate() + 1);
  resetDate.setHours(0, 0, 0, 0);

  return {
    userId,
    plan: quotaData.plan,
    totalQuota: quotaData.totalQuota,
    usedQuota,
    remainingQuota,
    dailyUsed: quotaData.dailyUsed,
    dailyLimit: limits.dailyLimit,
    monthlyUsed: quotaData.monthlyUsed,
    monthlyLimit: limits.monthlyLimit,
    resetDate,
    expiryDate: quotaData.expiryDate,
  };
};

/**
 * Check if user has sufficient quota for an action
 */
export const checkQuota = (
  userId: string, 
  requiredCredits: number = 1
): QuotaCheckResult => {
  const status = getUserQuotaStatus(userId);
  
  if (!status) {
    return {
      allowed: false,
      remainingQuota: 0,
      reason: 'User quota not found',
    };
  }

  // Check daily limit
  if (status.dailyUsed + requiredCredits > status.dailyLimit) {
    return {
      allowed: false,
      remainingQuota: status.remainingQuota,
      reason: `Daily limit exceeded. Used: ${status.dailyUsed}/${status.dailyLimit}. Resets at ${status.resetDate.toISOString()}`,
    };
  }

  // Check monthly limit
  if (status.usedQuota + requiredCredits > status.totalQuota) {
    return {
      allowed: false,
      remainingQuota: status.remainingQuota,
      reason: `Monthly quota exceeded. Used: ${status.usedQuota}/${status.totalQuota}. Please upgrade your plan.`,
    };
  }

  return {
    allowed: true,
    remainingQuota: status.remainingQuota - requiredCredits,
  };
};

/**
 * Consume quota for an action
 */
export const consumeQuota = (
  userId: string, 
  credits: number,
  type: UsageRecord['type'],
  details?: Record<string, unknown>,
  requestId?: string
): void => {
  const quotaData = userQuotas.get(userId);
  if (!quotaData) {
    logger.warn('Attempting to consume quota for unknown user', { userId });
    return;
  }

  checkAndResetQuotas(quotaData);

  // Update usage counters
  quotaData.dailyUsed += credits;
  quotaData.monthlyUsed += credits;

  // Record usage for audit trail
  const record: UsageRecord = {
    id: uuidv4(),
    userId,
    type,
    cost: credits,
    details,
    timestamp: new Date(),
    requestId,
  };

  usageRecords.push(record);

  // Trim old records in batches for better performance
  // Only trim when significantly over limit to avoid frequent operations
  const trimThreshold = MAX_USAGE_RECORDS + 1000;
  if (usageRecords.length > trimThreshold) {
    // Remove oldest 20% of records when over threshold
    const removeCount = Math.floor(MAX_USAGE_RECORDS * 0.2);
    usageRecords.splice(0, removeCount);
    logger.debug('Trimmed old usage records', { removed: removeCount, remaining: usageRecords.length });
  }

  logger.info('Quota consumed', { 
    userId, 
    credits, 
    type, 
    newDailyUsed: quotaData.dailyUsed,
    newMonthlyUsed: quotaData.monthlyUsed 
  });
};

/**
 * Add quota credits to user (for purchases, rewards, etc.)
 */
export const addQuotaCredits = (
  userId: string, 
  credits: number,
  reason?: string
): number => {
  const quotaData = userQuotas.get(userId);
  if (!quotaData) {
    logger.warn('Attempting to add credits for unknown user', { userId });
    initializeUserQuota(userId);
    return addQuotaCredits(userId, credits, reason);
  }

  quotaData.totalQuota += credits;

  logger.info('Quota credits added', { 
    userId, 
    credits, 
    reason,
    newTotal: quotaData.totalQuota 
  });

  return quotaData.totalQuota;
};

/**
 * Upgrade user's plan
 */
export const upgradePlan = (
  userId: string, 
  newPlan: QuotaPlan,
  expiryDate?: Date
): UserQuotaStatus | null => {
  const quotaData = userQuotas.get(userId);
  if (!quotaData) {
    logger.warn('Attempting to upgrade plan for unknown user', { userId });
    return null;
  }

  const newLimits = PLAN_LIMITS[newPlan];
  
  quotaData.plan = newPlan;
  quotaData.totalQuota = newLimits.monthlyLimit;
  quotaData.expiryDate = expiryDate;

  logger.info('Plan upgraded', { 
    userId, 
    newPlan, 
    expiryDate 
  });

  return getUserQuotaStatus(userId);
};

/**
 * Set user's total quota (used when admin updates quota)
 */
export const setUserTotalQuota = (userId: string, totalQuota: number): UserQuotaStatus => {
  if (!userQuotas.has(userId)) {
    initializeUserQuota(userId);
  }

  const quotaData = userQuotas.get(userId)!;
  quotaData.totalQuota = Math.max(0, totalQuota);
  quotaData.dailyUsed = Math.min(quotaData.dailyUsed, quotaData.totalQuota);
  quotaData.monthlyUsed = Math.min(quotaData.monthlyUsed, quotaData.totalQuota);

  return getUserQuotaStatus(userId)!;
};

/**
 * Get usage history for a user
 */
export const getUserUsageHistory = (
  userId: string,
  limit: number = 50
): UsageRecord[] => {
  return usageRecords
    .filter(r => r.userId === userId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
};

/**
 * Get aggregated usage stats for a user
 */
export const getUserUsageStats = (
  userId: string,
  period: 'day' | 'week' | 'month' = 'month'
): { total: number; byType: Record<string, number> } => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'day':
      startDate = getStartOfDay(now);
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
    default:
      startDate = getStartOfMonth(now);
      break;
  }

  const records = usageRecords.filter(
    r => r.userId === userId && r.timestamp >= startDate
  );

  const byType: Record<string, number> = {};
  let total = 0;

  for (const record of records) {
    total += record.cost;
    byType[record.type] = (byType[record.type] || 0) + record.cost;
  }

  return { total, byType };
};

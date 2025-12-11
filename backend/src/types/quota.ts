import { z } from 'zod';

// Quota plan types
export enum QuotaPlan {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

// Plan limits
export const PLAN_LIMITS: Record<QuotaPlan, { dailyLimit: number; monthlyLimit: number; maxFileSize: number }> = {
  [QuotaPlan.FREE]: { dailyLimit: 10, monthlyLimit: 100, maxFileSize: 5 * 1024 * 1024 },
  [QuotaPlan.BASIC]: { dailyLimit: 50, monthlyLimit: 500, maxFileSize: 10 * 1024 * 1024 },
  [QuotaPlan.PRO]: { dailyLimit: 200, monthlyLimit: 2000, maxFileSize: 50 * 1024 * 1024 },
  [QuotaPlan.ENTERPRISE]: { dailyLimit: 1000, monthlyLimit: 10000, maxFileSize: 100 * 1024 * 1024 },
};

// User quota status
export interface UserQuotaStatus {
  userId: string;
  plan: QuotaPlan;
  totalQuota: number;       // Total credits available
  usedQuota: number;        // Credits used
  remainingQuota: number;   // Credits remaining
  dailyUsed: number;        // Used today
  dailyLimit: number;       // Daily limit
  monthlyUsed: number;      // Used this month
  monthlyLimit: number;     // Monthly limit
  resetDate: Date;          // When daily quota resets
  expiryDate?: Date;        // When subscription expires
}

// Usage record for audit trail
export interface UsageRecord {
  id: string;
  userId: string;
  type: 'ai_generation' | 'material_upload' | 'ai_stream';
  provider?: string;
  cost: number;             // Credits consumed
  details?: Record<string, unknown>;
  timestamp: Date;
  requestId?: string;
}

// Quota check result
export interface QuotaCheckResult {
  allowed: boolean;
  remainingQuota: number;
  reason?: string;
}

// Quota update request schema
export const updateQuotaSchema = z.object({
  change: z.number().int(),
  reason: z.string().optional(),
});

export type UpdateQuotaRequest = z.infer<typeof updateQuotaSchema>;

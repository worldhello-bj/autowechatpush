import { z } from 'zod';

// Feedback status
export type FeedbackStatus = 'pending' | 'reviewed' | 'resolved' | 'closed';

// Feedback category
export type FeedbackCategory = 'bug' | 'feature' | 'question' | 'other';

// Feedback interface
export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: FeedbackCategory;
  title: string;
  content: string;
  status: FeedbackStatus;
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
  appVersion?: string;
  platform?: string;
}

// Create feedback request schema
export const createFeedbackSchema = z.object({
  category: z.enum(['bug', 'feature', 'question', 'other']),
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  content: z.string().min(1, 'Content is required').max(2000, 'Content is too long'),
  appVersion: z.string().optional(),
  platform: z.string().optional(),
});

// Update feedback status schema (admin only)
export const updateFeedbackStatusSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'resolved', 'closed']),
  adminReply: z.string().max(2000, 'Reply is too long').optional(),
});

export type CreateFeedbackRequest = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackStatusRequest = z.infer<typeof updateFeedbackStatusSchema>;

// Storage interface for persistence
export interface FeedbackStorage {
  feedbacks: Feedback[];
  lastUpdated: string;
}

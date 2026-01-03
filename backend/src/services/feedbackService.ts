import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Feedback,
  FeedbackStatus,
  FeedbackCategory,
  FeedbackStorage,
  CreateFeedbackRequest,
} from '../types/index.js';
import { createLogger } from '../utils/index.js';

const logger = createLogger('feedback-service');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'feedbacks.json');

// Maximum feedbacks to keep in memory
const MAX_FEEDBACKS = 1000;

// In-memory storage
const feedbacks: Feedback[] = [];
let persistTimer: NodeJS.Timeout | null = null;
let persistInFlight: Promise<void> | null = null;

/**
 * Initialize feedback service and load persisted data
 */
export const initFeedbackService = () => {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      logger.info('Created data directory', { path: DATA_DIR });
    }

    // Load existing data if file exists
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data: FeedbackStorage = JSON.parse(raw);
      
      // Restore feedbacks (limit to MAX_FEEDBACKS)
      if (data.feedbacks && Array.isArray(data.feedbacks)) {
        const loadedFeedbacks = data.feedbacks.slice(-MAX_FEEDBACKS);
        feedbacks.push(...loadedFeedbacks);
        logger.info('Loaded feedback data', { 
          feedbackCount: loadedFeedbacks.length,
          lastUpdated: data.lastUpdated 
        });
      }
    } else {
      logger.info('No existing feedback data found, starting fresh');
    }
  } catch (error) {
    logger.error('Failed to initialize feedback service', { 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

/**
 * Flush feedback data to disk (debounced)
 */
const flushPersist = async () => {
  if (persistInFlight) {
    // Retry after current flush completes
    if (!persistTimer) {
      persistTimer = setTimeout(() => {
        persistTimer = null;
        void flushPersist();
      }, 50);
    }
    return;
  }

  const payload: FeedbackStorage = {
    feedbacks: feedbacks.slice(-MAX_FEEDBACKS),
    lastUpdated: new Date().toISOString(),
  };

  const tempFile = `${DATA_FILE}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`;

  persistInFlight = (async () => {
    try {
      await fs.promises.writeFile(tempFile, JSON.stringify(payload, null, 2), 'utf-8');
      await fs.promises.rename(tempFile, DATA_FILE);
      logger.debug('Feedback data persisted successfully');
    } catch (err) {
      logger.error('Failed to persist feedback data', { 
        error: err instanceof Error ? err.message : String(err) 
      });
      // Clean up temp file if it exists
      try {
        if (fs.existsSync(tempFile)) {
          await fs.promises.unlink(tempFile);
        }
      } catch { /* ignore */ }
    } finally {
      persistInFlight = null;
    }
  })();

  await persistInFlight;
};

/**
 * Schedule persistence (debounced)
 */
const schedulePersist = () => {
  if (persistTimer) {
    clearTimeout(persistTimer);
  }
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void flushPersist();
  }, 2000); // 2 second debounce
};

/**
 * Create a new feedback
 */
export const createFeedback = (
  userId: string,
  userName: string,
  userEmail: string,
  data: CreateFeedbackRequest
): Feedback => {
  const now = new Date().toISOString();
  
  const feedback: Feedback = {
    id: randomUUID(),
    userId,
    userName,
    userEmail,
    category: data.category,
    title: data.title,
    content: data.content,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    appVersion: data.appVersion,
    platform: data.platform,
  };

  feedbacks.push(feedback);

  // Trim old feedbacks if we exceed max
  if (feedbacks.length > MAX_FEEDBACKS) {
    feedbacks.splice(0, feedbacks.length - MAX_FEEDBACKS);
  }

  schedulePersist();

  logger.info('Feedback created', { 
    feedbackId: feedback.id,
    userId, 
    category: data.category,
    title: data.title,
  });

  return feedback;
};

/**
 * Get feedback by ID
 */
export const getFeedbackById = (id: string): Feedback | null => {
  return feedbacks.find(f => f.id === id) || null;
};

/**
 * Get feedbacks for a specific user
 */
export const getUserFeedbacks = (userId: string, limit = 50): Feedback[] => {
  return feedbacks
    .filter(f => f.userId === userId)
    .slice(-limit)
    .reverse();
};

/**
 * Get all feedbacks with pagination and filters (admin)
 */
export const getAllFeedbacks = (
  page = 1, 
  limit = 20,
  status?: FeedbackStatus,
  category?: FeedbackCategory
): { feedbacks: Feedback[], total: number, page: number, limit: number, hasMore: boolean } => {
  let filtered = [...feedbacks];
  
  if (status) {
    filtered = filtered.filter(f => f.status === status);
  }
  
  if (category) {
    filtered = filtered.filter(f => f.category === category);
  }
  
  // Sort by creation date (newest first)
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const total = filtered.length;
  const offset = (page - 1) * limit;

  // If the requested page is beyond the available data, return an empty result
  if (offset >= total) {
    return {
      feedbacks: [],
      total,
      page,
      limit,
      hasMore: false,
    };
  }
  const paged = filtered.slice(offset, offset + limit);
  
  return {
    feedbacks: paged,
    total,
    page,
    limit,
    hasMore: offset + paged.length < total,
  };
};

/**
 * Get feedback statistics (admin)
 */
export const getFeedbackStats = (): {
  total: number;
  pending: number;
  reviewed: number;
  resolved: number;
  closed: number;
  byCategory: Record<FeedbackCategory, number>;
} => {
  const stats = {
    total: feedbacks.length,
    pending: 0,
    reviewed: 0,
    resolved: 0,
    closed: 0,
    byCategory: {
      bug: 0,
      feature: 0,
      question: 0,
      other: 0,
    } as Record<FeedbackCategory, number>,
  };

  feedbacks.forEach(f => {
    stats[f.status]++;
    stats.byCategory[f.category]++;
  });

  return stats;
};

/**
 * Update feedback status (admin)
 */
export const updateFeedbackStatus = (
  id: string,
  status: FeedbackStatus,
  adminReply?: string
): Feedback | null => {
  const feedback = feedbacks.find(f => f.id === id);
  
  if (!feedback) {
    return null;
  }

  feedback.status = status;
  feedback.updatedAt = new Date().toISOString();
  
  if (adminReply !== undefined) {
    feedback.adminReply = adminReply;
  }

  schedulePersist();

  logger.info('Feedback status updated', { 
    feedbackId: id,
    status,
    hasReply: !!adminReply,
  });

  return feedback;
};

/**
 * Delete feedback (admin)
 */
export const deleteFeedback = (id: string): boolean => {
  const index = feedbacks.findIndex(f => f.id === id);
  
  if (index === -1) {
    return false;
  }

  feedbacks.splice(index, 1);
  schedulePersist();

  logger.info('Feedback deleted', { feedbackId: id });

  return true;
};

// Initialize on module load
initFeedbackService();

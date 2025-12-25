import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  UserEvent,
  EventType,
  UserActivitySummary,
  AnalyticsSummary,
  AnalyticsStorage,
} from '../types/index.js';
import { createLogger } from '../utils/index.js';

const logger = createLogger('analytics-service');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'analytics.json');

// Maximum events to keep in memory (prevent unlimited growth)
const MAX_EVENTS = 10000;

// In-memory storage
const events: UserEvent[] = [];
let persistTimer: NodeJS.Timeout | null = null;
let persistInFlight: Promise<void> | null = null;

/**
 * Initialize analytics service and load persisted data
 */
export const initAnalyticsService = () => {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      logger.info('Created data directory', { path: DATA_DIR });
    }

    // Load existing data if file exists
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data: AnalyticsStorage = JSON.parse(raw);
      
      // Restore events (limit to MAX_EVENTS)
      if (data.events && Array.isArray(data.events)) {
        const loadedEvents = data.events.slice(-MAX_EVENTS);
        events.push(...loadedEvents);
        logger.info('Loaded analytics data', { 
          eventCount: loadedEvents.length,
          lastUpdated: data.lastUpdated 
        });
      }
    } else {
      logger.info('No existing analytics data found, starting fresh');
    }
  } catch (error) {
    logger.error('Failed to initialize analytics service', { 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

/**
 * Flush analytics data to disk (debounced)
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

  const payload: AnalyticsStorage = {
    events: events.slice(-MAX_EVENTS), // Only persist most recent events
    lastUpdated: new Date().toISOString(),
  };

  const tempFile = `${DATA_FILE}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`;

  persistInFlight = (async () => {
    try {
      await fs.promises.writeFile(tempFile, JSON.stringify(payload, null, 2), 'utf-8');
      await fs.promises.rename(tempFile, DATA_FILE);
      logger.debug('Analytics data persisted successfully');
    } catch (err) {
      logger.error('Failed to persist analytics data', { 
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
 * Track a user event
 */
export const trackEvent = (
  userId: string,
  eventType: EventType,
  eventData?: Record<string, any>,
  userAgent?: string,
  ipAddress?: string
): UserEvent => {
  const event: UserEvent = {
    id: randomUUID(),
    userId,
    eventType,
    eventData,
    timestamp: new Date().toISOString(),
    userAgent,
    ipAddress,
  };

  events.push(event);

  // Trim old events if we exceed max
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }

  schedulePersist();

  logger.debug('Event tracked', { 
    userId, 
    eventType, 
    eventId: event.id 
  });

  return event;
};

/**
 * Get analytics summary for admin dashboard
 */
export const getAnalyticsSummary = (): AnalyticsSummary => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Count events by type
  const eventCounts: Record<string, number> = {};
  const uniqueUsers = new Set<string>();
  const activeUsersToday = new Set<string>();
  const activeUsersWeek = new Set<string>();

  events.forEach(event => {
    uniqueUsers.add(event.userId);
    eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;

    const eventTime = new Date(event.timestamp);
    if (eventTime >= oneDayAgo) {
      activeUsersToday.add(event.userId);
    }
    if (eventTime >= oneWeekAgo) {
      activeUsersWeek.add(event.userId);
    }
  });

  // Sort events by count
  const topEvents = Object.entries(eventCounts)
    .map(([eventType, count]) => ({ eventType: eventType as EventType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Get recent events (last 50)
  const recentEvents = events.slice(-50).reverse();

  return {
    totalEvents: events.length,
    totalUsers: uniqueUsers.size,
    activeUsersToday: activeUsersToday.size,
    activeUsersWeek: activeUsersWeek.size,
    topEvents,
    recentEvents,
  };
};

/**
 * Get activity summary for a specific user
 */
export const getUserActivitySummary = (userId: string): UserActivitySummary | null => {
  const userEvents = events.filter(e => e.userId === userId);
  
  if (userEvents.length === 0) {
    return null;
  }

  const eventCounts: Record<EventType, number> = {} as Record<EventType, number>;
  let lastActivity = userEvents[0].timestamp;

  userEvents.forEach(event => {
    eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
    if (event.timestamp > lastActivity) {
      lastActivity = event.timestamp;
    }
  });

  return {
    userId,
    totalEvents: userEvents.length,
    lastActivity,
    eventCounts,
  };
};

/**
 * Get recent events for a specific user
 */
export const getUserEvents = (userId: string, limit = 50): UserEvent[] => {
  return events
    .filter(e => e.userId === userId)
    .slice(-limit)
    .reverse();
};

/**
 * Get all events with pagination
 */
export const getEvents = (page = 1, limit = 50): { events: UserEvent[], total: number } => {
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    events: events.slice().reverse().slice(start, end),
    total: events.length,
  };
};

// Initialize on module load
initAnalyticsService();

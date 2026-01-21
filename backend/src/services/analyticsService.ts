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
 * Get user segmentation data
 */
export const getUserSegmentation = () => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Group events by user
  const userActivity: Record<string, { events: UserEvent[], firstActivity: string, lastActivity: string }> = {};

  events.forEach(event => {
    if (!userActivity[event.userId]) {
      userActivity[event.userId] = {
        events: [],
        firstActivity: event.timestamp,
        lastActivity: event.timestamp,
      };
    }
    userActivity[event.userId].events.push(event);
    if (event.timestamp < userActivity[event.userId].firstActivity) {
      userActivity[event.userId].firstActivity = event.timestamp;
    }
    if (event.timestamp > userActivity[event.userId].lastActivity) {
      userActivity[event.userId].lastActivity = event.timestamp;
    }
  });

  // Classify users
  const newUsers = Object.values(userActivity).filter(user =>
    new Date(user.firstActivity) >= oneWeekAgo
  ).length;

  const activeUsers = Object.values(userActivity).filter(user =>
    new Date(user.lastActivity) >= oneDayAgo
  ).length;

  const regularUsers = Object.values(userActivity).filter(user =>
    user.events.length >= 10
  ).length;

  const dormantUsers = Object.values(userActivity).filter(user =>
    new Date(user.lastActivity) < oneMonthAgo
  ).length;

  // User activity levels
  const activityLevels = {
    high: Object.values(userActivity).filter(user => user.events.length >= 50).length,
    medium: Object.values(userActivity).filter(user => user.events.length >= 10 && user.events.length < 50).length,
    low: Object.values(userActivity).filter(user => user.events.length >= 1 && user.events.length < 10).length,
  };

  return {
    totalUsers: Object.keys(userActivity).length,
    newUsers,
    activeUsers,
    regularUsers,
    dormantUsers,
    activityLevels,
  };
};

/**
 * Get time-based analytics data
 */
export const getTimeAnalytics = (days = 30) => {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Initialize time buckets
  const hourlyData: Record<string, number> = {};
  const dailyData: Record<string, number> = {};
  const weeklyData: Record<string, number> = {};

  // Fill time buckets
  for (let i = 0; i < days * 24; i++) {
    const date = new Date(startDate.getTime() + i * 60 * 60 * 1000);
    const hourKey = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
    hourlyData[hourKey] = 0;
  }

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dayKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
    dailyData[dayKey] = 0;
  }

  for (let i = 0; i < Math.ceil(days / 7); i++) {
    const weekStart = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const weekKey = `Week ${i + 1}`;
    weeklyData[weekKey] = 0;
  }

  // Fill data
  events.forEach(event => {
    const eventTime = new Date(event.timestamp);
    if (eventTime >= startDate) {
      // Hourly data
      const hourKey = eventTime.toISOString().slice(0, 13);
      if (hourlyData[hourKey] !== undefined) {
        hourlyData[hourKey]++;
      }

      // Daily data
      const dayKey = eventTime.toISOString().slice(0, 10);
      if (dailyData[dayKey] !== undefined) {
        dailyData[dayKey]++;
      }

      // Weekly data
      const daysSinceStart = Math.floor((eventTime.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const weekKey = `Week ${daysSinceStart + 1}`;
      if (weeklyData[weekKey] !== undefined) {
        weeklyData[weekKey]++;
      }
    }
  });

  // Convert to arrays for frontend
  const hourlyChart = Object.entries(hourlyData).map(([time, count]) => ({
    time,
    events: count,
  }));

  const dailyChart = Object.entries(dailyData).map(([date, count]) => ({
    date,
    events: count,
  }));

  const weeklyChart = Object.entries(weeklyData).map(([week, count]) => ({
    week,
    events: count,
  }));

  return {
    hourlyChart,
    dailyChart,
    weeklyChart,
  };
};

/**
 * Get user behavior patterns
 */
export const getUserBehaviorPatterns = () => {
  // Group events by user and event type
  const userBehavior: Record<string, Record<string, number>> = {};

  events.forEach(event => {
    if (!userBehavior[event.userId]) {
      userBehavior[event.userId] = {};
    }
    userBehavior[event.userId][event.eventType] = (userBehavior[event.userId][event.eventType] || 0) + 1;
  });

  // Calculate behavior patterns
  const behaviorPatterns = Object.values(userBehavior).reduce((acc, userEvents) => {
    const totalEvents = Object.values(userEvents).reduce((sum, count) => sum + count, 0);

    // Classify users by primary activity
    const maxEventType = Object.entries(userEvents).reduce((max, [type, count]) =>
      count > (max.count || 0) ? { type, count } : max
    , { type: '', count: 0 });

    if (maxEventType.type) {
      acc[maxEventType.type] = (acc[maxEventType.type] || 0) + 1;
    }

    return acc;
  }, {} as Record<string, number>);

  return {
    behaviorPatterns,
    userCount: Object.keys(userBehavior).length,
  };
};

/**
 * Get event time distribution analysis
 */
export const getEventTimeDistribution = () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Initialize time distribution buckets
  const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({ hour: i, events: 0, percentage: 0 }));
  const weekdayDistribution = Array.from({ length: 7 }, (_, i) => ({
    day: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][i],
    events: 0,
    percentage: 0
  }));
  const monthlyDistribution = Array.from({ length: 12 }, (_, i) => ({
    month: `${i + 1}月`,
    events: 0,
    percentage: 0
  }));

  // Filter recent events for detailed analysis
  const recentEvents = events.filter(event => new Date(event.timestamp) >= thirtyDaysAgo);

  // Analyze hourly distribution (last 7 days)
  const weeklyEvents = events.filter(event => new Date(event.timestamp) >= sevenDaysAgo);
  weeklyEvents.forEach(event => {
    const eventTime = new Date(event.timestamp);
    const hour = eventTime.getHours();
    hourlyDistribution[hour].events++;
  });

  // Analyze weekday distribution (last 30 days)
  recentEvents.forEach(event => {
    const eventTime = new Date(event.timestamp);
    const dayOfWeek = eventTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    weekdayDistribution[dayOfWeek].events++;
  });

  // Analyze monthly distribution (all data)
  events.forEach(event => {
    const eventTime = new Date(event.timestamp);
    const month = eventTime.getMonth(); // 0-11
    monthlyDistribution[month].events++;
  });

  // Calculate percentages
  const totalWeeklyEvents = weeklyEvents.length;
  const totalRecentEvents = recentEvents.length;
  const totalEvents = events.length;

  hourlyDistribution.forEach(hour => {
    hour.percentage = totalWeeklyEvents > 0 ? (hour.events / totalWeeklyEvents) * 100 : 0;
  });

  weekdayDistribution.forEach(day => {
    day.percentage = totalRecentEvents > 0 ? (day.events / totalRecentEvents) * 100 : 0;
  });

  monthlyDistribution.forEach(month => {
    month.percentage = totalEvents > 0 ? (month.events / totalEvents) * 100 : 0;
  });

  // Find peak hours and days
  const peakHour = hourlyDistribution.reduce((max, hour) =>
    hour.events > max.events ? hour : max
  , hourlyDistribution[0]);

  const peakDay = weekdayDistribution.reduce((max, day) =>
    day.events > max.events ? day : max
  , weekdayDistribution[0]);

  // Time of day analysis
  const morningEvents = weeklyEvents.filter(event => {
    const hour = new Date(event.timestamp).getHours();
    return hour >= 6 && hour < 12;
  }).length;

  const afternoonEvents = weeklyEvents.filter(event => {
    const hour = new Date(event.timestamp).getHours();
    return hour >= 12 && hour < 18;
  }).length;

  const eveningEvents = weeklyEvents.filter(event => {
    const hour = new Date(event.timestamp).getHours();
    return hour >= 18 && hour < 24;
  }).length;

  const nightEvents = weeklyEvents.filter(event => {
    const hour = new Date(event.timestamp).getHours();
    return hour >= 0 && hour < 6;
  }).length;

  const timeOfDay = {
    morning: { events: morningEvents, percentage: totalWeeklyEvents > 0 ? (morningEvents / totalWeeklyEvents) * 100 : 0 },
    afternoon: { events: afternoonEvents, percentage: totalWeeklyEvents > 0 ? (afternoonEvents / totalWeeklyEvents) * 100 : 0 },
    evening: { events: eveningEvents, percentage: totalWeeklyEvents > 0 ? (eveningEvents / totalWeeklyEvents) * 100 : 0 },
    night: { events: nightEvents, percentage: totalWeeklyEvents > 0 ? (nightEvents / totalWeeklyEvents) * 100 : 0 },
  };

  // Weekend vs Weekday analysis
  const weekendEvents = recentEvents.filter(event => {
    const day = new Date(event.timestamp).getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }).length;

  const weekdayEvents = totalRecentEvents - weekendEvents;

  const weekendVsWeekday = {
    weekend: { events: weekendEvents, percentage: totalRecentEvents > 0 ? (weekendEvents / totalRecentEvents) * 100 : 0 },
    weekday: { events: weekdayEvents, percentage: totalRecentEvents > 0 ? (weekdayEvents / totalRecentEvents) * 100 : 0 },
  };

  return {
    hourlyDistribution,
    weekdayDistribution,
    monthlyDistribution,
    timeOfDay,
    weekendVsWeekday,
    peakHour,
    peakDay,
    summary: {
      totalEventsAnalyzed: events.length,
      weeklyEventsAnalyzed: weeklyEvents.length,
      recentEventsAnalyzed: recentEvents.length,
    },
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

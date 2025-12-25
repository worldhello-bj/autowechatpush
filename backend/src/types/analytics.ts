/**
 * Analytics and User Activity Tracking Types
 */

export interface UserEvent {
  id: string;
  userId: string;
  eventType: EventType;
  eventData?: Record<string, any>;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}

export type EventType = 
  | 'user_login'
  | 'user_logout'
  | 'user_register'
  | 'article_generate'
  | 'article_publish'
  | 'article_save_draft'
  | 'material_upload'
  | 'material_delete'
  | 'page_view'
  | 'settings_update'
  | 'prompt_update'
  | 'ai_query';

export interface UserActivitySummary {
  userId: string;
  totalEvents: number;
  lastActivity: string;
  eventCounts: Record<EventType, number>;
}

export interface AnalyticsSummary {
  totalEvents: number;
  totalUsers: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  topEvents: Array<{
    eventType: EventType;
    count: number;
  }>;
  recentEvents: UserEvent[];
}

export interface AnalyticsStorage {
  events: UserEvent[];
  lastUpdated: string;
}

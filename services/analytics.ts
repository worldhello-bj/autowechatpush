/**
 * Frontend Analytics Service
 * Tracks user events and sends them to the backend
 */

const API_BASE = '/api/v1';

export type EventType = 
  | 'user_login'
  | 'user_logout'
  | 'user_register'
  | 'guest_mode_started'
  | 'article_generate'
  | 'article_publish'
  | 'article_save_draft'
  | 'article_import'
  | 'material_upload'
  | 'material_delete'
  | 'page_view'
  | 'settings_update'
  | 'prompt_update'
  | 'ai_query';

interface TrackEventOptions {
  eventType: EventType;
  eventData?: Record<string, any>;
}

class AnalyticsService {
  private queue: TrackEventOptions[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly FLUSH_DELAY = 2000; // 2 seconds
  private readonly MAX_QUEUE_SIZE = 10;

  /**
   * Track a user event
   */
  track(eventType: EventType, eventData?: Record<string, any>) {
    // Don't track if user is not logged in
    const token = localStorage.getItem('access_token') || localStorage.getItem('admin_access_token');
    if (!token) {
      return;
    }

    this.queue.push({ eventType, eventData });

    // Flush immediately if queue is large
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  /**
   * Schedule a flush
   */
  private scheduleFlush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    this.flushTimer = setTimeout(() => {
      this.flush();
    }, this.FLUSH_DELAY);
  }

  /**
   * Flush queued events to the backend
   */
  private async flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.queue.length === 0) {
      return;
    }

    const events = [...this.queue];
    this.queue = [];

    // Send events to backend (fire and forget - don't block UI)
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('admin_access_token');
      if (!token) {
        return;
      }

      // Send each event individually (backend expects one event at a time)
      for (const event of events) {
        await fetch(`${API_BASE}/analytics/event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(event),
        }).catch(() => {
          // Silently fail - don't disrupt user experience
        });
      }
    } catch (error) {
      // Silently fail - analytics should not break the app
      console.debug('Analytics tracking failed', error);
    }
  }

  /**
   * Flush on page unload
   */
  flushBeforeUnload() {
    // For page unload, we'll flush synchronously since sendBeacon can't include custom headers
    // The backend will need to handle events without authentication during unload
    // Alternative: store a short-lived unload token that can be included in the payload
    if (this.queue.length > 0) {
      // Attempt synchronous flush (may be interrupted by browser)
      this.flush();
    }
  }
}

// Singleton instance
const analytics = new AnalyticsService();

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analytics.flushBeforeUnload();
  });
}

export default analytics;

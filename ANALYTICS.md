# User Analytics Feature

## Overview

This document describes the user analytics and data collection feature that tracks user behavior and displays insights in the admin dashboard.

## Architecture

### Backend Components

1. **Analytics Types** (`backend/src/types/analytics.ts`)
   - Defines event types, user activity summaries, and analytics data structures
   - 12 event types tracked: login, logout, register, article generation, publish, draft save, material operations, page views, settings updates, AI queries

2. **Analytics Service** (`backend/src/services/analyticsService.ts`)
   - In-memory event storage with disk persistence (JSON file)
   - Automatic data persistence with debouncing (2-second delay)
   - Event trimming to prevent unlimited growth (max 10,000 events)
   - Provides analytics summaries and user activity reports

3. **Analytics Controller** (`backend/src/controllers/analyticsController.ts`)
   - Handles event recording from frontend
   - Provides admin-only endpoints for viewing analytics

4. **API Endpoints**
   - `POST /api/v1/analytics/event` - Track a user event (authenticated users)
   - `GET /api/v1/admin/analytics` - Get analytics summary (admin only)
   - `GET /api/v1/admin/analytics/events` - Get all events with pagination (admin only)
   - `GET /api/v1/admin/analytics/users/:userId` - Get user activity summary (admin only)
   - `GET /api/v1/admin/analytics/users/:userId/events` - Get user event history (admin only)

### Frontend Components

1. **Analytics Service** (`services/analytics.ts`)
   - Client-side event tracking with automatic batching
   - Queue-based system with automatic flushing
   - Fires events to backend asynchronously without blocking UI
   - Automatic flush on page unload

2. **Event Tracking Integration**
   - **AuthContext**: Tracks login, logout, and registration events
   - **App.tsx**: Tracks page view events
   - **Editor**: Tracks article generation, publish, and draft saves
   - **PromptEditor**: Tracks prompt configuration updates
   - **Settings**: Tracks settings updates (WeChat credentials)

3. **Admin Dashboard** (`admin/AdminApp.tsx`)
   - New "数据分析" (Analytics) tab
   - Displays key metrics:
     - Total events count
     - Active users (today and this week)
     - Total users tracked
   - Shows top event types with counts
   - Lists recent events with details (timestamp, user, event type, data)

## Event Types

| Event Type | Description | When Triggered |
|------------|-------------|----------------|
| `user_login` | User logs in | Successful login |
| `user_logout` | User logs out | Logout action |
| `user_register` | New user registration | Account creation |
| `article_generate` | AI article generation | Article generated successfully |
| `article_publish` | Article published to WeChat | Published to WeChat draft box |
| `article_save_draft` | Draft saved locally | Local draft save |
| `material_upload` | Material uploaded | File upload (future) |
| `material_delete` | Material deleted | Material deletion (future) |
| `page_view` | Page navigation | Route change |
| `settings_update` | Settings changed | Settings saved |
| `prompt_update` | Prompts modified | Prompt configuration saved |
| `ai_query` | AI query made | AI service called (future) |

## Data Storage

- **Location**: `backend/data/analytics.json`
- **Format**: JSON with events array and metadata
- **Persistence**: Automatic with 2-second debounce
- **Retention**: Last 10,000 events kept in memory and storage
- **Structure**:
  ```json
  {
    "events": [
      {
        "id": "uuid",
        "userId": "user-id",
        "eventType": "article_generate",
        "eventData": { "provider": "qwen", "useDualAI": true },
        "timestamp": "2024-01-01T00:00:00.000Z",
        "userAgent": "Mozilla/5.0...",
        "ipAddress": "192.168.1.1"
      }
    ],
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  }
  ```

## Security & Privacy

- All analytics endpoints require authentication
- Admin endpoints require admin role
- IP addresses and user agents are collected for context
- Event data is stored server-side and not accessible to regular users
- No sensitive user data (passwords, tokens) is tracked

## Future Enhancements

Potential improvements for the analytics system:

1. **User Segmentation**: Group users by behavior patterns
2. **Funnel Analysis**: Track conversion through key workflows
3. **Retention Metrics**: Measure user engagement over time
4. **Export Functionality**: Download analytics data as CSV/Excel
5. **Visualization**: Add charts and graphs to admin dashboard
6. **Alerting**: Notify admins of unusual patterns
7. **Real-time Updates**: Live dashboard with WebSocket updates
8. **Event Filtering**: Advanced search and filtering in admin panel
9. **User Journey Tracking**: Visualize individual user paths
10. **Performance Metrics**: Track API response times and errors

## Usage Example

### Tracking an Event (Frontend)

```typescript
import analytics from '../services/analytics';

// Track a custom event
analytics.track('article_generate', {
  provider: 'qwen',
  useDualAI: true,
  topicLength: 50
});
```

### Viewing Analytics (Admin Dashboard)

1. Log in as admin user
2. Navigate to Admin Dashboard
3. Click "数据分析" (Analytics) tab
4. View:
   - Summary cards with key metrics
   - Top events by frequency
   - Recent event history

## Implementation Notes

- Analytics tracking is fire-and-forget - errors don't disrupt user experience
- Events are batched to reduce API calls
- The system gracefully handles missing or invalid data
- All timestamps are in ISO 8601 format (UTC)
- Event data is flexible - can include any JSON-serializable data

## Testing

To test the analytics system:

1. Start the backend server
2. Start the frontend application
3. Perform various actions (login, generate article, etc.)
4. Check `backend/data/analytics.json` for recorded events
5. Log in to admin dashboard and view analytics tab
6. Verify events appear with correct data

## Troubleshooting

**Events not appearing in admin dashboard:**
- Check browser console for errors
- Verify user is authenticated (has valid token)
- Check backend logs for API errors
- Ensure `backend/data` directory has write permissions

**Analytics file not being created:**
- Ensure backend has write permissions to `backend/data/`
- Check backend logs for file system errors
- Verify the analytics service initialized correctly

**Missing event data:**
- Check that the tracking call includes the correct event type
- Verify the event data is JSON-serializable
- Look for JavaScript errors in browser console

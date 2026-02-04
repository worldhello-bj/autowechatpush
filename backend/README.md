# WeChat AI Publisher - Backend API

This is the backend API service for the WeChat AI Publisher application, built with TypeScript, Express, and modern Node.js best practices.

## Features

- **TypeScript + Express** - Type-safe backend with modern Node.js
- **JWT Authentication** - Secure access and refresh token system
- **Rate Limiting** - Prevent API abuse
- **Input Validation** - Zod schema validation
- **SSE Streaming** - Server-Sent Events for AI response streaming
- **Request Tracing** - X-Request-ID for debugging
- **Structured Logging** - JSON-formatted logs

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd backend
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `JWT_SECRET` | Secret for JWT signing (min 32 chars) | - |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:5173` |
| `DEEPSEEK_API_KEY` | DeepSeek API key (fallback if key pool not configured) | - |
| `DASHSCOPE_API_KEY` | Qwen API key (fallback if key pool not configured) | - |

### AI Key Pool (for High Concurrency)

For production deployments with high traffic, you can configure an AI key pool to distribute load across multiple API keys. See [AI_KEY_POOL.md](./AI_KEY_POOL.md) for detailed setup instructions.

**Important**: All API keys are managed by the backend. Users cannot and do not need to provide their own API keys. This ensures:
- 🔒 **Security**: Centralized key management prevents key leakage
- 🚀 **Simplicity**: Users focus on content creation, not API configuration
- 📊 **Control**: Administrators monitor and control API usage costs

Quick setup:
```bash
cd src/config
cp aikeys.example.json aikeys.json
# Edit aikeys.json with your API keys
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/health/live` | Liveness probe |
| GET | `/api/v1/health/ready` | Readiness probe |

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/token` | Login (get tokens) |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | Get current user |

### AI Generation

**🔒 Note**: All API keys are managed by the backend. Users cannot provide their own API keys for security reasons.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/ai/generate` | Generate article (main content generation) |
| POST | `/api/v1/ai/chat/stream` | SSE streaming generation |
| POST | `/api/v1/ai/helper` | AI helper functions (titles, summary, keywords, polish, translate, etc.) |
| GET | `/api/v1/ai/quota` | Get user quota |
| GET | `/api/v1/ai/features` | Get available AI features |

### User/Quota

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/user/quota` | Get user quota status |
| GET | `/api/v1/user/quota/check` | Check if user has sufficient quota |
| GET | `/api/v1/user/quota/history` | Get usage history |

### Materials

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/materials` | Upload material (image, video, SVG) |
| GET | `/api/v1/materials` | List user materials |
| GET | `/api/v1/materials/:id` | Get material by ID |
| DELETE | `/api/v1/materials/:id` | Delete material |

### Admin (requires admin role)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/stats` | Dashboard statistics |
| GET | `/api/v1/admin/users` | List all users |
| POST | `/api/v1/admin/users` | Create user |
| PATCH | `/api/v1/admin/users/:id/role` | Change user role |
| PATCH | `/api/v1/admin/users/:id/quota` | Update user quota |
| DELETE | `/api/v1/admin/users/:id` | Delete user |
| GET | `/api/v1/admin/analytics` | Get analytics summary |

### Analytics

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/analytics/event` | Track user event |

**AI Helper Actions** (via `/api/v1/ai/helper`):
- `generateTitles` - Generate title suggestions
- `generateSummary` - Generate content summary
- `extractKeywords` - Extract keywords from content
- `expandContent` - Expand/elaborate on content
- `polishContent` - Polish/refine content
- `translateContent` - Translate content to another language
- `suggestStyles` - Suggest writing style variations
- `generateHook` - Generate article hooks/intros
- `generateCTA` - Generate call-to-action
- `rewriteContent` - Rewrite content in different style

## Architecture

```
backend/
├── src/
│   ├── config/        # Environment configuration
│   ├── controllers/   # Request handlers
│   ├── middleware/    # Express middleware
│   ├── routes/        # API route definitions
│   ├── services/      # Business logic
│   ├── types/         # TypeScript types
│   ├── utils/         # Utility functions
│   └── index.ts       # Application entry
├── web/               # Frontend static files (optional)
├── dist/              # Compiled JavaScript
├── package.json
└── tsconfig.json
```

## Web Folder (Frontend Deployment)

The backend supports serving the frontend application directly. This allows you to deploy both frontend and backend as a single service, accessible through one domain.

### How to Use

1. **Build the frontend** in the project root:
   ```bash
   npm run build
   ```

2. **Copy the built files** to the backend web folder:
   ```bash
   cp -r dist/* backend/web/
   ```

3. **Deploy the backend** - it will automatically serve the frontend files

### Docker Deployment

When building with Docker, place the frontend files in `backend/web/` before building:

```bash
# Build frontend
npm run build

# Copy to backend web folder
cp -r dist/* backend/web/

# Build and run Docker image
cd backend
docker build -t wechat-ai-publisher .
docker run -d -p 3001:80 wechat-ai-publisher
```

Now accessing `http://your-domain` will serve the frontend application, while `/api/v1/*` routes are handled by the API.

## Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin protection
- **Rate Limiting** - Brute-force protection
- **JWT** - Stateless authentication
- **Input Validation** - Zod schema validation
- **Request ID** - Traceability

## Implementation Status

Current implementation includes:

- [x] Phase 1: Base Restructuring
  - [x] TypeScript + Express setup
  - [x] JWT authentication
  - [x] Health endpoints
  - [x] CORS and rate limiting
  - [x] Input validation

- [x] Phase 2: Core Business Migration
  - [x] AI service abstraction (DeepSeek, Qwen)
  - [x] AI Key Pool with load balancing
  - [x] SSE streaming infrastructure
  - [x] AI helper functions (10 helper actions)
  - [x] Material upload
  - [x] Frontend integration
  - [x] Automatic fallback between AI providers

- [x] Phase 3: Commercialization (Partial)
  - [x] User quota system with persistence
  - [x] Rate limiting middleware
  - [x] User data persistence (JSON files)
  - [x] Analytics and event tracking
  - [ ] BullMQ async queue (pending)

- [ ] Phase 4: Production Readiness
  - [ ] ClamAV/Sharp image processing
  - [ ] Dockerfile and docker-compose
  - [ ] CI/CD pipeline

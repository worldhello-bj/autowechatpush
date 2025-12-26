# WeChat AI Publisher - Backend API

This is the backend API service for the WeChat AI Publisher application. It follows the SaaS architecture transformation plan outlined in `TRANSFORMATION_PLAN.md`.

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

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/ai/generate` | Generate article |
| POST | `/api/v1/ai/chat/stream` | SSE streaming generation |
| GET | `/api/v1/ai/quota` | Get user quota |

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
├── dist/              # Compiled JavaScript
├── package.json
└── tsconfig.json
```

## Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin protection
- **Rate Limiting** - Brute-force protection
- **JWT** - Stateless authentication
- **Input Validation** - Zod schema validation
- **Request ID** - Traceability

## Roadmap

See `TRANSFORMATION_PLAN.md` for the full transformation roadmap. Current implementation covers:

- [x] Phase 1: Base Restructuring
  - [x] TypeScript + Express setup
  - [x] JWT authentication
  - [x] Health endpoints
  - [x] CORS and rate limiting
  - [x] Input validation

- [ ] Phase 2: Core Business Migration (In Progress)
  - [x] AI service abstraction
  - [x] SSE streaming infrastructure
  - [ ] Material upload
  - [ ] Frontend integration

- [ ] Phase 3: Commercialization
- [ ] Phase 4: Production Readiness

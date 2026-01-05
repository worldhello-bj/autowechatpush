# WeChat AI Publisher - Backend API
# Dockerfile for 微信云托管 (WeCloud) deployment

FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create web folder for frontend static files
# The .gitkeep file in backend/web/ ensures the folder exists in git even when empty.
# Place the built frontend static files in backend/web/ before building the Docker image,
# but keep the .gitkeep file so the directory remains tracked. If only .gitkeep is present,
# it will be copied to ./dist/web/, and the backend will correctly detect that no index.html exists.
RUN mkdir -p ./dist/web
COPY web/ ./dist/web/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=80

# Expose port (微信云托管默认使用80端口)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:80/api/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the server
CMD ["node", "dist/index.js"]

# API Gateway Dockerfile for Soccer Training Platform
FROM node:18-alpine AS base

# Install system dependencies
RUN apk update && apk add --no-cache \
    curl \
    postgresql15-client

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY packages/api-gateway/package*.json ./
COPY packages/shared/dist ./shared/

# Install dependencies with cache optimization
RUN npm ci --only=production --cache /tmp/npm-cache

# Development stage
FROM base AS development
WORKDIR /app

# Copy package files
COPY packages/api-gateway/package*.json ./

# Install all dependencies for development
RUN npm ci --cache /tmp/npm-cache

# Copy source code
COPY packages/api-gateway/ .
COPY packages/shared/dist ./shared/

# Generate Prisma Client
RUN npx prisma generate

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change to non-root user
USER nodejs

# Expose port
EXPOSE 6001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:6001/health || exit 1

# Start development server with hot reload
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY packages/api-gateway/ .
COPY packages/shared/dist ./shared/

# Generate Prisma Client for production
RUN npx prisma generate

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 6001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:6001/health || exit 1

# Start the application
CMD ["npm", "start"]
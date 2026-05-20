# Frontend Dockerfile for Soccer Training Platform
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY packages/frontend/package*.json ./
COPY packages/shared/dist ./shared/

# Install dependencies with cache optimization
RUN npm ci --only=production --cache /tmp/npm-cache

# Development stage
FROM base AS development
WORKDIR /app

# Copy package files
COPY packages/frontend/package*.json ./

# Install all dependencies for development
RUN npm ci --cache /tmp/npm-cache

# Copy source code
COPY packages/frontend/ .
COPY packages/shared/dist ./shared/

# Expose port
EXPOSE 6000

# Start development server with hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "6000"]

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY packages/frontend/ .
COPY packages/shared/dist ./shared/

# Set environment variables for build
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 6000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
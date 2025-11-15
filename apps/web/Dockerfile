# Multi-stage Dockerfile for Tessra Nuxt Application
# Optimized for production with minimal image size

# Build stage
FROM node:20.19.5-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY package*.json ./
COPY tsconfig.json ./

# Copy workspace packages
COPY packages/ ./packages/

# Copy web app
COPY apps/web/ ./apps/web/

# Install dependencies (including devDependencies for build)
RUN npm ci

# Build the application
WORKDIR /app/apps/web
RUN npm run build

# Production stage
FROM node:20.19.5-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nuxt -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=nuxt:nodejs /app/apps/web/.output /app/.output

# Create data directory for local storage
RUN mkdir -p /app/.data && chown -R nuxt:nodejs /app/.data

# Switch to non-root user
USER nuxt

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/admin/ping', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", ".output/server/index.mjs"]

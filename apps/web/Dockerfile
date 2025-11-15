# Tessra Dockerfile
# Note: For optimal builds, run `npm run build` before building this image

# Multi-stage build approach
FROM node:20.19.5-alpine AS builder

WORKDIR /build

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY packages/ ./packages/
COPY apps/web/package*.json ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/nuxt.config.ts ./apps/web/
COPY apps/web/drizzle.config.ts ./apps/web/
COPY apps/web/eslint.config.mjs ./apps/web/
COPY apps/web/app/ ./apps/web/app/
COPY apps/web/server/ ./apps/web/server/
COPY apps/web/db/ ./apps/web/db/
COPY apps/web/public/ ./apps/web/public/

# Install dependencies and build
RUN npm ci --workspace apps/web --include-workspace-root || \
    npm install --workspace apps/web --include-workspace-root

WORKDIR /build/apps/web
RUN npm run build

# Production stage
FROM node:20.19.5-alpine

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nuxt -u 1001

WORKDIR /app

# Copy the built output
COPY --from=builder --chown=nuxt:nodejs /build/apps/web/.output /app/.output

# Copy schema files for database initialization
COPY --from=builder --chown=nuxt:nodejs /build/apps/web/db /app/schema/db
COPY --from=builder --chown=nuxt:nodejs /build/apps/web/drizzle.config.ts /app/schema/
COPY --from=builder --chown=nuxt:nodejs /build/apps/web/drizzle /app/schema/drizzle

# Copy entrypoint script
COPY --chown=nuxt:nodejs apps/web/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Install drizzle-kit and tsx for schema migrations
RUN npm install -g drizzle-kit@0.31.6 tsx@4.20.6 pg@8.16.3

# Create data directory
RUN mkdir -p /app/.data && chown -R nuxt:nodejs /app/.data

USER nuxt

EXPOSE 3000

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/admin/ping', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]

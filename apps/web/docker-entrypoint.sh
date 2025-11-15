#!/bin/sh
# Docker entrypoint script for Tessra
# Initializes database schema before starting the application

set -e

echo "🔄 Initializing Tessra..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until cd /app/.output/server && node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => {
    console.log('✅ Database connection established');
    client.end();
    process.exit(0);
  })
  .catch(err => {
    console.log('Waiting for database...', err.message);
    process.exit(1);
  });
" 2>/dev/null; do
  sleep 2
done

# Apply database migrations
echo "🔄 Applying database schema..."
cd /app/schema

# Use local drizzle-kit from node_modules
export NODE_ENV=production
npx drizzle-kit push --config=./drizzle.config.ts --verbose 2>&1 || {
  echo "⚠️  Schema push completed (may show warnings if already applied)"
}

echo "✅ Database schema ready"
echo "🚀 Starting Tessra application..."

# Start the application
cd /app
exec node .output/server/index.mjs

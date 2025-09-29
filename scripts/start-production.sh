#!/bin/sh
set -e

echo "Starting Nexa Builder..."

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy || echo "Migration failed, continuing..."

# Start the application
echo "Starting Next.js server..."
exec node server.js
#!/bin/sh
set -e

echo "Running database migrations..."
# 'deploy' is the production-safe command for migrations
bunx prisma migrate deploy

echo "Migrations complete. Starting the app..."

# 'exec "$@"' runs the CMD (command) from the Dockerfile
exec "$@"
#!/bin/sh
set -e

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Deploy migrations (or push schema in dev)
echo "Pushing database schema..."
npx prisma db push

# Seed the database
echo "Seeding database..."
pnpm run prisma:seed

# Start the application
echo "Starting application..."
exec "$@"

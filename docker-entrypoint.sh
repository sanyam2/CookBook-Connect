#!/bin/sh

set -e  # Fail immediately if any command fails

# Fail early if DATABASE_URL is missing
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set"
  exit 1
fi

echo "📦 Checking Prisma client..."
if [ ! -d "node_modules/.prisma" ] || [ "prisma/schema.prisma" -nt "node_modules/.prisma" ]; then
  echo "🔧 Generating Prisma client..."
  npx prisma generate
else
  echo "✅ Prisma client is up to date"
fi

echo "⏳ Waiting for database to be ready..."
until npx prisma db push --accept-data-loss; do
  echo "🛑 Database is unavailable - sleeping 2s"
  sleep 2
done

echo "✅ Database is ready!"

# Start the app
echo "🚀 Starting app..."
exec node dist/main.js

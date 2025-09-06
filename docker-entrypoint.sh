#!/bin/sh

# Generate Prisma client if not exists or if schema changed
echo "Checking Prisma client..."
if [ ! -d "node_modules/.prisma" ] || [ "prisma/schema.prisma" -nt "node_modules/.prisma" ]; then
  echo "Generating Prisma client..."
  prisma generate
else
  echo "Prisma client is up to date"
fi

# Wait for database to be ready
echo "Waiting for database to be ready..."
until prisma db push --accept-data-loss; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready!"

# Start the application
exec node dist/main.js


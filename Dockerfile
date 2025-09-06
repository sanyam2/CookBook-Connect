# Use Node.js 20 Alpine
FROM node:20-alpine

WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Copy source code + Prisma schema
COPY . .

# Install dependencies
RUN npm ci

# Install Prisma CLI globally
RUN npm install -g prisma

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
RUN chown -R nestjs:nodejs /app
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the app using sh instead of chmod
CMD ["sh", "docker-entrypoint.sh"]

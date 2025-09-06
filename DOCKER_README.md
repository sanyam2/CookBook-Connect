# CookBook Connect - Docker Setup

This project uses Docker Compose to orchestrate all services including the NestJS backend, PostgreSQL, Redis, and Elasticsearch.

## Quick Start

1. **Copy environment template:**
   ```bash
   cp env.template .env
   ```

2. **Update environment variables (optional):**
   Edit the `.env` file to customize your configuration. The default values will work for development.

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f backend
   ```

5. **Stop all services:**
   ```bash
   docker-compose down
   ```

## Database Setup

The backend service automatically handles:
- **Prisma Client Generation**: Generated during Docker build
- **Database Migrations**: Applied automatically on startup via `prisma db push`
- **Schema Synchronization**: Database schema is kept in sync with Prisma schema

## Services

- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5433
- **Redis**: localhost:6379
- **Elasticsearch**: http://localhost:9200

## Health Checks

All services include health checks to ensure proper startup order:
- Backend waits for PostgreSQL, Redis, and Elasticsearch to be healthy
- Services will retry connections if dependencies aren't ready

## Development

For development with hot reload, you can run the backend locally while using Docker for dependencies:

```bash
# Start only dependencies
docker-compose up -d postgres redis elasticsearch

# Run backend locally
npm run start:dev
```

## Environment Variables

Key environment variables you can customize in `.env`:

- `POSTGRES_PASSWORD`: Database password
- `JWT_SECRET`: JWT signing secret (change in production!)
- `PORT`: Backend API port
- `NODE_ENV`: Environment (development/production)

## Troubleshooting

1. **Services not starting**: Check logs with `docker-compose logs [service-name]`
2. **Connection issues**: Ensure all services are healthy with `docker-compose ps`
3. **Port conflicts**: Update port mappings in `.env` file
4. **Database issues**: Check if PostgreSQL is accepting connections
5. **Prisma client errors**: The Dockerfile automatically generates the Prisma client during build
6. **Database migration issues**: The entrypoint script handles database schema synchronization automatically

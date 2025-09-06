import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url:
    process.env.DATABASE_URL ||
    'postgresql://cookbook:password@localhost:5432/cookbook_connect?schema=public',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'cookbook',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'cookbook_connect',
}));

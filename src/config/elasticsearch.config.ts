import { registerAs } from '@nestjs/config';

export default registerAs('elasticsearch', () => ({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  username: process.env.ELASTICSEARCH_USERNAME || '',
  password: process.env.ELASTICSEARCH_PASSWORD || '',
  maxRetries: parseInt(process.env.ELASTICSEARCH_MAX_RETRIES || '3', 10),
  requestTimeout:
    parseInt(process.env.ELASTICSEARCH_REQUEST_TIMEOUT || '30000', 10),
}));

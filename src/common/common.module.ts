import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { ElasticsearchService } from './services/elasticsearch.service';
import { RedisService } from './services/redis.service';
import { EventPublisherService } from './services/event-publisher.service';
import { SubscriptionManagerService } from './services/subscription-manager.service';

@Global()
@Module({
  providers: [PrismaService, ElasticsearchService, RedisService, EventPublisherService, SubscriptionManagerService],
  exports: [PrismaService, ElasticsearchService, RedisService, EventPublisherService, SubscriptionManagerService],
})
export class CommonModule {}
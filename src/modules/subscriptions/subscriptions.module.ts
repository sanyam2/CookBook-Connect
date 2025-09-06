import { Module } from '@nestjs/common';
import { SubscriptionsResolver } from './subscriptions.resolver';
import { SubscriptionManagerService } from '../../common/services/subscription-manager.service';
import { RedisService } from '../../common/services/redis.service';
import { EventPublisherService } from '../../common/services/event-publisher.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  providers: [
    SubscriptionsResolver,
    SubscriptionManagerService,
    RedisService,
    EventPublisherService,
    PrismaService,
  ],
  exports: [SubscriptionManagerService],
})
export class SubscriptionsModule {}

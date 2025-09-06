import { Module } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { RatingsResolver } from './ratings.resolver';
import { EventPublisherService } from '../../common/services/event-publisher.service';
import { RedisService } from '../../common/services/redis.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  providers: [
    RatingsService,
    RatingsResolver,
    EventPublisherService,
    RedisService,
    NotificationsService,
  ],
  exports: [RatingsService],
})
export class RatingsModule {}

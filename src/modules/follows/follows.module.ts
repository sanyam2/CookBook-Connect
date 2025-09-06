import { Module } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { FollowsResolver } from './follows.resolver';
import { EventPublisherService } from '../../common/services/event-publisher.service';
import { RedisService } from '../../common/services/redis.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  providers: [
    FollowsService,
    FollowsResolver,
    EventPublisherService,
    RedisService,
    NotificationsService,
  ],
  exports: [FollowsService],
})
export class FollowsModule {}

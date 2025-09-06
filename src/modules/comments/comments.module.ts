import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsResolver } from './comments.resolver';
import { EventPublisherService } from '../../common/services/event-publisher.service';
import { RedisService } from '../../common/services/redis.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  providers: [
    CommentsService,
    CommentsResolver,
    EventPublisherService,
    RedisService,
    NotificationsService,
  ],
  exports: [CommentsService],
})
export class CommentsModule {}

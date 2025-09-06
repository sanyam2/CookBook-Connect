import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { PrismaService } from '../../common/services/prisma.service';
import { EventPublisherService } from '../../common/services/event-publisher.service';
import { RedisService } from '../../common/services/redis.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  providers: [
    NotificationsService,
    NotificationsResolver,
    PrismaService,
    EventPublisherService,
    RedisService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}

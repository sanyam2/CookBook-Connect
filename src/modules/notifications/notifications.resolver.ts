import {
  Resolver,
  Query,
  Mutation,
  Args,
  Subscription,
  Context,
  InputType,
  Field,
  ObjectType,
  ID,
  Int,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubscriptionManagerService } from '../../common/services/subscription-manager.service';
import { EventPayload } from '../../common/types/events.types';
// import { PubSub } from 'graphql-subscriptions';

// DTOs
@ObjectType()
export class NotificationUser {
  @Field(() => ID)
  id: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  avatar?: string;
}

@ObjectType()
export class NotificationRecipe {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;
}

@ObjectType()
export class Notification {
  @Field(() => ID)
  id: string;

  @Field()
  type: string;

  @Field()
  message: string;

  @Field()
  read: boolean;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  readAt?: Date;

  @Field(() => ID, { nullable: true })
  recipeId?: string;

  @Field(() => ID, { nullable: true })
  fromUserId?: string;

  @Field(() => NotificationUser, { nullable: true })
  fromUser?: NotificationUser;

  @Field(() => NotificationRecipe, { nullable: true })
  recipe?: NotificationRecipe;
}

@InputType()
export class MarkAsReadInput {
  @Field()
  notificationId: string;
}

@Resolver(() => Notification)
export class NotificationsResolver {
  // private pubSub = new PubSub();

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly subscriptionManager: SubscriptionManagerService,
  ) {}

  @Query(() => [Notification])
  @UseGuards(JwtAuthGuard)
  async notifications(
    @CurrentUser() user: any,
    @Args('limit', { defaultValue: 20 }) limit: number,
    @Args('offset', { defaultValue: 0 }) offset: number,
  ) {
    return this.notificationsService.getUserNotifications(
      user.id,
      limit,
      offset,
    );
  }

  @Query(() => Int)
  @UseGuards(JwtAuthGuard)
  async unreadNotificationCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async markNotificationAsRead(
    @Args('input') input: MarkAsReadInput,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.markAsRead(input.notificationId, user.id);
  }

  @Mutation(() => Int)
  @UseGuards(JwtAuthGuard)
  async markAllNotificationsAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteNotification(
    @Args('notificationId') notificationId: string,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.deleteNotification(
      notificationId,
      user.id,
    );
  }

  @Subscription(() => Notification, {
    filter: (payload: EventPayload, variables: { userId: string }) => {
      return (
        payload.event.type === 'NOTIFICATION' &&
        payload.event.recipientId === variables.userId
      );
    },
  })
  @UseGuards(JwtAuthGuard)
  async notificationSubscription(
    @Args('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    // Ensure user can only subscribe to their own notifications
    if (user.id !== userId) {
      throw new Error(
        "Unauthorized: Cannot subscribe to other users' notifications",
      );
    }

    return this.subscriptionManager.getUserNotifications(userId);
  }
}

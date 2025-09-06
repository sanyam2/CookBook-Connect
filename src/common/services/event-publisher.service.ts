import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import {
  AppEvent,
  CHANNELS,
  RecipeEvent,
  RatingEvent,
  CommentEvent,
  FollowEvent,
  NotificationEvent,
  UserActivityEvent,
} from '../types/events.types';

@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  constructor(private readonly redisService: RedisService) {}

  private async publishEvent(event: AppEvent): Promise<void> {
    try {
      const channel = this.getChannelForEvent(event.type);
      const message = JSON.stringify(event);

      await this.redisService.publish(channel, message);
      this.logger.debug(`Published ${event.type} event to channel ${channel}`);
    } catch (error) {
      this.logger.error(`Failed to publish ${event.type} event:`, error);
      throw error;
    }
  }

  private getChannelForEvent(eventType: string): string {
    switch (eventType) {
      case 'RECIPE_CREATED':
        return CHANNELS.RECIPE_CREATED;
      case 'RECIPE_UPDATED':
        return CHANNELS.RECIPE_UPDATED;
      case 'RECIPE_DELETED':
        return CHANNELS.RECIPE_DELETED;
      case 'RATING_CREATED':
        return CHANNELS.RATING_CREATED;
      case 'RATING_UPDATED':
        return CHANNELS.RATING_UPDATED;
      case 'RATING_DELETED':
        return CHANNELS.RATING_DELETED;
      case 'COMMENT_CREATED':
        return CHANNELS.COMMENT_CREATED;
      case 'COMMENT_UPDATED':
        return CHANNELS.COMMENT_UPDATED;
      case 'COMMENT_DELETED':
        return CHANNELS.COMMENT_DELETED;
      case 'USER_FOLLOWED':
        return CHANNELS.USER_FOLLOWED;
      case 'USER_UNFOLLOWED':
        return CHANNELS.USER_UNFOLLOWED;
      case 'NOTIFICATION':
        return CHANNELS.NOTIFICATION;
      case 'USER_ACTIVITY':
        return CHANNELS.USER_ACTIVITY;
      default:
        throw new Error(`Unknown event type: ${eventType}`);
    }
  }

  // Recipe Events
  async publishRecipeCreated(
    event: Omit<RecipeEvent, 'type' | 'timestamp'>,
  ): Promise<void> {
    const recipeEvent: RecipeEvent = {
      ...event,
      type: 'RECIPE_CREATED',
      timestamp: new Date(),
    };
    await this.publishEvent(recipeEvent);
  }

  async publishRecipeUpdated(
    event: Omit<RecipeEvent, 'type' | 'timestamp'>,
  ): Promise<void> {
    const recipeEvent: RecipeEvent = {
      ...event,
      type: 'RECIPE_UPDATED',
      timestamp: new Date(),
    };
    await this.publishEvent(recipeEvent);
  }

  async publishRecipeDeleted(
    event: Omit<RecipeEvent, 'type' | 'timestamp'>,
  ): Promise<void> {
    const recipeEvent: RecipeEvent = {
      ...event,
      type: 'RECIPE_DELETED',
      timestamp: new Date(),
    };
    await this.publishEvent(recipeEvent);
  }

  // Rating Events
  async publishRatingCreated(
    event: Omit<RatingEvent, 'type' | 'timestamp'>,
  ): Promise<void> {
    const ratingEvent: RatingEvent = {
      ...event,
      type: 'RATING_CREATED',
      timestamp: new Date(),
    };
    await this.publishEvent(ratingEvent);
  }

  async publishRatingUpdated(
    event: Omit<RatingEvent, 'type' | 'timestamp'>,
  ): Promise<void> {
    const ratingEvent: RatingEvent = {
      ...event,
      type: 'RATING_UPDATED',
      timestamp: new Date(),
    };
    await this.publishEvent(ratingEvent);
  }

  async publishRatingDeleted(
    event: Omit<RatingEvent, 'type' | 'timestamp'>,
  ): Promise<void> {
    const ratingEvent: RatingEvent = {
      ...event,
      type: 'RATING_DELETED',
      timestamp: new Date(),
    };
    await this.publishEvent(ratingEvent);
  }

  // Comment Events
  async publishCommentCreated(
    event: Omit<CommentEvent, 'type' | 'timestamp'>,
  ): Promise<void> {
    const commentEvent: CommentEvent = {
      ...event,
      type: 'COMMENT_CREATED',
      timestamp: new Date(),
    };
    await this.publishEvent(commentEvent);
  }

  async publishCommentUpdated(
    event: Omit<CommentEvent, 'type' | 'timestamp'>,
  ): Promise<void> {
    const commentEvent: CommentEvent = {
      ...event,
      type: 'COMMENT_UPDATED',
      timestamp: new Date(),
    };
    await this.publishEvent(commentEvent);
  }

  async publishCommentDeleted(
    event: Omit<CommentEvent, 'type' | 'timestamp'>,
  ): Promise<void> {
    const commentEvent: CommentEvent = {
      ...event,
      type: 'COMMENT_DELETED',
      timestamp: new Date(),
    };
    await this.publishEvent(commentEvent);
  }

  // Follow Events
  async publishUserFollowed(
    event: Omit<FollowEvent, 'type' | 'timestamp'>,
  ): Promise<void> {
    const followEvent: FollowEvent = {
      ...event,
      type: 'USER_FOLLOWED',
      timestamp: new Date(),
    };
    await this.publishEvent(followEvent);
  }

  async publishUserUnfollowed(
    event: Omit<FollowEvent, 'type' | 'timestamp'>,
  ): Promise<void> {
    const followEvent: FollowEvent = {
      ...event,
      type: 'USER_UNFOLLOWED',
      timestamp: new Date(),
    };
    await this.publishEvent(followEvent);
  }

  // Notification Events
  async publishNotification(
    event: Omit<NotificationEvent, 'type' | 'timestamp'>,
  ): Promise<void> {
    const notificationEvent: NotificationEvent = {
      ...event,
      type: 'NOTIFICATION',
      timestamp: new Date(),
    };
    await this.publishEvent(notificationEvent);
  }

  // User Activity Events
  async publishUserActivity(
    event: Omit<UserActivityEvent, 'type' | 'timestamp'>,
  ): Promise<void> {
    const activityEvent: UserActivityEvent = {
      ...event,
      type: 'USER_ACTIVITY',
      timestamp: new Date(),
    };
    await this.publishEvent(activityEvent);
  }
}

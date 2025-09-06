import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { RedisService } from './redis.service';
import {
  AppEvent,
  CHANNELS,
  EventPayload,
  SubscriptionContext,
} from '../types/events.types';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class SubscriptionManagerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SubscriptionManagerService.name);
  private readonly eventSubjects = new Map<string, Subject<EventPayload>>();
  private readonly activeSubscriptions = new Set<string>();

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit() {
    // Wait a bit for Redis to be fully initialized
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Subscribe to all channels
    const channels = Object.values(CHANNELS);
    for (const channel of channels) {
      await this.subscribeToChannel(channel);
    }
  }

  async onModuleDestroy() {
    // Unsubscribe from all channels
    const channels = Object.values(CHANNELS);
    for (const channel of channels) {
      await this.redisService.unsubscribe(channel);
    }
  }

  private async subscribeToChannel(channel: string): Promise<void> {
    if (this.activeSubscriptions.has(channel)) {
      return;
    }

    try {
      // Retry logic for Redis subscription
      let retries = 3;
      while (retries > 0) {
        try {
          await this.redisService.subscribe(channel, (message: string) => {
            this.handleChannelMessage(channel, message);
          });

          this.activeSubscriptions.add(channel);
          this.logger.debug(`Subscribed to channel: ${channel}`);
          return;
        } catch (error) {
          retries--;
          if (retries === 0) {
            throw error;
          }
          this.logger.warn(`Failed to subscribe to ${channel}, retrying in 2 seconds... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      this.logger.error(`Failed to subscribe to channel ${channel} after retries:`, error);
    }
  }

  private handleChannelMessage(channel: string, message: string): void {
    try {
      const event: AppEvent = JSON.parse(message);
      const eventKey = this.getEventKey(event);

      // Get or create subject for this event type
      let subject = this.eventSubjects.get(eventKey);
      if (!subject) {
        subject = new Subject<EventPayload>();
        this.eventSubjects.set(eventKey, subject);
      }

      // Create payload and emit
      const payload: EventPayload = {
        event,
        data: this.extractEventData(event),
      };

      subject.next(payload);
      this.logger.debug(
        `Emitted event ${event.type} to ${eventKey} subscribers`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle message from channel ${channel}:`,
        error,
      );
    }
  }

  private getEventKey(event: AppEvent): string {
    switch (event.type) {
      case 'RECIPE_CREATED':
      case 'RECIPE_UPDATED':
      case 'RECIPE_DELETED':
        return `recipe:${event.recipeId}`;
      case 'RATING_CREATED':
      case 'RATING_UPDATED':
      case 'RATING_DELETED':
        return `recipe:${event.recipeId}`;
      case 'COMMENT_CREATED':
      case 'COMMENT_UPDATED':
      case 'COMMENT_DELETED':
        return `recipe:${event.recipeId}`;
      case 'USER_FOLLOWED':
      case 'USER_UNFOLLOWED':
        return `user:${event.followingId}`;
      case 'NOTIFICATION':
        return `notification:${event.recipientId}`;
      case 'USER_ACTIVITY':
        return `activity:${event.userId}`;
      default:
        return `global:${(event as any).type}`;
    }
  }

  private extractEventData(event: AppEvent): any {
    switch (event.type) {
      case 'RECIPE_CREATED':
      case 'RECIPE_UPDATED':
      case 'RECIPE_DELETED':
        return event.recipe;
      case 'RATING_CREATED':
      case 'RATING_UPDATED':
      case 'RATING_DELETED':
        return event.rating;
      case 'COMMENT_CREATED':
      case 'COMMENT_UPDATED':
      case 'COMMENT_DELETED':
        return event.comment;
      case 'USER_FOLLOWED':
      case 'USER_UNFOLLOWED':
        return { follower: event.follower, following: event.following };
      case 'NOTIFICATION':
        return event.notification;
      case 'USER_ACTIVITY':
        return {
          user: event.user,
          recipe: event.recipe,
          activityType: event.activityType,
        };
      default:
        return event;
    }
  }

  // Public methods for GraphQL subscriptions
  getRecipeUpdates(recipeId: string): Observable<EventPayload> {
    const eventKey = `recipe:${recipeId}`;
    let subject = this.eventSubjects.get(eventKey);
    if (!subject) {
      subject = new Subject<EventPayload>();
      this.eventSubjects.set(eventKey, subject);
    }
    return subject.asObservable();
  }

  getUserNotifications(userId: string): Observable<EventPayload> {
    const eventKey = `notification:${userId}`;
    let subject = this.eventSubjects.get(eventKey);
    if (!subject) {
      subject = new Subject<EventPayload>();
      this.eventSubjects.set(eventKey, subject);
    }
    return subject.asObservable();
  }

  getUserActivity(userId: string): Observable<EventPayload> {
    const eventKey = `activity:${userId}`;
    let subject = this.eventSubjects.get(eventKey);
    if (!subject) {
      subject = new Subject<EventPayload>();
      this.eventSubjects.set(eventKey, subject);
    }
    return subject.asObservable();
  }

  getRecipeFeed(userId: string): Observable<EventPayload> {
    // Recipe feed includes new recipes from followed users
    const eventKey = `feed:${userId}`;
    let subject = this.eventSubjects.get(eventKey);
    if (!subject) {
      subject = new Subject<EventPayload>();
      this.eventSubjects.set(eventKey, subject);
    }
    return subject.asObservable();
  }

  // Method to filter events for specific users (e.g., recipe feed)
  filterEventsForUser(userId: string, event: AppEvent): boolean {
    switch (event.type) {
      case 'RECIPE_CREATED':
        // Only include recipes from users that the current user follows
        // This would need to be implemented with a follow check
        return true; // Simplified for now
      case 'NOTIFICATION':
        return event.recipientId === userId;
      case 'USER_ACTIVITY':
        return event.userId === userId;
      default:
        return false;
    }
  }

  // Cleanup method for inactive subscriptions
  cleanupInactiveSubscriptions(): void {
    const now = Date.now();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [key, subject] of this.eventSubjects.entries()) {
      if (subject.observers.length === 0) {
        // Check if subject has been inactive for too long
        // This is a simplified cleanup - in production you'd want more sophisticated logic
        this.eventSubjects.delete(key);
        this.logger.debug(`Cleaned up inactive subscription: ${key}`);
      }
    }
  }
}

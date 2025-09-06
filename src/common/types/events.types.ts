// Redis Channels
export const CHANNELS = {
  RECIPE_CREATED: 'cookbook:recipe:created',
  RECIPE_UPDATED: 'cookbook:recipe:updated',
  RECIPE_DELETED: 'cookbook:recipe:deleted',
  RATING_CREATED: 'cookbook:rating:created',
  RATING_UPDATED: 'cookbook:rating:updated',
  RATING_DELETED: 'cookbook:rating:deleted',
  COMMENT_CREATED: 'cookbook:comment:created',
  COMMENT_UPDATED: 'cookbook:comment:updated',
  COMMENT_DELETED: 'cookbook:comment:deleted',
  USER_FOLLOWED: 'cookbook:user:followed',
  USER_UNFOLLOWED: 'cookbook:user:unfollowed',
  NOTIFICATION: 'cookbook:notification',
  USER_ACTIVITY: 'cookbook:user:activity',
} as const;

// Event Types
export type EventType =
  | 'RECIPE_CREATED'
  | 'RECIPE_UPDATED'
  | 'RECIPE_DELETED'
  | 'RATING_CREATED'
  | 'RATING_UPDATED'
  | 'RATING_DELETED'
  | 'COMMENT_CREATED'
  | 'COMMENT_UPDATED'
  | 'COMMENT_DELETED'
  | 'USER_FOLLOWED'
  | 'USER_UNFOLLOWED'
  | 'NOTIFICATION'
  | 'USER_ACTIVITY';

// Base Event Interface
export interface BaseEvent {
  type: EventType;
  timestamp: Date;
  userId?: string;
}

// Recipe Events
export interface RecipeEvent extends BaseEvent {
  type: 'RECIPE_CREATED' | 'RECIPE_UPDATED' | 'RECIPE_DELETED';
  recipeId: string;
  recipe?: {
    id: string;
    title: string;
    authorId: string;
    author?: {
      id: string;
      username: string;
      avatar?: string;
    };
  };
}

// Rating Events
export interface RatingEvent extends BaseEvent {
  type: 'RATING_CREATED' | 'RATING_UPDATED' | 'RATING_DELETED';
  ratingId: string;
  recipeId: string;
  rating?: {
    id: string;
    value: number;
    userId: string;
    recipeId: string;
  };
}

// Comment Events
export interface CommentEvent extends BaseEvent {
  type: 'COMMENT_CREATED' | 'COMMENT_UPDATED' | 'COMMENT_DELETED';
  commentId: string;
  recipeId: string;
  comment?: {
    id: string;
    content: string;
    userId: string;
    recipeId: string;
    user?: {
      id: string;
      username: string;
      avatar?: string;
    };
  };
}

// Follow Events
export interface FollowEvent extends BaseEvent {
  type: 'USER_FOLLOWED' | 'USER_UNFOLLOWED';
  followerId: string;
  followingId: string;
  follower?: {
    id: string;
    username: string;
    avatar?: string;
  };
  following?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

// Notification Events
export interface NotificationEvent extends BaseEvent {
  type: 'NOTIFICATION';
  notificationId: string;
  recipientId: string;
  notification: {
    id: string;
    type: string;
    message: string;
    recipeId?: string;
    fromUserId?: string;
    fromUser?: {
      id: string;
      username: string;
    };
    recipe?: {
      id: string;
      title: string;
    };
  };
}

// User Activity Events
export interface UserActivityEvent extends BaseEvent {
  type: 'USER_ACTIVITY';
  activityType: string;
  userId: string;
  user?: {
    id: string;
    username: string;
    avatar?: string;
  };
  recipe?: {
    id: string;
    title: string;
  };
  metadata?: Record<string, any>;
}

// Union type for all events
export type AppEvent =
  | RecipeEvent
  | RatingEvent
  | CommentEvent
  | FollowEvent
  | NotificationEvent
  | UserActivityEvent;

// Subscription Types
export interface SubscriptionContext {
  userId?: string;
  recipeId?: string;
  connectionId: string;
}

// Event Payload for GraphQL Subscriptions
export interface EventPayload<T = any> {
  event: AppEvent;
  data: T;
}

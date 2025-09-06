import { Resolver, Subscription, Args, ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubscriptionManagerService } from '../../common/services/subscription-manager.service';
import { EventPayload } from '../../common/types/events.types';

// DTOs for subscriptions
@ObjectType()
export class RecipeAuthor {
  @Field(() => ID)
  id: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  avatar?: string;
}

@ObjectType()
export class SubscriptionRecipe {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => RecipeAuthor)
  author: RecipeAuthor;

  @Field()
  createdAt: Date;

  @Field(() => Float, { nullable: true })
  averageRating?: number;

  @Field(() => Int, { nullable: true })
  ratingCount?: number;

  @Field(() => Int, { nullable: true })
  commentCount?: number;
}

@ObjectType()
export class RecipeComment {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field(() => RecipeAuthor)
  user: RecipeAuthor;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class RecipeUpdate {
  @Field(() => ID)
  id: string;

  @Field(() => Float, { nullable: true })
  averageRating?: number;

  @Field(() => Int, { nullable: true })
  ratingCount?: number;

  @Field(() => Int, { nullable: true })
  commentCount?: number;

  @Field(() => [RecipeComment], { nullable: true })
  latestComments?: RecipeComment[];
}

@ObjectType()
export class UserActivityUser {
  @Field(() => ID)
  id: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  avatar?: string;
}

@ObjectType()
export class UserActivityRecipe {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;
}

@ObjectType()
export class UserActivity {
  @Field()
  type: string;

  @Field(() => UserActivityUser)
  user: UserActivityUser;

  @Field(() => UserActivityRecipe, { nullable: true })
  recipe?: UserActivityRecipe;

  @Field()
  timestamp: Date;
}

@ObjectType()
export class SubscriptionNotificationRecipe {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;
}

@ObjectType()
export class SubscriptionNotificationFromUser {
  @Field(() => ID)
  id: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  avatar?: string;
}

@ObjectType()
export class SubscriptionNotification {
  @Field(() => ID)
  id: string;

  @Field()
  type: string;

  @Field()
  message: string;

  @Field(() => SubscriptionNotificationRecipe, { nullable: true })
  recipe?: SubscriptionNotificationRecipe;

  @Field(() => SubscriptionNotificationFromUser, { nullable: true })
  fromUser?: SubscriptionNotificationFromUser;

  @Field()
  createdAt: Date;
}

@Resolver()
export class SubscriptionsResolver {
  constructor(
    private readonly subscriptionManager: SubscriptionManagerService,
  ) {}

  @Subscription(() => SubscriptionRecipe, {
    filter: (payload: EventPayload, variables: { userId: string }) => {
      return payload.event.type === 'RECIPE_CREATED';
    },
  })
  @UseGuards(JwtAuthGuard)
  async recipeFeed(@Args('userId') userId: string, @CurrentUser() user: any) {
    // Ensure user can only subscribe to their own feed
    if (user.id !== userId) {
      throw new Error("Unauthorized: Cannot subscribe to other users' feed");
    }

    return this.subscriptionManager.getRecipeFeed(userId);
  }

  @Subscription(() => SubscriptionNotification, {
    filter: (payload: EventPayload, variables: { userId: string }) => {
      return (
        payload.event.type === 'NOTIFICATION' &&
        payload.event.recipientId === variables.userId
      );
    },
  })
  @UseGuards(JwtAuthGuard)
  async notifications(
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

  @Subscription(() => RecipeUpdate, {
    filter: (payload: EventPayload, variables: { recipeId: string }) => {
      return (
        (payload.event.type === 'RATING_CREATED' ||
          payload.event.type === 'RATING_UPDATED' ||
          payload.event.type === 'RATING_DELETED' ||
          payload.event.type === 'COMMENT_CREATED' ||
          payload.event.type === 'COMMENT_UPDATED' ||
          payload.event.type === 'COMMENT_DELETED') &&
        payload.event.recipeId === variables.recipeId
      );
    },
  })
  @UseGuards(JwtAuthGuard)
  async recipeUpdates(
    @Args('recipeId') recipeId: string,
    @CurrentUser() user: any,
  ) {
    // Check if user has access to this recipe (public or owned)
    // This would need to be implemented with proper authorization
    return this.subscriptionManager.getRecipeUpdates(recipeId);
  }

  @Subscription(() => UserActivity, {
    filter: (payload: EventPayload, variables: { userId: string }) => {
      return (
        payload.event.type === 'USER_ACTIVITY' &&
        payload.event.userId === variables.userId
      );
    },
  })
  @UseGuards(JwtAuthGuard)
  async userActivity(@Args('userId') userId: string, @CurrentUser() user: any) {
    // Ensure user can only subscribe to their own activity
    if (user.id !== userId) {
      throw new Error(
        "Unauthorized: Cannot subscribe to other users' activity",
      );
    }

    return this.subscriptionManager.getUserActivity(userId);
  }
}

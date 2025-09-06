import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { EventPublisherService } from '../../common/services/event-publisher.service';
import { NotificationEvent } from '../../common/types/events.types';

export interface CreateNotificationInput {
  recipientId: string;
  type: string;
  message: string;
  recipeId?: string;
  fromUserId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async createNotification(input: CreateNotificationInput) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          recipientId: input.recipientId,
          type: input.type,
          message: input.message,
          recipeId: input.recipeId,
          fromUserId: input.fromUserId,
          metadata: input.metadata,
          read: false,
        },
        include: {
          recipient: {
            select: {
              id: true,
              username: true,
            },
          },
          fromUser: {
            select: {
              id: true,
              username: true,
            },
          },
          recipe: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // Publish notification event
      await this.eventPublisher.publishNotification({
        notificationId: notification.id,
        recipientId: notification.recipientId,
        notification: {
          id: notification.id,
          type: notification.type,
          message: notification.message,
          recipeId: notification.recipeId || undefined,
          fromUserId: notification.fromUserId || undefined,
          fromUser: notification.fromUser || undefined,
          recipe: notification.recipe || undefined,
        },
      });

      this.logger.debug(
        `Created notification ${notification.id} for user ${input.recipientId}`,
      );
      return notification;
    } catch (error) {
      this.logger.error(`Failed to create notification:`, error);
      throw error;
    }
  }

  async getUserNotifications(userId: string, limit = 20, offset = 0) {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: {
          recipientId: userId,
        },
        include: {
          fromUser: {
            select: {
              id: true,
              username: true,
            },
          },
          recipe: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

      return notifications;
    } catch (error) {
      this.logger.error(
        `Failed to get notifications for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await this.prisma.notification.updateMany({
        where: {
          id: notificationId,
          recipientId: userId,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      return notification.count > 0;
    } catch (error) {
      this.logger.error(
        `Failed to mark notification ${notificationId} as read:`,
        error,
      );
      throw error;
    }
  }

  async markAllAsRead(userId: string) {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          recipientId: userId,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      return result.count;
    } catch (error) {
      this.logger.error(
        `Failed to mark all notifications as read for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async getUnreadCount(userId: string) {
    try {
      const count = await this.prisma.notification.count({
        where: {
          recipientId: userId,
          read: false,
        },
      });

      return count;
    } catch (error) {
      this.logger.error(
        `Failed to get unread count for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async deleteNotification(notificationId: string, userId: string) {
    try {
      const result = await this.prisma.notification.deleteMany({
        where: {
          id: notificationId,
          recipientId: userId,
        },
      });

      return result.count > 0;
    } catch (error) {
      this.logger.error(
        `Failed to delete notification ${notificationId}:`,
        error,
      );
      throw error;
    }
  }

  // Helper methods for creating specific notification types
  async createRecipeRatingNotification(
    recipeId: string,
    ratingUserId: string,
    ratingValue: number,
  ) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!recipe || recipe.authorId === ratingUserId) {
      return; // Don't notify for own recipes
    }

    const ratingUser = await this.prisma.user.findUnique({
      where: { id: ratingUserId },
      select: {
        id: true,
        username: true,
      },
    });

    await this.createNotification({
      recipientId: recipe.authorId,
      type: 'RECIPE_RATED',
      message: `${ratingUser?.username} rated your recipe "${recipe.title}" ${ratingValue} stars`,
      recipeId: recipe.id,
      fromUserId: ratingUserId,
    });
  }

  async createRecipeCommentNotification(
    recipeId: string,
    commentUserId: string,
  ) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!recipe || recipe.authorId === commentUserId) {
      return; // Don't notify for own recipes
    }

    const commentUser = await this.prisma.user.findUnique({
      where: { id: commentUserId },
      select: {
        id: true,
        username: true,
      },
    });

    await this.createNotification({
      recipientId: recipe.authorId,
      type: 'RECIPE_COMMENTED',
      message: `${commentUser?.username} commented on your recipe "${recipe.title}"`,
      recipeId: recipe.id,
      fromUserId: commentUserId,
    });
  }

  async createFollowNotification(followerId: string, followingId: string) {
    const follower = await this.prisma.user.findUnique({
      where: { id: followerId },
      select: {
        id: true,
        username: true,
      },
    });

    await this.createNotification({
      recipientId: followingId,
      type: 'USER_FOLLOWED',
      message: `${follower?.username} started following you`,
      fromUserId: followerId,
    });
  }
}

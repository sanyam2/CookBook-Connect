import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { EventPublisherService } from '../../common/services/event-publisher.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private eventPublisher: EventPublisherService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createCommentInput: CreateCommentInput, userId: string) {
    // Check if recipe exists
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: createCommentInput.recipeId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        ...createCommentInput,
        userId,
      },
      include: {
        user: {
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

    // Publish comment created event
    await this.eventPublisher.publishCommentCreated({
      commentId: comment.id,
      recipeId: comment.recipeId,
      userId: userId,
      comment: {
        id: comment.id,
        content: comment.content,
        userId: comment.userId,
        recipeId: comment.recipeId,
        user: {
          id: comment.user.id,
          username: comment.user.username,
        },
      },
    });

    // Create notification for recipe author
    await this.notificationsService.createRecipeCommentNotification(
      comment.recipeId,
      userId,
    );

    return comment;
  }

  async update(
    id: string,
    updateCommentInput: UpdateCommentInput,
    userId: string,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new NotFoundException('You can only update your own comments');
    }

    return this.prisma.comment.update({
      where: { id },
      data: updateCommentInput,
      include: {
        user: {
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
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new NotFoundException('You can only delete your own comments');
    }

    return this.prisma.comment.delete({
      where: { id },
    });
  }

  async findByRecipe(recipeId: string, skip?: number, take?: number) {
    return this.prisma.comment.findMany({
      where: { recipeId },
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByUser(userId: string, skip?: number, take?: number) {
    return this.prisma.comment.findMany({
      where: { userId },
      skip,
      take,
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

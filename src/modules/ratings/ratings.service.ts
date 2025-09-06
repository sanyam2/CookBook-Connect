import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { EventPublisherService } from '../../common/services/event-publisher.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRatingInput } from './dto/create-rating.input';
import { UpdateRatingInput } from './dto/update-rating.input';

@Injectable()
export class RatingsService {
  constructor(
    private prisma: PrismaService,
    private eventPublisher: EventPublisherService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createRatingInput: CreateRatingInput, userId: string) {
    // Check if recipe exists
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: createRatingInput.recipeId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Check if user already rated this recipe
    const existingRating = await this.prisma.rating.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId: createRatingInput.recipeId,
        },
      },
    });

    if (existingRating) {
      throw new ConflictException('You have already rated this recipe');
    }

    const rating = await this.prisma.rating.create({
      data: {
        ...createRatingInput,
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
          include: {
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    // Publish rating created event
    await this.eventPublisher.publishRatingCreated({
      ratingId: rating.id,
      recipeId: rating.recipeId,
      userId: userId,
      rating: {
        id: rating.id,
        value: rating.rating,
        userId: rating.userId,
        recipeId: rating.recipeId,
      },
    });

    // Create notification for recipe author
    await this.notificationsService.createRecipeRatingNotification(
      rating.recipeId,
      userId,
      rating.rating,
    );

    return rating;
  }

  async update(
    id: string,
    updateRatingInput: UpdateRatingInput,
    userId: string,
  ) {
    const rating = await this.prisma.rating.findUnique({
      where: { id },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    if (rating.userId !== userId) {
      throw new NotFoundException('You can only update your own ratings');
    }

    return this.prisma.rating.update({
      where: { id },
      data: updateRatingInput,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        recipe: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const rating = await this.prisma.rating.findUnique({
      where: { id },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    if (rating.userId !== userId) {
      throw new NotFoundException('You can only delete your own ratings');
    }

    return this.prisma.rating.delete({
      where: { id },
    });
  }

  async findByRecipe(recipeId: string, skip?: number, take?: number) {
    return this.prisma.rating.findMany({
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
    return this.prisma.rating.findMany({
      where: { userId },
      skip,
      take,
      include: {
        recipe: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
              },
            },
            ingredients: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAverageRating(recipeId: string) {
    const result = await this.prisma.rating.aggregate({
      where: { recipeId },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    return {
      average: result._avg.rating || 0,
      count: result._count.rating,
    };
  }

  async getUserRating(userId: string, recipeId: string) {
    return this.prisma.rating.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId,
        },
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
  }
}

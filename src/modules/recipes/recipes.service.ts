import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { EventPublisherService } from '../../common/services/event-publisher.service';
import { CreateRecipeInput } from './dto/create-recipe.input';
import { UpdateRecipeInput } from './dto/update-recipe.input';
import { RecipeFilterInput } from './dto/recipe-filter.input';
import { RecipeIndexingService } from '../search/recipe-indexing.service';

@Injectable()
export class RecipesService {
  constructor(
    private prisma: PrismaService,
    private eventPublisher: EventPublisherService,
    // @Inject(forwardRef(() => 'RecipeIndexingService'))
    private recipeIndexingService?: RecipeIndexingService,
  ) {}

  async create(createRecipeInput: CreateRecipeInput, authorId: string) {
    const recipe = await this.prisma.recipe.create({
      data: {
        ...createRecipeInput,
        authorId,
      },
      include: {
        author: true,
        ingredients: true,
        instructions: true,
        ratings: {
          include: {
            user: true,
          },
        },
        comments: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            ratings: true,
            comments: true,
          },
        },
      },
    });

    // Index the new recipe in Elasticsearch
    if (this.recipeIndexingService) {
      await this.recipeIndexingService.indexRecipe(recipe.id);
    }

    // Publish recipe created event
    await this.eventPublisher.publishRecipeCreated({
      recipeId: recipe.id,
      userId: authorId,
      recipe: {
        id: recipe.id,
        title: recipe.title,
        authorId: recipe.authorId,
        author: {
          id: recipe.author.id,
          username: recipe.author.username,
        },
      },
    });

    return recipe;
  }

  async findAll(filter: RecipeFilterInput = {}) {
    const {
      search,
      difficulty,
      maxPrepTime,
      maxCookTime,
      authorId,
      ingredient,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      skip = 0,
      take = 20,
    } = filter;

    const where: any = {
      isPublic: true,
    };

    // Search in title and description
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by difficulty
    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Filter by prep time
    if (maxPrepTime !== undefined) {
      where.prepTime = { lte: maxPrepTime };
    }

    // Filter by cook time
    if (maxCookTime !== undefined) {
      where.cookTime = { lte: maxCookTime };
    }

    // Filter by author
    if (authorId) {
      where.authorId = authorId;
    }

    // Filter by ingredient
    if (ingredient) {
      where.ingredients = {
        some: {
          name: { contains: ingredient, mode: 'insensitive' },
        },
      };
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    return this.prisma.recipe.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        ingredients: true,
        instructions: {
          orderBy: {
            stepNumber: 'asc',
          },
        },
        ratings: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        comments: {
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
        },
        _count: {
          select: {
            ratings: true,
            comments: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        ingredients: true,
        instructions: {
          orderBy: {
            stepNumber: 'asc',
          },
        },
        ratings: {
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
        },
        comments: {
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
        },
        _count: {
          select: {
            ratings: true,
            comments: true,
          },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    return recipe;
  }

  async update(
    id: string,
    updateRecipeInput: UpdateRecipeInput,
    userId: string,
  ) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.authorId !== userId) {
      throw new ForbiddenException('You can only update your own recipes');
    }

    const updatedRecipe = await this.prisma.recipe.update({
      where: { id },
      data: updateRecipeInput,
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        ingredients: true,
        instructions: {
          orderBy: {
            stepNumber: 'asc',
          },
        },
        ratings: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            ratings: true,
            comments: true,
          },
        },
      },
    });

    // Update the recipe in Elasticsearch
    if (this.recipeIndexingService) {
      await this.recipeIndexingService.updateRecipe(id);
    }

    // Publish recipe updated event
    await this.eventPublisher.publishRecipeUpdated({
      recipeId: updatedRecipe.id,
      userId: userId,
      recipe: {
        id: updatedRecipe.id,
        title: updatedRecipe.title,
        authorId: updatedRecipe.authorId,
        author: {
          id: updatedRecipe.author.id,
          username: updatedRecipe.author.username,
        },
      },
    });

    return updatedRecipe;
  }

  async remove(id: string, userId: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own recipes');
    }

    const deletedRecipe = await this.prisma.recipe.delete({
      where: { id },
    });

    // Remove the recipe from Elasticsearch
    if (this.recipeIndexingService) {
      await this.recipeIndexingService.deleteRecipe(id);
    }

    // Publish recipe deleted event
    await this.eventPublisher.publishRecipeDeleted({
      recipeId: deletedRecipe.id,
      userId: userId,
      recipe: {
        id: deletedRecipe.id,
        title: deletedRecipe.title,
        authorId: deletedRecipe.authorId,
      },
    });

    return deletedRecipe;
  }

  // Complex queries
  async getRecipesWithAverageRatings(limit: number = 10) {
    return this.prisma.recipe.findMany({
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        ratings: true,
        _count: {
          select: {
            ratings: true,
            comments: true,
          },
        },
      },
      orderBy: {
        ratings: {
          _count: 'desc',
        },
      },
    });
  }

  async getRecipesByIngredients(ingredients: string[], limit: number = 20) {
    return this.prisma.recipe.findMany({
      take: limit,
      where: {
        ingredients: {
          some: {
            name: {
              in: ingredients,
              mode: 'insensitive',
            },
          },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        ingredients: true,
        ratings: true,
        _count: {
          select: {
            ratings: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getRecipesByUserRatingHistory(userId: string, limit: number = 20) {
    // Get user's rating history to find their preferences
    const userRatings = await this.prisma.rating.findMany({
      where: { userId },
      include: {
        recipe: {
          include: {
            ingredients: true,
          },
        },
      },
    });

    // Extract preferred ingredients from highly rated recipes
    const preferredIngredients = userRatings
      .filter((rating) => rating.rating >= 4)
      .flatMap((rating) => rating.recipe.ingredients.map((ing) => ing.name));

    // Find recipes with similar ingredients
    return this.prisma.recipe.findMany({
      take: limit,
      where: {
        authorId: { not: userId }, // Don't recommend own recipes
        ingredients: {
          some: {
            name: {
              in: preferredIngredients,
              mode: 'insensitive',
            },
          },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        ingredients: true,
        ratings: true,
        _count: {
          select: {
            ratings: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUserFeed(userId: string, limit: number = 20) {
    // Get recipes from users that the current user follows
    return this.prisma.recipe.findMany({
      take: limit,
      where: {
        author: {
          followers: {
            some: {
              followerId: userId,
            },
          },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        ingredients: true,
        ratings: true,
        _count: {
          select: {
            ratings: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

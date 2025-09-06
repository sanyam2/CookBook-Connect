import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateIngredientInput } from './dto/create-ingredient.input';
import { UpdateIngredientInput } from './dto/update-ingredient.input';

@Injectable()
export class IngredientsService {
  constructor(private prisma: PrismaService) {}

  async create(createIngredientInput: CreateIngredientInput, userId: string) {
    // Verify user owns the recipe
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: createIngredientInput.recipeId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.authorId !== userId) {
      throw new ForbiddenException(
        'You can only add ingredients to your own recipes',
      );
    }

    return this.prisma.ingredient.create({
      data: createIngredientInput,
      include: {
        recipe: true,
      },
    });
  }

  async findAll(recipeId?: string) {
    const where = recipeId ? { recipeId } : {};

    return this.prisma.ingredient.findMany({
      where,
      include: {
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
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
      include: {
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

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    return ingredient;
  }

  async update(
    id: string,
    updateIngredientInput: UpdateIngredientInput,
    userId: string,
  ) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
      include: {
        recipe: true,
      },
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    if (ingredient.recipe.authorId !== userId) {
      throw new ForbiddenException(
        'You can only update ingredients in your own recipes',
      );
    }

    return this.prisma.ingredient.update({
      where: { id },
      data: updateIngredientInput,
      include: {
        recipe: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
      include: {
        recipe: true,
      },
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    if (ingredient.recipe.authorId !== userId) {
      throw new ForbiddenException(
        'You can only delete ingredients from your own recipes',
      );
    }

    return this.prisma.ingredient.delete({
      where: { id },
    });
  }

  async findByRecipe(recipeId: string) {
    return this.prisma.ingredient.findMany({
      where: { recipeId },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async searchIngredients(query: string, limit: number = 20) {
    return this.prisma.ingredient.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: limit,
      distinct: ['name'],
      orderBy: {
        name: 'asc',
      },
    });
  }
}

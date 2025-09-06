import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { ElasticsearchService } from '../../common/services/elasticsearch.service';

@Injectable()
export class RecipeIndexingService implements OnModuleInit {
  private readonly logger = new Logger(RecipeIndexingService.name);

  constructor(
    private prisma: PrismaService,
    private elasticsearchService: ElasticsearchService,
  ) {}

  async onModuleInit() {
    // Wait a bit for Elasticsearch to be fully initialized
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Index all existing recipes on startup
    await this.indexAllRecipes();
  }

  async indexAllRecipes() {
    try {
      this.logger.log('Starting to index all recipes...');

      const recipes = await this.prisma.recipe.findMany({
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
          ingredients: true,
          instructions: {
            orderBy: { stepNumber: 'asc' },
          },
          ratings: true,
          comments: true,
        },
      });

      if (recipes.length === 0) {
        this.logger.log('No recipes found to index');
        return;
      }

      this.logger.log(`Found ${recipes.length} recipes to index`);

      const recipesToIndex = await Promise.all(
        recipes.map((recipe) => this.prepareRecipeForIndexing(recipe)),
      );

      await this.elasticsearchService.bulkIndexRecipes(recipesToIndex);
      await this.elasticsearchService.refreshIndex('recipes');

      this.logger.log(`Successfully indexed ${recipes.length} recipes`);
    } catch (error) {
      this.logger.error('Error indexing recipes:', error);
    }
  }

  async indexRecipe(recipeId: string) {
    try {
      const recipe = await this.prisma.recipe.findUnique({
        where: { id: recipeId },
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
          ingredients: true,
          instructions: {
            orderBy: { stepNumber: 'asc' },
          },
          ratings: true,
          comments: true,
        },
      });

      if (!recipe) {
        this.logger.warn(`Recipe ${recipeId} not found for indexing`);
        return;
      }

      const indexedRecipe = await this.prepareRecipeForIndexing(recipe);
      await this.elasticsearchService.indexRecipe(indexedRecipe);

      this.logger.log(`Indexed recipe: ${recipeId}`);
    } catch (error) {
      this.logger.error(`Error indexing recipe ${recipeId}:`, error);
    }
  }

  async updateRecipe(recipeId: string) {
    await this.indexRecipe(recipeId);
  }

  async deleteRecipe(recipeId: string) {
    try {
      await this.elasticsearchService.deleteRecipe(recipeId);
      this.logger.log(`Deleted recipe from index: ${recipeId}`);
    } catch (error) {
      this.logger.error(`Error deleting recipe ${recipeId} from index:`, error);
    }
  }

  async indexIngredient(ingredient: any) {
    try {
      await this.elasticsearchService.indexIngredient({
        name: ingredient.name.toLowerCase(),
        category: this.categorizeIngredient(ingredient.name),
        usageCount: 1,
        lastUsed: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error indexing ingredient ${ingredient.name}:`, error);
    }
  }

  private async prepareRecipeForIndexing(recipe: any): Promise<any> {
    const averageRating =
      recipe.ratings.length > 0
        ? recipe.ratings.reduce(
            (sum: number, rating: any) => sum + rating.rating,
            0,
          ) / recipe.ratings.length
        : 0;

    return {
      ...recipe,
      totalTime: (recipe.prepTime || 0) + (recipe.cookTime || 0),
      ingredients: recipe.ingredients.map((ing: any) => ({
        ...ing,
        name: ing.name.toLowerCase(),
      })),
      averageRating,
      ratingCount: recipe.ratings.length,
      commentCount: recipe.comments.length,
      tags: this.extractTags(recipe),
      cuisine: this.detectCuisine(recipe),
    };
  }

  private categorizeIngredient(ingredientName: string): string {
    const name = ingredientName.toLowerCase();

    if (
      name.includes('chicken') ||
      name.includes('beef') ||
      name.includes('pork') ||
      name.includes('lamb')
    ) {
      return 'meat';
    }
    if (
      name.includes('salmon') ||
      name.includes('tuna') ||
      name.includes('fish') ||
      name.includes('shrimp')
    ) {
      return 'seafood';
    }
    if (
      name.includes('onion') ||
      name.includes('garlic') ||
      name.includes('tomato') ||
      name.includes('pepper')
    ) {
      return 'vegetables';
    }
    if (
      name.includes('apple') ||
      name.includes('banana') ||
      name.includes('orange') ||
      name.includes('berry')
    ) {
      return 'fruits';
    }
    if (
      name.includes('flour') ||
      name.includes('sugar') ||
      name.includes('salt') ||
      name.includes('pepper')
    ) {
      return 'pantry';
    }
    if (
      name.includes('milk') ||
      name.includes('cheese') ||
      name.includes('butter') ||
      name.includes('cream')
    ) {
      return 'dairy';
    }

    return 'other';
  }

  private extractTags(recipe: any): string[] {
    const tags: string[] = [];

    // Extract tags from ingredients
    recipe.ingredients.forEach((ingredient: any) => {
      const category = this.categorizeIngredient(ingredient.name);
      if (!tags.includes(category)) {
        tags.push(category);
      }
    });

    // Add difficulty tag
    if (recipe.difficulty) {
      tags.push(recipe.difficulty);
    }

    // Add time-based tags
    if (recipe.prepTime && recipe.prepTime <= 15) {
      tags.push('quick-prep');
    }
    if (recipe.cookTime && recipe.cookTime <= 30) {
      tags.push('quick-cook');
    }
    if (recipe.totalTime && recipe.totalTime <= 30) {
      tags.push('quick-meal');
    }

    return tags;
  }

  private detectCuisine(recipe: any): string {
    const title = recipe.title.toLowerCase();
    const description = recipe.description?.toLowerCase() || '';
    const ingredients = recipe.ingredients
      .map((ing: any) => ing.name.toLowerCase())
      .join(' ');

    const cuisineKeywords = {
      italian: [
        'pasta',
        'pizza',
        'parmesan',
        'basil',
        'oregano',
        'marinara',
        'mozzarella',
      ],
      mexican: [
        'taco',
        'burrito',
        'salsa',
        'cilantro',
        'lime',
        'jalapeño',
        'cumin',
        'chili',
      ],
      chinese: ['soy sauce', 'ginger', 'sesame', 'bok choy', 'wok', 'stir fry'],
      indian: [
        'curry',
        'turmeric',
        'cumin',
        'coriander',
        'garam masala',
        'cardamom',
      ],
      french: ['butter', 'cream', 'wine', 'herbs', 'bouquet garni'],
      thai: [
        'coconut milk',
        'lemongrass',
        'fish sauce',
        'thai basil',
        'lime leaves',
      ],
      mediterranean: [
        'olive oil',
        'feta',
        'olives',
        'oregano',
        'lemon',
        'tomatoes',
      ],
      american: ['burger', 'bacon', 'cheese', 'bbq', 'ranch'],
    };

    for (const [cuisine, keywords] of Object.entries(cuisineKeywords)) {
      const text = `${title} ${description} ${ingredients}`;
      const matchCount = keywords.filter((keyword) =>
        text.includes(keyword),
      ).length;

      if (matchCount >= 2) {
        return cuisine;
      }
    }

    return 'international';
  }
}

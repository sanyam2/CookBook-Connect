import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '../../common/services/elasticsearch.service';
import { PrismaService } from '../../common/services/prisma.service';
import { SearchInput } from './dto/search.input';
import { SearchResult } from './dto/search-result.type';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private elasticsearchService: ElasticsearchService,
    private prisma: PrismaService,
  ) {}

  async searchRecipes(searchInput: SearchInput): Promise<SearchResult> {
    const {
      query,
      ingredients,
      cuisine,
      difficulty,
      maxPrepTime,
      maxCookTime,
      minRating,
      sortBy = 'relevance',
      sortOrder = 'desc',
      skip = 0,
      take = 20,
    } = searchInput;

    const client = this.elasticsearchService.getClient();

    const searchQuery: any = {
      index: 'recipes',
      from: skip,
      size: take,
      query: {
        bool: {
          must: [],
          filter: [],
          should: [],
        },
      },
      sort: [],
      highlight: {
        fields: {
          title: {},
          description: {},
          'ingredients.name': {},
        },
      },
    };

    if (query) {
      searchQuery.query.bool.must.push({
        multi_match: {
          query,
          fields: [
            'title^3',
            'description^2',
            'ingredients.name^2',
            'instructions.description',
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    if (ingredients?.length) {
      const ingredientQueries = ingredients.map((ingredient) => ({
        nested: {
          path: 'ingredients',
          query: {
            match: {
              'ingredients.name': {
                query: ingredient,
                fuzziness: 'AUTO',
              },
            },
          },
        },
      }));

      searchQuery.query.bool.should.push(...ingredientQueries);
      searchQuery.query.bool.minimum_should_match = 1;
    }

    if (cuisine) searchQuery.query.bool.filter.push({ term: { cuisine } });
    if (difficulty) searchQuery.query.bool.filter.push({ term: { difficulty } });
    if (maxPrepTime !== undefined)
      searchQuery.query.bool.filter.push({ range: { prepTime: { lte: maxPrepTime } } });
    if (maxCookTime !== undefined)
      searchQuery.query.bool.filter.push({ range: { cookTime: { lte: maxCookTime } } });
    if (minRating !== undefined)
      searchQuery.query.bool.filter.push({ range: { averageRating: { gte: minRating } } });

    searchQuery.query.bool.filter.push({ term: { isPublic: true } });

    switch (sortBy) {
      case 'rating':
        searchQuery.sort.push({ averageRating: { order: sortOrder } });
        break;
      case 'newest':
        searchQuery.sort.push({ createdAt: { order: sortOrder } });
        break;
      case 'prepTime':
        searchQuery.sort.push({ prepTime: { order: sortOrder } });
        break;
      case 'cookTime':
        searchQuery.sort.push({ cookTime: { order: sortOrder } });
        break;
      case 'totalTime':
        searchQuery.sort.push({ totalTime: { order: sortOrder } });
        break;
      case 'popularity':
        searchQuery.sort.push({ ratingCount: { order: sortOrder } });
        break;
    }

    try {
      const response = await client.search(searchQuery);

      const total =
        typeof response.hits.total === 'number'
          ? response.hits.total
          : response.hits.total?.value ?? 0;

      const recipes = response.hits.hits.map((hit: any) => ({
        ...hit._source,
        score: hit._score,
        highlights: hit.highlight,
      }));

      return {
        recipes,
        total,
        took: response.took,
        maxScore: response.hits.max_score ?? undefined,
      };
    } catch (error) {
      this.logger.error('Search error:', error);
      throw new Error('Search failed');
    }
  }

  async searchIngredients(query: string, limit = 10): Promise<any[]> {
    const client = this.elasticsearchService.getClient();

    try {
      const response = await client.search({
        index: 'ingredients',
        query: {
          multi_match: {
            query,
            fields: ['name^2', 'category'],
            type: 'best_fields',
            fuzziness: 'AUTO',
          },
        },
        size: limit,
        sort: [{ usageCount: { order: 'desc' } }, '_score'],
      });

      return response.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      this.logger.error('Ingredient search error:', error);
      return [];
    }
  }

  async getIngredientSuggestions(query: string, limit = 10): Promise<string[]> {
    const client = this.elasticsearchService.getClient();
  
    try {
      const response = await client.search({
        index: 'ingredients',
        suggest: {
          ingredient_suggest: {
            prefix: query,
            completion: {
              field: 'name.suggest',
              size: limit,
            },
          },
        },
      });
  
      const options =
        response.suggest?.ingredient_suggest?.[0]?.options ?? [];
  
      // Force TS to treat options as an array
      const optionArray = Array.isArray(options) ? options : [options];
  
      return optionArray.map((option: any) => option.text ?? '');
    } catch (error) {
      this.logger.error('Ingredient suggestions error:', error);
      return [];
    }
  }  

  async getRecipeSuggestions(query: string, limit = 10): Promise<any[]> {
    const client = this.elasticsearchService.getClient();
  
    try {
      const response = await client.search({
        index: 'recipes',
        suggest: {
          recipe_suggest: {
            prefix: query,
            completion: {
              field: 'title.suggest',
              size: limit,
            },
          },
        },
      });
  
      const options =
        response.suggest?.recipe_suggest?.[0]?.options ?? [];
  
      const optionArray = Array.isArray(options) ? options : [options];
  
      return optionArray.map((option: any) => option._source ?? option);
    } catch (error) {
      this.logger.error('Recipe suggestions error:', error);
      return [];
    }
  }  

  async findRecipesByAvailableIngredients(
    availableIngredients: string[],
    limit = 20,
  ): Promise<any[]> {
    const client = this.elasticsearchService.getClient();

    try {
      const response = await client.search({
        index: 'recipes',
        query: {
          bool: {
            must: [
              {
                nested: {
                  path: 'ingredients',
                  query: {
                    bool: {
                      should: availableIngredients.map((ingredient) => ({
                        match: {
                          'ingredients.name': {
                            query: ingredient,
                            fuzziness: 'AUTO',
                          },
                        },
                      })),
                    },
                  },
                },
              },
            ],
            filter: [{ term: { isPublic: true } }],
          },
        },
        size: limit,
        sort: [
          { averageRating: { order: 'desc' } },
          { ratingCount: { order: 'desc' } },
        ],
      });

      return response.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      this.logger.error('Available ingredients search error:', error);
      return [];
    }
  }

  async getPopularIngredients(limit = 20): Promise<any[]> {
    const client = this.elasticsearchService.getClient();

    try {
      const response = await client.search({
        index: 'ingredients',
        query: { match_all: {} },
        size: limit,
        sort: [{ usageCount: { order: 'desc' } }],
      });

      return response.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      this.logger.error('Popular ingredients error:', error);
      return [];
    }
  }

  async getSearchAnalytics(timeframe = '7d'): Promise<any> {
    const client = this.elasticsearchService.getClient();

    try {
      const response = await client.search({
        index: 'recipes',
        query: { match_all: {} },
        aggs: {
          total_recipes: { value_count: { field: 'id' } },
          by_difficulty: { terms: { field: 'difficulty' } },
          by_cuisine: { terms: { field: 'cuisine' } },
          avg_rating: { avg: { field: 'averageRating' } },
        },
        size: 0,
      });

      return {
        totalRecipes: (response.aggregations as any)?.total_recipes?.value ?? 0,
        byDifficulty: (response.aggregations as any)?.by_difficulty?.buckets ?? [],
        byCuisine: (response.aggregations as any)?.by_cuisine?.buckets ?? [],
        averageRating: (response.aggregations as any)?.avg_rating?.value ?? 0,
      };
    } catch (error) {
      this.logger.error('Search analytics error:', error);
      return {};
    }
  }

  async prepareRecipeForIndexing(recipe: any): Promise<any> {
    const ingredients = await this.prisma.ingredient.findMany({
      where: { recipeId: recipe.id },
    });

    const instructions = await this.prisma.instruction.findMany({
      where: { recipeId: recipe.id },
      orderBy: { stepNumber: 'asc' },
    });

    const ratings = await this.prisma.rating.findMany({
      where: { recipeId: recipe.id },
    });

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating.rating, 0) /
          ratings.length
        : 0;

    return {
      ...recipe,
      totalTime: (recipe.prepTime || 0) + (recipe.cookTime || 0),
      ingredients: ingredients.map((ing) => ({
        ...ing,
        name: ing.name.toLowerCase(),
      })),
      instructions,
      averageRating,
      ratingCount: ratings.length,
      commentCount: await this.prisma.comment.count({
        where: { recipeId: recipe.id },
      }),
    };
  }
}

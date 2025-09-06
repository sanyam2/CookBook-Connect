import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { SearchService } from './search.service';
import { SearchInput } from './dto/search.input';
import { SearchResult } from './dto/search-result.type';
import { IngredientSuggestionInput } from './dto/ingredient-suggestion.input';
import { AvailableIngredientsInput } from './dto/available-ingredients.input';
import { SearchAnalyticsResponse } from './dto/search-analytics.response';
import { RecipeSuggestionResponse } from './dto/recipe-suggestion.response';
import { RecipeByIngredientsResponse } from './dto/recipe-by-ingredients.response';

@Resolver()
export class SearchResolver {
  constructor(private readonly searchService: SearchService) {}

  @Query(() => SearchResult, { name: 'searchRecipes' })
  async searchRecipes(@Args('searchInput') searchInput: SearchInput) {
    return this.searchService.searchRecipes(searchInput);
  }

  @Query(() => [String], { name: 'ingredientSuggestions' })
  async getIngredientSuggestions(
    @Args('query') query: string,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ) {
    return this.searchService.getIngredientSuggestions(query, limit);
  }

  @Query(() => [String], { name: 'searchIngredients' })
  async searchIngredients(
    @Args('query') query: string,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ) {
    const results = await this.searchService.searchIngredients(query, limit);
    return results.map((ingredient) => ingredient.name);
  }

  @Query(() => [RecipeByIngredientsResponse], { name: 'recipesByAvailableIngredients' })
  async findRecipesByAvailableIngredients(
    @Args('availableIngredientsInput') input: AvailableIngredientsInput,
  ) {
    return this.searchService.findRecipesByAvailableIngredients(
      input.ingredients,
      input.limit,
    );
  }

  @Query(() => [String], { name: 'popularIngredients' })
  async getPopularIngredients(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ) {
    const results = await this.searchService.getPopularIngredients(limit);
    return results.map((ingredient) => ingredient.name);
  }

  @Query(() => SearchAnalyticsResponse, { name: 'searchAnalytics' })
  async getSearchAnalytics(
    @Args('timeframe', { defaultValue: '7d' }) timeframe: string,
  ) {
    return this.searchService.getSearchAnalytics(timeframe);
  }

  @Query(() => [RecipeSuggestionResponse], { name: 'recipeSuggestions' })
  async getRecipeSuggestions(
    @Args('query') query: string,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ) {
    return this.searchService.getRecipeSuggestions(query, limit);
  }
}

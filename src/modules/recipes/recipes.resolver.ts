import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { Recipe } from './entities/recipe.entity';
import { CreateRecipeInput } from './dto/create-recipe.input';
import { UpdateRecipeInput } from './dto/update-recipe.input';
import { RecipeFilterInput } from './dto/recipe-filter.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Recipe)
export class RecipesResolver {
  constructor(private readonly recipesService: RecipesService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Recipe)
  createRecipe(
    @Args('createRecipeInput') createRecipeInput: CreateRecipeInput,
    @CurrentUser() user: User,
  ) {
    return this.recipesService.create(createRecipeInput, user.id);
  }

  @Query(() => [Recipe], { name: 'recipes' })
  findAll(@Args('filter', { nullable: true }) filter?: RecipeFilterInput) {
    return this.recipesService.findAll(filter);
  }

  @Query(() => Recipe, { name: 'recipe' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.recipesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Recipe)
  updateRecipe(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateRecipeInput') updateRecipeInput: UpdateRecipeInput,
    @CurrentUser() user: User,
  ) {
    return this.recipesService.update(id, updateRecipeInput, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Recipe)
  removeRecipe(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.recipesService.remove(id, user.id);
  }

  // Complex queries
  @Query(() => [Recipe], { name: 'recipesWithAverageRatings' })
  getRecipesWithAverageRatings(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ) {
    return this.recipesService.getRecipesWithAverageRatings(limit);
  }

  @Query(() => [Recipe], { name: 'recipesByIngredients' })
  getRecipesByIngredients(
    @Args('ingredients', { type: () => [String] }) ingredients: string[],
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ) {
    return this.recipesService.getRecipesByIngredients(ingredients, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [Recipe], { name: 'recipeRecommendations' })
  getRecipeRecommendations(
    @CurrentUser() user: User,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ) {
    return this.recipesService.getRecipesByUserRatingHistory(user.id, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [Recipe], { name: 'userFeed' })
  getUserFeed(
    @CurrentUser() user: User,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ) {
    return this.recipesService.getUserFeed(user.id, limit);
  }
}

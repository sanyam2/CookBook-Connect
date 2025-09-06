import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { Ingredient } from './entities/ingredient.entity';
import { CreateIngredientInput } from './dto/create-ingredient.input';
import { UpdateIngredientInput } from './dto/update-ingredient.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Ingredient)
export class IngredientsResolver {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Ingredient)
  createIngredient(
    @Args('createIngredientInput') createIngredientInput: CreateIngredientInput,
    @CurrentUser() user: User,
  ) {
    return this.ingredientsService.create(createIngredientInput, user.id);
  }

  @Query(() => [Ingredient], { name: 'ingredients' })
  findAll(@Args('recipeId', { nullable: true }) recipeId?: string) {
    return this.ingredientsService.findAll(recipeId);
  }

  @Query(() => Ingredient, { name: 'ingredient' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.ingredientsService.findOne(id);
  }

  @Query(() => [Ingredient], { name: 'ingredientsByRecipe' })
  findByRecipe(@Args('recipeId', { type: () => ID }) recipeId: string) {
    return this.ingredientsService.findByRecipe(recipeId);
  }

  @Query(() => [Ingredient], { name: 'searchIngredients' })
  searchIngredients(
    @Args('query') query: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ) {
    return this.ingredientsService.searchIngredients(query, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Ingredient)
  updateIngredient(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateIngredientInput') updateIngredientInput: UpdateIngredientInput,
    @CurrentUser() user: User,
  ) {
    return this.ingredientsService.update(id, updateIngredientInput, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Ingredient)
  removeIngredient(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.ingredientsService.remove(id, user.id);
  }
}

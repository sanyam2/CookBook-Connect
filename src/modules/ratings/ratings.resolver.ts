import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { Rating } from './entities/rating.entity';
import { CreateRatingInput } from './dto/create-rating.input';
import { UpdateRatingInput } from './dto/update-rating.input';
import { AverageRatingResponse } from './dto/average-rating.response';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Rating)
export class RatingsResolver {
  constructor(private readonly ratingsService: RatingsService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Rating)
  createRating(
    @Args('createRatingInput') createRatingInput: CreateRatingInput,
    @CurrentUser() user: User,
  ) {
    return this.ratingsService.create(createRatingInput, user.id);
  }

  @Query(() => [Rating], { name: 'ratingsByRecipe' })
  findByRecipe(
    @Args('recipeId', { type: () => ID }) recipeId: string,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ) {
    return this.ratingsService.findByRecipe(recipeId, skip, take);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [Rating], { name: 'myRatings' })
  findByUser(
    @CurrentUser() user: User,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ) {
    return this.ratingsService.findByUser(user.id, skip, take);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => Rating, { name: 'myRatingForRecipe', nullable: true })
  getUserRating(
    @CurrentUser() user: User,
    @Args('recipeId', { type: () => ID }) recipeId: string,
  ) {
    return this.ratingsService.getUserRating(user.id, recipeId);
  }

  @Query(() => AverageRatingResponse, { name: 'averageRating' })
  getAverageRating(@Args('recipeId', { type: () => ID }) recipeId: string) {
    return this.ratingsService.getAverageRating(recipeId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Rating)
  updateRating(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateRatingInput') updateRatingInput: UpdateRatingInput,
    @CurrentUser() user: User,
  ) {
    return this.ratingsService.update(id, updateRatingInput, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Rating)
  removeRating(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.ratingsService.remove(id, user.id);
  }
}

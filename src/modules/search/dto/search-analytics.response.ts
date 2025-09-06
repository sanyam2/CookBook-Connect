import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class SearchAnalyticsResponse {
  @Field(() => Int, { description: 'Total number of recipes' })
  totalRecipes: number;

  @Field(() => [String], { description: 'Recipes grouped by difficulty' })
  byDifficulty: string[];

  @Field(() => [String], { description: 'Recipes grouped by cuisine' })
  byCuisine: string[];

  @Field(() => Float, { description: 'Average rating across all recipes' })
  averageRating: number;
}

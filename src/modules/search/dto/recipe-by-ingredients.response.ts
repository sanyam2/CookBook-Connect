import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class RecipeByIngredientsResponse {
  @Field(() => ID, { description: 'Recipe ID' })
  id: string;

  @Field({ description: 'Recipe title' })
  title: string;

  @Field({ description: 'Recipe description', nullable: true })
  description?: string;

  @Field(() => Float, { description: 'Average rating', nullable: true })
  averageRating?: number;

  @Field(() => Int, { description: 'Cooking time in minutes', nullable: true })
  cookingTime?: number;

  @Field({ description: 'Difficulty level', nullable: true })
  difficulty?: string;

  @Field({ description: 'Cuisine type', nullable: true })
  cuisine?: string;

  @Field(() => Int, { description: 'Number of matching ingredients', nullable: true })
  matchingIngredientsCount?: number;
}

import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { Recipe } from '../../recipes/entities/recipe.entity';

@ObjectType()
export class SearchResult {
  @Field(() => [Recipe])
  recipes: Recipe[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  took: number;

  @Field(() => Float, { nullable: true })
  maxScore?: number;
}

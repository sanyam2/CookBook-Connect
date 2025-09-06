import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class AverageRatingResponse {
  @Field(() => Float, { description: 'The average rating value' })
  average: number;

  @Field(() => Int, { description: 'The total number of ratings' })
  count: number;
}

import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class FollowStatsResponse {
  @Field(() => Int, { description: 'Number of followers' })
  followersCount: number;

  @Field(() => Int, { description: 'Number of users being followed' })
  followingCount: number;
}

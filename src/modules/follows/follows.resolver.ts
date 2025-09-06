import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { Follow } from './entities/follow.entity';
import { FollowUserInput } from './dto/follow-user.input';
import { FollowStatsResponse } from './dto/follow-stats.response';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Follow)
export class FollowsResolver {
  constructor(private readonly followsService: FollowsService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Follow)
  followUser(
    @Args('followUserInput') followUserInput: FollowUserInput,
    @CurrentUser() user: User,
  ) {
    return this.followsService.follow(followUserInput, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Follow)
  unfollowUser(
    @Args('followingId', { type: () => ID }) followingId: string,
    @CurrentUser() user: User,
  ) {
    return this.followsService.unfollow(followingId, user.id);
  }

  @Query(() => [Follow], { name: 'followers' })
  getFollowers(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ) {
    return this.followsService.getFollowers(userId, skip, take);
  }

  @Query(() => [Follow], { name: 'following' })
  getFollowing(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ) {
    return this.followsService.getFollowing(userId, skip, take);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => Boolean, { name: 'isFollowing' })
  isFollowing(
    @CurrentUser() user: User,
    @Args('followingId', { type: () => ID }) followingId: string,
  ) {
    return this.followsService.isFollowing(user.id, followingId);
  }

  @Query(() => FollowStatsResponse, { name: 'followStats' })
  getFollowStats(@Args('userId', { type: () => ID }) userId: string) {
    return this.followsService.getFollowStats(userId);
  }
}

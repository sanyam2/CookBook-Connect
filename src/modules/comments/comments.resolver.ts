import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Comment)
export class CommentsResolver {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Comment)
  createComment(
    @Args('createCommentInput') createCommentInput: CreateCommentInput,
    @CurrentUser() user: User,
  ) {
    return this.commentsService.create(createCommentInput, user.id);
  }

  @Query(() => [Comment], { name: 'commentsByRecipe' })
  findByRecipe(
    @Args('recipeId', { type: () => ID }) recipeId: string,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ) {
    return this.commentsService.findByRecipe(recipeId, skip, take);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [Comment], { name: 'myComments' })
  findByUser(
    @CurrentUser() user: User,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ) {
    return this.commentsService.findByUser(user.id, skip, take);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Comment)
  updateComment(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateCommentInput') updateCommentInput: UpdateCommentInput,
    @CurrentUser() user: User,
  ) {
    return this.commentsService.update(id, updateCommentInput, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Comment)
  removeComment(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.commentsService.remove(id, user.id);
  }
}

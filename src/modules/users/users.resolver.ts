import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput);
  }

  @Query(() => [User], { name: 'users' })
  findAll(
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ) {
    return this.usersService.findAll(skip, take);
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.findById(id);
  }

  @Query(() => User, { name: 'userByUsername' })
  findByUsername(@Args('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  @Query(() => [User], { name: 'searchUsers' })
  searchUsers(
    @Args('query') query: string,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ) {
    return this.usersService.searchUsers(query, skip, take);
  }

  @Query(() => [User], { name: 'usersWithMostRecipes' })
  getUsersWithMostRecipes(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ) {
    return this.usersService.getUsersWithMostRecipes(limit);
  }

  @Query(() => [User], { name: 'usersWithMostFollowers' })
  getUsersWithMostFollowers(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ) {
    return this.usersService.getUsersWithMostFollowers(limit);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => User, { name: 'me' })
  getCurrentUser(@CurrentUser() user: User) {
    return this.usersService.findById(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => User)
  updateUser(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @CurrentUser() currentUser: User,
  ) {
    // Users can only update their own profile
    if (id !== currentUser.id) {
      throw new Error('You can only update your own profile');
    }
    return this.usersService.update(id, updateUserInput);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => User)
  removeUser(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() currentUser: User,
  ) {
    // Users can only delete their own account
    if (id !== currentUser.id) {
      throw new Error('You can only delete your own account');
    }
    return this.usersService.remove(id);
  }
}

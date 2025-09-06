import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Recipe } from '../../recipes/entities/recipe.entity';
import { Follow } from '../../follows/entities/follow.entity';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [Recipe], { nullable: true })
  recipes?: Recipe[];

  @Field(() => [Follow], { nullable: true })
  followers?: Follow[];

  @Field(() => [Follow], { nullable: true })
  following?: Follow[];
}

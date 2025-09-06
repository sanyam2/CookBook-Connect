import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class Follow {
  @Field(() => ID)
  id: string;

  @Field()
  createdAt: Date;

  @Field(() => User)
  follower: User;

  @Field(() => User)
  following: User;
}

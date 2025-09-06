import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class Rating {
  @Field(() => ID)
  id: string;

  @Field()
  rating: number;

  @Field({ nullable: true })
  review?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => User)
  user: User;
}

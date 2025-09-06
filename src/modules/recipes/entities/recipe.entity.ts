import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Ingredient } from '../../ingredients/entities/ingredient.entity';
import { Instruction } from '../../instructions/entities/instruction.entity';

@ObjectType()
export class Recipe {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  prepTime?: number;

  @Field({ nullable: true })
  cookTime?: number;

  @Field({ nullable: true })
  servings?: number;

  @Field({ nullable: true })
  difficulty?: string;

  @Field()
  isPublic: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => User)
  author: User;

  @Field(() => [Ingredient], { nullable: true })
  ingredients?: Ingredient[];

  @Field(() => [Instruction], { nullable: true })
  instructions?: Instruction[];
}

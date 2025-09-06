import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Ingredient {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  quantity: string;

  @Field({ nullable: true })
  unit?: string;

  @Field({ nullable: true })
  notes?: string;
}

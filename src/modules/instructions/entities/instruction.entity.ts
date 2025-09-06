import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Instruction {
  @Field(() => ID)
  id: string;

  @Field()
  stepNumber: number;

  @Field()
  description: string;

  @Field({ nullable: true })
  imageUrl?: string;
}

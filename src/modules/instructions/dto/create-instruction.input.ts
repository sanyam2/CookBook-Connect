import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';

@InputType()
export class CreateInstructionInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  stepNumber: number;

  @Field()
  @IsNotEmpty()
  @IsString()
  description: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  recipeId: string;
}

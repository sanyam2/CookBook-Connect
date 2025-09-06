import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

@InputType()
export class CreateIngredientInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  quantity: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  unit?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  recipeId: string;
}

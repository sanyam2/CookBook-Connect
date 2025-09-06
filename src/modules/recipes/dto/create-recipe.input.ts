import { InputType, Field } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

@InputType()
export class CreateRecipeInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  prepTime?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  cookTime?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  servings?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  difficulty?: string;
}

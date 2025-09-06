import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsArray,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

@InputType()
export class AvailableIngredientsInput {
  @Field(() => [String])
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  ingredients: string[];

  @Field(() => Int, { defaultValue: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

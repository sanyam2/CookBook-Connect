import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

@InputType()
export class RecipeFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxPrepTime?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxCookTime?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  authorId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  ingredient?: string;

  @Field({ defaultValue: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @Field({ defaultValue: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}

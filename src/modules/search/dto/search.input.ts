import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  IsArray,
  IsInt,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

export enum SortBy {
  RELEVANCE = 'relevance',
  RATING = 'rating',
  NEWEST = 'newest',
  PREP_TIME = 'prepTime',
  COOK_TIME = 'cookTime',
  TOTAL_TIME = 'totalTime',
  POPULARITY = 'popularity',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

@InputType()
export class SearchInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  query?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ingredients?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  cuisine?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxPrepTime?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxCookTime?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  minRating?: number;

  @Field(() => String, { defaultValue: SortBy.RELEVANCE })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @Field(() => String, { defaultValue: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

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

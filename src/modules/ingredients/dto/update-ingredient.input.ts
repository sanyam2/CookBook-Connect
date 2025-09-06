import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateIngredientInput } from './create-ingredient.input';

@InputType()
export class UpdateIngredientInput extends PartialType(CreateIngredientInput) {}

import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateRatingInput } from './create-rating.input';

@InputType()
export class UpdateRatingInput extends PartialType(CreateRatingInput) {}

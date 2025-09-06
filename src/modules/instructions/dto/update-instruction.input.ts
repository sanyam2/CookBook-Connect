import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateInstructionInput } from './create-instruction.input';

@InputType()
export class UpdateInstructionInput extends PartialType(
  CreateInstructionInput,
) {}

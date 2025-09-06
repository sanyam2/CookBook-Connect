import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InstructionsService } from './instructions.service';
import { Instruction } from './entities/instruction.entity';
import { CreateInstructionInput } from './dto/create-instruction.input';
import { UpdateInstructionInput } from './dto/update-instruction.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Instruction)
export class InstructionsResolver {
  constructor(private readonly instructionsService: InstructionsService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Instruction)
  createInstruction(
    @Args('createInstructionInput')
    createInstructionInput: CreateInstructionInput,
    @CurrentUser() user: User,
  ) {
    return this.instructionsService.create(createInstructionInput, user.id);
  }

  @Query(() => [Instruction], { name: 'instructionsByRecipe' })
  findByRecipe(@Args('recipeId', { type: () => ID }) recipeId: string) {
    return this.instructionsService.findByRecipe(recipeId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Instruction)
  updateInstruction(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateInstructionInput')
    updateInstructionInput: UpdateInstructionInput,
    @CurrentUser() user: User,
  ) {
    return this.instructionsService.update(id, updateInstructionInput, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Instruction)
  removeInstruction(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.instructionsService.remove(id, user.id);
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateInstructionInput } from './dto/create-instruction.input';
import { UpdateInstructionInput } from './dto/update-instruction.input';

@Injectable()
export class InstructionsService {
  constructor(private prisma: PrismaService) {}

  async create(createInstructionInput: CreateInstructionInput, userId: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: createInstructionInput.recipeId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.authorId !== userId) {
      throw new ForbiddenException(
        'You can only add instructions to your own recipes',
      );
    }

    return this.prisma.instruction.create({
      data: createInstructionInput,
      include: {
        recipe: true,
      },
    });
  }

  async findByRecipe(recipeId: string) {
    return this.prisma.instruction.findMany({
      where: { recipeId },
      orderBy: {
        stepNumber: 'asc',
      },
    });
  }

  async update(
    id: string,
    updateInstructionInput: UpdateInstructionInput,
    userId: string,
  ) {
    const instruction = await this.prisma.instruction.findUnique({
      where: { id },
      include: { recipe: true },
    });

    if (!instruction) {
      throw new NotFoundException('Instruction not found');
    }

    if (instruction.recipe.authorId !== userId) {
      throw new ForbiddenException(
        'You can only update instructions in your own recipes',
      );
    }

    return this.prisma.instruction.update({
      where: { id },
      data: updateInstructionInput,
      include: { recipe: true },
    });
  }

  async remove(id: string, userId: string) {
    const instruction = await this.prisma.instruction.findUnique({
      where: { id },
      include: { recipe: true },
    });

    if (!instruction) {
      throw new NotFoundException('Instruction not found');
    }

    if (instruction.recipe.authorId !== userId) {
      throw new ForbiddenException(
        'You can only delete instructions from your own recipes',
      );
    }

    return this.prisma.instruction.delete({ where: { id } });
  }
}

import { Module } from '@nestjs/common';
import { InstructionsService } from './instructions.service';
import { InstructionsResolver } from './instructions.resolver';

@Module({
  providers: [InstructionsService, InstructionsResolver],
  exports: [InstructionsService],
})
export class InstructionsModule {}

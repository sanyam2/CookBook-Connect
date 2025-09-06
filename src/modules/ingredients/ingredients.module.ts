import { Module } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { IngredientsResolver } from './ingredients.resolver';

@Module({
  providers: [IngredientsService, IngredientsResolver],
  exports: [IngredientsService],
})
export class IngredientsModule {}

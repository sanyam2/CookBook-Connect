import { Module } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { RecipesResolver } from './recipes.resolver';
import { EventPublisherService } from '../../common/services/event-publisher.service';
import { RedisService } from '../../common/services/redis.service';
import { RecipeIndexingService } from '../search/recipe-indexing.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [
    RecipesService,
    RecipesResolver,
    EventPublisherService,
    RedisService,
    RecipeIndexingService,
  ],
  exports: [RecipesService, RecipeIndexingService],
})
export class RecipesModule {}

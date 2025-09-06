import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchResolver } from './search.resolver';
import { RecipeIndexingService } from './recipe-indexing.service';
import { ElasticsearchService } from '../../common/services/elasticsearch.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  providers: [
    SearchService,
    SearchResolver,
    RecipeIndexingService,
    ElasticsearchService,
    PrismaService,
  ],
  exports: [SearchService, RecipeIndexingService],
})
export class SearchModule {}

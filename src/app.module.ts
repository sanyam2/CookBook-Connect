import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './common/services/prisma.service';
import { ElasticsearchService } from './common/services/elasticsearch.service';
import { RedisService } from './common/services/redis.service';
import { EventPublisherService } from './common/services/event-publisher.service';
import { SubscriptionManagerService } from './common/services/subscription-manager.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { InstructionsModule } from './modules/instructions/instructions.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { CommentsModule } from './modules/comments/comments.module';
import { FollowsModule } from './modules/follows/follows.module';
import { SearchModule } from './modules/search/search.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import databaseConfig from './config/database.config';
import elasticsearchConfig from './config/elasticsearch.config';
import redisConfig from './config/redis.config';
import appConfig from './config/app.config';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, elasticsearchConfig, redisConfig, appConfig],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
    }),
    AuthModule,
    UsersModule,
    RecipesModule,
    IngredientsModule,
    InstructionsModule,
    RatingsModule,
    CommentsModule,
    FollowsModule,
    SearchModule,
    NotificationsModule,
    SubscriptionsModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SubscriptionManagerService,
    PrismaService,
    ElasticsearchService,
    RedisService,
    EventPublisherService,
  ],
})
export class AppModule {}

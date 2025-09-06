import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);
  private client: Client;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.client = new Client({
        node: this.configService.get('elasticsearch.node'),
        auth: {
          username: this.configService.get('elasticsearch.username') || '',
          password: this.configService.get('elasticsearch.password') || '',
        },
        maxRetries: this.configService.get('elasticsearch.maxRetries') || 3,
        requestTimeout:
          this.configService.get('elasticsearch.requestTimeout') || 30000,
      });

      // Test connection
      await this.client.ping();
      this.logger.log('Connected to Elasticsearch successfully');

      // Create indices if they don't exist
      await this.createIndices();
    } catch (error) {
      this.logger.error('Failed to connect to Elasticsearch:', error);
    }
  }

  getClient(): Client {
    return this.client;
  }

  private async createIndices() {
    const indices = ['recipes', 'ingredients'];

    for (const indexName of indices) {
      try {
        const exists = await this.client.indices.exists({ index: indexName });

        if (!exists) {
          await this.createIndex(indexName);
          this.logger.log(`Created index: ${indexName}`);
        }
      } catch (error) {
        this.logger.error(`Error creating index ${indexName}:`, error);
      }
    }
  }

  private async createIndex(indexName: string) {
    const indexMappings = {
      recipes: {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            title: {
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: { type: 'keyword' },
                suggest: { type: 'completion' },
              },
            },
            description: {
              type: 'text',
              analyzer: 'standard',
            },
            prepTime: { type: 'integer' },
            cookTime: { type: 'integer' },
            totalTime: { type: 'integer' },
            servings: { type: 'integer' },
            difficulty: { type: 'keyword' },
            cuisine: { type: 'keyword' },
            imageUrl: { type: 'keyword' },
            isPublic: { type: 'boolean' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
            authorId: { type: 'keyword' },
            author: {
              properties: {
                id: { type: 'keyword' },
                username: { type: 'keyword' },
                firstName: { type: 'text' },
                lastName: { type: 'text' },
                avatar: { type: 'keyword' },
              },
            },
            ingredients: {
              type: 'nested',
              properties: {
                id: { type: 'keyword' },
                name: {
                  type: 'text',
                  analyzer: 'standard',
                  fields: {
                    keyword: { type: 'keyword' },
                    suggest: { type: 'completion' },
                  },
                },
                quantity: { type: 'text' },
                unit: { type: 'keyword' },
                notes: { type: 'text' },
              },
            },
            instructions: {
              type: 'nested',
              properties: {
                id: { type: 'keyword' },
                stepNumber: { type: 'integer' },
                description: { type: 'text' },
                imageUrl: { type: 'keyword' },
              },
            },
            averageRating: { type: 'float' },
            ratingCount: { type: 'integer' },
            commentCount: { type: 'integer' },
            tags: { type: 'keyword' },
          },
        },
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              custom_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'stop', 'snowball'],
              },
            },
          },
        },
      },
      ingredients: {
        mappings: {
          properties: {
            name: {
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: { type: 'keyword' },
                suggest: { type: 'completion' },
              },
            },
            category: { type: 'keyword' },
            usageCount: { type: 'integer' },
            lastUsed: { type: 'date' },
          },
        },
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
        },
      },
    };

    await this.client.indices.create({
      index: indexName,
      body: indexMappings[indexName],
    });
  }

  async indexRecipe(recipe: any) {
    try {
      await this.client.index({
        index: 'recipes',
        id: recipe.id,
        body: recipe,
      });
      this.logger.log(`Indexed recipe: ${recipe.id}`);
    } catch (error) {
      this.logger.error(`Error indexing recipe ${recipe.id}:`, error);
    }
  }

  async updateRecipe(recipe: any) {
    try {
      await this.client.index({
        index: 'recipes',
        id: recipe.id,
        body: recipe,
      });
      this.logger.log(`Updated recipe: ${recipe.id}`);
    } catch (error) {
      this.logger.error(`Error updating recipe ${recipe.id}:`, error);
    }
  }

  async deleteRecipe(recipeId: string) {
    try {
      await this.client.delete({
        index: 'recipes',
        id: recipeId,
      });
      this.logger.log(`Deleted recipe: ${recipeId}`);
    } catch (error) {
      this.logger.error(`Error deleting recipe ${recipeId}:`, error);
    }
  }

  async indexIngredient(ingredient: any) {
    try {
      await this.client.index({
        index: 'ingredients',
        body: ingredient,
      });
      this.logger.log(`Indexed ingredient: ${ingredient.name}`);
    } catch (error) {
      this.logger.error(`Error indexing ingredient ${ingredient.name}:`, error);
    }
  }

  async bulkIndexRecipes(recipes: any[]) {
    try {
      if (!this.client) {
        this.logger.error('Elasticsearch client is not initialized');
        return;
      }

      if (!recipes || recipes.length === 0) {
        this.logger.warn('No recipes provided for bulk indexing');
        return;
      }

      const body = recipes.flatMap((recipe) => [
        { index: { _index: 'recipes', _id: recipe.id } },
        recipe,
      ]);

      if (body.length === 0) {
        this.logger.warn('Empty body generated for bulk indexing');
        return;
      }

      const response = await this.client.bulk({ body });
      
      if (response.errors) {
        this.logger.warn('Some recipes failed to index:', response.items);
      }
      
      this.logger.log(`Bulk indexed ${recipes.length} recipes`);
    } catch (error) {
      this.logger.error('Error bulk indexing recipes:', error);
      throw error;
    }
  }

  async refreshIndex(indexName: string) {
    try {
      await this.client.indices.refresh({ index: indexName });
    } catch (error) {
      this.logger.error(`Error refreshing index ${indexName}:`, error);
    }
  }
}

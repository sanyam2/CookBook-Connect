import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private publisher: Redis;
  private subscriber: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisConfig = this.configService.get('redis');

    this.publisher = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);

    // Wait for connections to be established
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        this.publisher.on('connect', () => {
          this.logger.log('Redis Publisher connected');
          resolve();
        });
        this.publisher.on('error', (error) => {
          this.logger.error('Redis Publisher connection error:', error);
          reject(error);
        });
      }),
      new Promise<void>((resolve, reject) => {
        this.subscriber.on('connect', () => {
          this.logger.log('Redis Subscriber connected');
          resolve();
        });
        this.subscriber.on('error', (error) => {
          this.logger.error('Redis Subscriber connection error:', error);
          reject(error);
        });
      }),
    ]);

    this.publisher.on('error', (error) => {
      this.logger.error('Redis Publisher error:', error);
    });

    this.subscriber.on('error', (error) => {
      this.logger.error('Redis Subscriber error:', error);
    });

    this.logger.log('Redis service initialized successfully');
  }

  async onModuleDestroy() {
    if (this.publisher) {
      await this.publisher.quit();
    }
    if (this.subscriber) {
      await this.subscriber.quit();
    }
  }

  async publish(channel: string, message: string): Promise<number> {
    try {
      if (!this.publisher) {
        throw new Error('Redis publisher is not initialized');
      }
      const result = await this.publisher.publish(channel, message);
      this.logger.debug(`Published message to channel ${channel}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to publish to channel ${channel}:`, error);
      throw error;
    }
  }

  async subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void> {
    try {
      if (!this.subscriber) {
        throw new Error('Redis subscriber is not initialized');
      }
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          callback(message);
        }
      });
      this.logger.debug(`Subscribed to channel ${channel}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to channel ${channel}:`, error);
      throw error;
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    try {
      if (!this.subscriber) {
        throw new Error('Redis subscriber is not initialized');
      }
      await this.subscriber.unsubscribe(channel);
      this.logger.debug(`Unsubscribed from channel ${channel}`);
    } catch (error) {
      this.logger.error(
        `Failed to unsubscribe from channel ${channel}:`,
        error,
      );
      throw error;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (!this.publisher) {
        throw new Error('Redis publisher is not initialized');
      }
      if (ttl) {
        await this.publisher.setex(key, ttl, value);
      } else {
        await this.publisher.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Failed to set key ${key}:`, error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (!this.publisher) {
        throw new Error('Redis publisher is not initialized');
      }
      return await this.publisher.get(key);
    } catch (error) {
      this.logger.error(`Failed to get key ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<number> {
    try {
      if (!this.publisher) {
        throw new Error('Redis publisher is not initialized');
      }
      return await this.publisher.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete key ${key}:`, error);
      throw error;
    }
  }

  getPublisher(): Redis {
    if (!this.publisher) {
      throw new Error('Redis publisher is not initialized');
    }
    return this.publisher;
  }

  getSubscriber(): Redis {
    if (!this.subscriber) {
      throw new Error('Redis subscriber is not initialized');
    }
    return this.subscriber;
  }
}

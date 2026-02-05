import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<number>('REDIS_PORT');

    this.redisClient = new Redis({
      host,
      port,
      lazyConnect: true,
    });

    this.redisClient.on('error', (err) => {
      this.logger.error('Redis connection error', err);
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  async getStatus(): Promise<string> {
    try {
      await this.redisClient.ping();
      return 'ok';
    } catch (error) {
      return 'issue';
    }
  }

  getClient(): Redis {
    return this.redisClient;
  }
}

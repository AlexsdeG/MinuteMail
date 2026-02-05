import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller('status')
export class StatusController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get()
  async getStatus() {
    const dbStatus = await this.checkDatabase();
    const redisStatus = await this.redis.getStatus();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      redis: redisStatus,
    };
  }

  private async checkDatabase(): Promise<string> {
    try {
      // Simple query to check if DB is responsive
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch (error) {
      return 'issue';
    }
  }
}

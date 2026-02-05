import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private prisma: PrismaService) {}

  // Run every 10 minutes to deactivate expired aliases
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleExpiredAliases() {
    this.logger.log('Running expired aliases cleanup...');
    const result = await this.prisma.alias.updateMany({
      where: { expiresAt: { lt: new Date() }, isActive: true },
      data: { isActive: false },
    });
    if (result.count && result.count > 0) {
      this.logger.log(`Deactivated ${result.count} expired aliases.`);
    }
  }

  // Run every day at midnight to delete old emails
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOldEmails() {
    this.logger.log('Running old emails cleanup...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await this.prisma.email.deleteMany({
      where: {
        receivedAt: { lt: sevenDaysAgo },
      },
    });

    if (result.count && result.count > 0) {
      this.logger.log(`Deleted ${result.count} old emails.`);
    }
  }
}
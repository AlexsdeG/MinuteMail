import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Alias } from '../aliases/entities/alias.entity';
import { Email } from '../emails/entities/email.entity';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    @InjectRepository(Alias)
    private aliasesRepository: Repository<Alias>,
    @InjectRepository(Email)
    private emailsRepository: Repository<Email>,
  ) {}

  // Run every 10 minutes to deactivate expired aliases
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleExpiredAliases() {
    this.logger.log('Running expired aliases cleanup...');
    const result = await this.aliasesRepository.update(
      { expiresAt: LessThan(new Date()), isActive: true },
      { isActive: false },
    );
    if (result.affected && result.affected > 0) {
      this.logger.log(`Deactivated ${result.affected} expired aliases.`);
    }
  }

  // Run every day at midnight to delete old emails
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOldEmails() {
    this.logger.log('Running old emails cleanup...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const result = await this.emailsRepository.delete({
      receivedAt: LessThan(sevenDaysAgo),
    });
    
    if (result.affected && result.affected > 0) {
      this.logger.log(`Deleted ${result.affected} old emails.`);
    }
  }
}
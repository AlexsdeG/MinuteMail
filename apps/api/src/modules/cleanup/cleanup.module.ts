import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alias } from '../aliases/entities/alias.entity';
import { Email } from '../emails/entities/email.entity';
import { CleanupService } from './cleanup.service';

@Module({
  imports: [TypeOrmModule.forFeature([Alias, Email])],
  providers: [CleanupService],
})
export class CleanupModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Email } from './entities/email.entity';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { AliasesModule } from '../aliases/aliases.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Email]),
    AliasesModule, // Import AliasesModule to use AliasRepository check
  ],
  controllers: [EmailsController],
  providers: [EmailsService],
  exports: [TypeOrmModule, EmailsService],
})
export class EmailsModule {}
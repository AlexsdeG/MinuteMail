import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AliasesService } from './aliases.service';
import { AliasesController } from './aliases.controller';

@Module({
  imports: [ConfigModule],
  controllers: [AliasesController],
  providers: [AliasesService],
  exports: [AliasesService],
})
export class AliasesModule {}
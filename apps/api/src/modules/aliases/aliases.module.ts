import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Alias } from './entities/alias.entity';
import { AliasesService } from './aliases.service';
import { AliasesController } from './aliases.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alias]),
    ConfigModule,
  ],
  controllers: [AliasesController],
  providers: [AliasesService],
  exports: [TypeOrmModule, AliasesService],
})
export class AliasesModule {}
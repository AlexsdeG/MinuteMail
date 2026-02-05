import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { envSchema } from './config/env.schema';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AliasesModule } from './modules/aliases/aliases.module';
import { EmailsModule } from './modules/emails/emails.module';
import { AuthModule } from './modules/auth/auth.module';
import { SmtpModule } from './modules/smtp/smtp.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { CleanupModule } from './modules/cleanup/cleanup.module';
import { RedisModule } from './modules/redis/redis.module';
import { StatusModule } from './modules/status/status.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envSchema,
    }),
    PrismaModule,
    // Rate Limiting: 5 requests per 60 seconds
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 5,
    }]),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    AliasesModule,
    EmailsModule,
    SmtpModule,
    GatewayModule,
    CleanupModule,
    RedisModule,
    StatusModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
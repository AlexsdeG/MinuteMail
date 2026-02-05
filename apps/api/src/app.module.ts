import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { envSchema } from './config/env.schema';
import { UsersModule } from './modules/users/users.module';
import { AliasesModule } from './modules/aliases/aliases.module';
import { EmailsModule } from './modules/emails/emails.module';
import { AuthModule } from './modules/auth/auth.module';
import { SmtpModule } from './modules/smtp/smtp.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { CleanupModule } from './modules/cleanup/cleanup.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST'),
        port: config.get<number>('POSTGRES_PORT'),
        username: config.get<string>('POSTGRES_USER'),
        password: config.get<string>('POSTGRES_PASSWORD'),
        database: config.get<string>('POSTGRES_DB'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Auto-create tables (Dev only)
      }),
    }),
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
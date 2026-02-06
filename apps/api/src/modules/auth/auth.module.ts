import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { InvitesModule } from '../invites/invites.module';

import { EmailVerificationService } from './email-verification.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
    InvitesModule,
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, EmailVerificationService],
  controllers: [AuthController],
  exports: [AuthService, EmailVerificationService],
})
export class AuthModule {}
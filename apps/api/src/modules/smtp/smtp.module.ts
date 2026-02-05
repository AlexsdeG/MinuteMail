import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AliasesModule } from '../aliases/aliases.module';
import { EmailsModule } from '../emails/emails.module';
import { SmtpService } from './smtp.service';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    ConfigModule,
    AliasesModule,
    EmailsModule,
    GatewayModule,
  ],
  providers: [SmtpService],
})
export class SmtpModule {}
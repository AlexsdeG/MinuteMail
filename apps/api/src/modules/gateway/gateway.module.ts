import { Module } from '@nestjs/common';
import { EmailsGateway } from './emails.gateway';

@Module({
  providers: [EmailsGateway],
  exports: [EmailsGateway],
})
export class GatewayModule {}
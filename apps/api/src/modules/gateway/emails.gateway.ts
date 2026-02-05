import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow connections from any origin for development
  },
})
export class EmailsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EmailsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_alias')
  handleJoinAlias(
    @MessageBody() data: { aliasId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { aliasId } = data;
    if (aliasId) {
      client.join(`alias:${aliasId}`);
      this.logger.log(`Client ${client.id} joined room alias:${aliasId}`);
      return { event: 'joined_alias', data: { aliasId } };
    }
  }
}
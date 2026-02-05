import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import * as request from 'supertest';
import * as nodemailer from 'nodemailer';
import { AppModule } from './../src/app.module';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { ConfigService } from '@nestjs/config';

describe('WebSocket Gateway (E2E)', () => {
  let app: INestApplication;
  let clientSocket: Socket;
  let smtpPort: number;
  let serverPort: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Start NestJS app to listen on a port for websockets
    serverPort = 3001;
    await app.listen(serverPort);

    const configService = app.get(ConfigService);
    smtpPort = configService.get<number>('SMTP_PORT');
  });

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.close();
    }
    await app.close();
  });

  it('should connect to websocket, join room, and receive email event', (done) => {
    // 1. Create Alias via API
    request(app.getHttpServer())
      .post('/aliases')
      .expect(201)
      .then((res) => {
        const aliasId = res.body.id;
        const address = res.body.address;

        // 2. Connect WebSocket
        clientSocket = io(`http://localhost:${serverPort}`);

        clientSocket.on('connect', () => {
          // 3. Join the alias room
          clientSocket.emit('join_alias', { aliasId });
        });

        // 4. Listen for email event
        clientSocket.on('email_received', (data) => {
          try {
            expect(data).toBeDefined();
            expect(data.subject).toBe('WS Test Subject');
            expect(data.sender).toContain('sender@example.com');
            done();
          } catch (error) {
            done(error);
          }
        });

        // 5. Send SMTP Email (after a slight delay to ensure WS join is processed)
        setTimeout(async () => {
           const transporter = nodemailer.createTransport({
            host: 'localhost',
            port: smtpPort,
            secure: false,
            ignoreTLS: true,
          });

          await transporter.sendMail({
            from: 'sender@example.com',
            to: address,
            subject: 'WS Test Subject',
            text: 'Testing WebSockets',
          });
        }, 500);
      });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Rate Limiting (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow 5 requests and block the 6th', async () => {
    const agent = request(app.getHttpServer());

    // Make 5 successful requests
    for (let i = 0; i < 5; i++) {
      await agent.post('/aliases').expect(201);
    }

    // The 6th request should fail with 429 Too Many Requests
    await agent.post('/aliases').expect(429);
  });
});
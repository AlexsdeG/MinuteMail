import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Auth System (E2E)', () => {
  let app: INestApplication;
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'securePassword123';

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

  it('/auth/register (POST) - should create a user', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: testEmail, password: testPassword })
      .expect(201)
      .expect((res) => {
        expect(res.body.email).toEqual(testEmail);
        expect(res.body.password).toBeUndefined(); // Should not return password
      });
  });

  it('/auth/login (POST) - should return JWT', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(201)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
      });
  });

  it('/auth/login (POST) - should fail with wrong password', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'wrong' })
      .expect(401);
  });
});
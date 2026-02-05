import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Aliases System (E2E)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create a user and get token for authenticated tests
    const email = `alias_test_${Date.now()}@example.com`;
    const password = 'password123';
    
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });
      
    authToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/aliases (POST) - Guest should create short-lived alias', async () => {
    const res = await request(app.getHttpServer())
      .post('/aliases')
      .expect(201);

    expect(res.body.address).toBeDefined();
    expect(res.body.expiresAt).toBeDefined();
    
    const expiresAt = new Date(res.body.expiresAt).getTime();
    const now = Date.now();
    const durationMinutes = (expiresAt - now) / 1000 / 60;
    
    // Should be around 10 minutes (allow small variance)
    expect(durationMinutes).toBeGreaterThan(9);
    expect(durationMinutes).toBeLessThan(11);
  });

  it('/aliases (POST) - User should create long-lived alias', async () => {
    const res = await request(app.getHttpServer())
      .post('/aliases')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(201);

    expect(res.body.address).toBeDefined();
    expect(res.body.userId).toBeDefined();

    const expiresAt = new Date(res.body.expiresAt).getTime();
    const now = Date.now();
    const durationDays = (expiresAt - now) / 1000 / 60 / 60 / 24;

    // Should be around 7 days
    expect(durationDays).toBeGreaterThan(6.9);
    expect(durationDays).toBeLessThan(7.1);
  });

  it('/aliases (GET) - Guest should not access list', () => {
    return request(app.getHttpServer())
      .get('/aliases')
      .expect(401);
  });

  it('/aliases (GET) - User should see their aliases', async () => {
    const res = await request(app.getHttpServer())
      .get('/aliases')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].address).toBeDefined();
  });
});
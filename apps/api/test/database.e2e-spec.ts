import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Database Integration (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be connected to the database', async () => {
    expect(prisma).toBeDefined();
    // Verify connection by running a simple query
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    expect(result).toBeDefined();
  });

  it('should have User, Alias, and Email models', async () => {
    // Verify that we can query each table without errors
    const userCount = await prisma.user.count();
    const aliasCount = await prisma.alias.count();
    const emailCount = await prisma.email.count();

    expect(userCount).toBeGreaterThanOrEqual(0);
    expect(aliasCount).toBeGreaterThanOrEqual(0);
    expect(emailCount).toBeGreaterThanOrEqual(0);
  });
});
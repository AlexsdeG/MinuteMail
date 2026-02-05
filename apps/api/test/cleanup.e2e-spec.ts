import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { CleanupService } from './../src/modules/cleanup/cleanup.service';
import { PrismaService } from './../src/prisma/prisma.service';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Cleanup Service (E2E)', () => {
  let app: INestApplication;
  let cleanupService: CleanupService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    cleanupService = app.get(CleanupService);
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should soft-delete expired aliases', async () => {
    // 1. Create an alias that is expired
    const expiredAlias = await prisma.alias.create({
      data: {
        address: `expired_${Date.now()}@test.com`,
        isActive: true,
        expiresAt: new Date(Date.now() - 10000), // 10 seconds ago
      },
    });

    // 2. Create an alias that is active
    const activeAlias = await prisma.alias.create({
      data: {
        address: `active_${Date.now()}@test.com`,
        isActive: true,
        expiresAt: new Date(Date.now() + 100000), // Future
      },
    });

    // 3. Manually trigger the cleanup task
    await cleanupService.handleExpiredAliases();

    // 4. Verify results
    const checkExpired = await prisma.alias.findUnique({ where: { id: expiredAlias.id } });
    const checkActive = await prisma.alias.findUnique({ where: { id: activeAlias.id } });

    expect(checkExpired.isActive).toBe(false);
    expect(checkActive.isActive).toBe(true);

    // Cleanup
    await prisma.alias.deleteMany({ where: { address: { contains: `_${Date.now()}` } } });
  });
});
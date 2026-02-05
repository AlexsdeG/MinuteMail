import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { CleanupService } from './../src/modules/cleanup/cleanup.service';
import { DataSource, Repository } from 'typeorm';
import { Alias } from './../src/modules/aliases/entities/alias.entity';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Cleanup Service (E2E)', () => {
  let app: INestApplication;
  let cleanupService: CleanupService;
  let aliasRepo: Repository<Alias>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    cleanupService = app.get(CleanupService);
    dataSource = app.get(DataSource);
    aliasRepo = dataSource.getRepository(Alias);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should soft-delete expired aliases', async () => {
    // 1. Create an alias that is expired
    const expiredAlias = aliasRepo.create({
      address: `expired_${Date.now()}@test.com`,
      isActive: true,
      expiresAt: new Date(Date.now() - 10000), // 10 seconds ago
    });
    await aliasRepo.save(expiredAlias);

    // 2. Create an alias that is active
    const activeAlias = aliasRepo.create({
      address: `active_${Date.now()}@test.com`,
      isActive: true,
      expiresAt: new Date(Date.now() + 100000), // Future
    });
    await aliasRepo.save(activeAlias);

    // 3. Manually trigger the cleanup task
    await cleanupService.handleExpiredAliases();

    // 4. Verify results
    const checkExpired = await aliasRepo.findOne({ where: { id: expiredAlias.id } });
    const checkActive = await aliasRepo.findOne({ where: { id: activeAlias.id } });

    expect(checkExpired.isActive).toBe(false);
    expect(checkActive.isActive).toBe(true);
  });
});
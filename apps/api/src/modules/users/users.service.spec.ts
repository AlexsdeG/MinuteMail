import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import * as bcrypt from 'bcryptjs';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PrismaService } from '../../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash password on create', async () => {
    const email = 'test@example.com';
    const password = 'plainPassword';

    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockImplementation((args) => 
      Promise.resolve({ id: '1', email: args.data.email, password: args.data.password, createdAt: new Date(), updatedAt: new Date() })
    );

    const result = await service.create(email, password);

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email }),
      })
    );
    expect(result.password).not.toEqual(password); // Should be hashed
    const isMatch = await bcrypt.compare(password, result.password);
    expect(isMatch).toBe(true);
  });
});
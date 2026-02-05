import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
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
    
    mockRepository.findOne.mockResolvedValue(null);
    mockRepository.create.mockImplementation((dto) => dto);
    mockRepository.save.mockImplementation((user) => Promise.resolve({ id: '1', ...user }));

    const result = await service.create(email, password);
    
    expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      email,
    }));
    expect(result.password).not.toEqual(password); // Should be hashed
    const isMatch = await bcrypt.compare(password, result.password);
    expect(isMatch).toBe(true);
  });
});
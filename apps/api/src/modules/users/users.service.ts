import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(email: string, pass: string): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Check if this is the first user - make them master admin
    const userCount = await this.prisma.user.count();
    const isMasterAdmin = userCount === 0;

    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(pass, salt);

    return this.prisma.user.create({
      data: { 
        email, 
        password,
        isMasterAdmin,
      },
    });
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user || undefined;
  }

  async findById(id: string): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user || undefined;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}
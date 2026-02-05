import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Alias, User } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class AliasesService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private generateRandomString(length: number): string {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }

  private requesterId(user: any) {
    return user?.userId ?? user?.id ?? null;
  }

  async create(user: User | null, customSlug?: string): Promise<Alias> {
    const domain = this.configService.get<string>('DOMAIN');
    let address = '';
    
    if (customSlug) {
      address = `${customSlug}@${domain}`;
      const existing = await this.prisma.alias.findUnique({ where: { address } });
      if (existing) {
        throw new BadRequestException('Alias is already taken.');
      }
    } else {
      let isUnique = false;
      // Retry loop to ensure uniqueness for random strings
      while (!isUnique) {
        const randomPart = this.generateRandomString(8);
        address = `${randomPart}@${domain}`;
        const existing = await this.prisma.alias.findUnique({ where: { address } });
        if (!existing) {
          isUnique = true;
        }
      }
    }

    const now = new Date();
    let expiresAt: Date;

    if (user) {
      // Registered User: 7 Days
      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      // Guest: 10 Minutes
      expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
    }

    return this.prisma.alias.create({
      data: {
        address,
        expiresAt,
        userId: this.requesterId(user),
        isActive: true,
      },
    });
  }

  async findAllForUser(user: User): Promise<Alias[]> {
    const id = this.requesterId(user);
    return this.prisma.alias.findMany({
      where: {
        userId: id,
        isActive: true,
      },
      orderBy: {
        expiresAt: 'desc',
      },
    });
  }

  async extend(id: string, user: any) {
    const alias = await this.prisma.alias.findUnique({ where: { id } });
    if (!alias) throw new NotFoundException('Alias not found');

    // Ownership check
    const requester = this.requesterId(user);
    if (alias.userId && (!requester || alias.userId !== requester)) {
      throw new ForbiddenException('You do not own this alias');
    }

    const now = new Date();
    const currentExpiry = alias.expiresAt > now ? alias.expiresAt : now;
    
    let newExpiresAt: Date;
    if (user) {
      // Users can extend up to 1 month max from now
      // Simple logic: Add 7 days
      newExpiresAt = new Date(currentExpiry.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      // Guests can extend by 10 mins, max 1 hour total?
      // Simplified: Just set to 10 mins from now
      newExpiresAt = new Date(now.getTime() + 10 * 60 * 1000);
    }

    return this.prisma.alias.update({
      where: { id },
      data: {
        expiresAt: newExpiresAt,
        isActive: true,
      },
    });
  }

  async delete(id: string, user: any) {
    const alias = await this.prisma.alias.findUnique({ where: { id } });
    if (!alias) throw new NotFoundException('Alias not found');

    const requester = this.requesterId(user);
    if (alias.userId && (!requester || alias.userId !== requester)) {
      throw new ForbiddenException('You do not own this alias');
    }

    return this.prisma.alias.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findOne(id: string, user: any) {
    const alias = await this.prisma.alias.findUnique({ where: { id } });
    if (!alias) throw new NotFoundException('Alias not found');

    const requester = this.requesterId(user);
    if (alias.userId && (!requester || alias.userId !== requester)) {
      throw new ForbiddenException('You do not own this alias');
    }

    return alias;
  }
}
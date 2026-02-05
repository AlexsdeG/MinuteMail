import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Alias, User } from '@prisma/client';
import * as crypto from 'crypto';

// Duration options in milliseconds
const DURATIONS: Record<string, number> = {
  '10min': 10 * 60 * 1000,
  '1hour': 60 * 60 * 1000,
  '1day': 24 * 60 * 60 * 1000,
  '1week': 7 * 24 * 60 * 60 * 1000,
  '1month': 30 * 24 * 60 * 60 * 1000,
};

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
      // Check both active aliases and historical UsedAddress table
      const [existingAlias, usedAddress] = await Promise.all([
        this.prisma.alias.findUnique({ where: { address } }),
        this.prisma.usedAddress.findUnique({ where: { address } }),
      ]);
      
      if (existingAlias || usedAddress) {
        throw new BadRequestException('Alias is already taken or was used before.');
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
      // Registered User: 1 Hour
      expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    } else {
      // Guest: 1 Hour
      expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    }

    // Create alias and record in UsedAddress for historical tracking
    const alias = await this.prisma.alias.create({
      data: {
        address,
        expiresAt,
        userId: this.requesterId(user),
        isActive: true,
        isPaused: false,
      },
    });

    // Track used address for future uniqueness checks
    await this.prisma.usedAddress.create({
      data: { address },
    }).catch(() => {
      // Ignore duplicate - address already tracked
    });

    return alias;
  }

  async checkSlugAvailability(slug: string): Promise<{ available: boolean; reason?: string }> {
    const domain = this.configService.get<string>('DOMAIN');
    const address = `${slug}@${domain}`;

    const [existingAlias, usedAddress] = await Promise.all([
      this.prisma.alias.findUnique({ where: { address } }),
      this.prisma.usedAddress.findUnique({ where: { address } }),
    ]);

    if (existingAlias) {
      return { available: false, reason: 'Alias is currently in use' };
    }
    if (usedAddress) {
      return { available: false, reason: 'Alias was previously used' };
    }
    return { available: true };
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

  async findAllWithUnreadCount(user: User): Promise<(Alias & { unreadCount: number })[]> {
    const id = this.requesterId(user);
    const aliases = await this.prisma.alias.findMany({
      where: {
        userId: id,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            emails: {
              where: { isRead: false },
            },
          },
        },
      },
      orderBy: {
        expiresAt: 'desc',
      },
    });

    return aliases.map((alias) => ({
      ...alias,
      unreadCount: alias._count?.emails ?? 0,
      _count: undefined,
    })) as (Alias & { unreadCount: number })[];
  }

  async getUnreadCount(id: string, user: any): Promise<{ unreadCount: number }> {
    const alias = await this.prisma.alias.findUnique({ where: { id } });
    if (!alias) throw new NotFoundException('Alias not found');

    const requester = this.requesterId(user);
    if (alias.userId && (!requester || alias.userId !== requester)) {
      throw new ForbiddenException('You do not own this alias');
    }

    const count = await this.prisma.email.count({
      where: { aliasId: id, isRead: false },
    });

    return { unreadCount: count };
  }

  async extend(id: string, user: any, duration: string = '1hour') {
    const alias = await this.prisma.alias.findUnique({ where: { id } });
    if (!alias) throw new NotFoundException('Alias not found');

    // Ownership check
    const requester = this.requesterId(user);
    if (alias.userId && (!requester || alias.userId !== requester)) {
      throw new ForbiddenException('You do not own this alias');
    }

    const now = new Date();
    const currentExpiry = alias.expiresAt > now ? alias.expiresAt : now;
    
    // Get duration in ms, default to 1 hour
    const durationMs = DURATIONS[duration] || DURATIONS['1hour'];
    
    // Apply limits based on user type
    let newExpiresAt: Date;
    if (user) {
      // Registered users: add the selected duration
      newExpiresAt = new Date(currentExpiry.getTime() + durationMs);
      
      // Cap at 3 months max from now
      const maxExpiry = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      if (newExpiresAt > maxExpiry) {
        newExpiresAt = maxExpiry;
      }
    } else {
      // Guests: limited to 10min extension, max 1 hour total
      const maxGuestExpiry = new Date(now.getTime() + 60 * 60 * 1000);
      newExpiresAt = new Date(currentExpiry.getTime() + 10 * 60 * 1000);
      if (newExpiresAt > maxGuestExpiry) {
        newExpiresAt = maxGuestExpiry;
      }
    }

    return this.prisma.alias.update({
      where: { id },
      data: {
        expiresAt: newExpiresAt,
        isActive: true,
      },
    });
  }

  async togglePause(id: string, user: any): Promise<Alias> {
    const alias = await this.prisma.alias.findUnique({ where: { id } });
    if (!alias) throw new NotFoundException('Alias not found');

    const requester = this.requesterId(user);
    if (alias.userId && (!requester || alias.userId !== requester)) {
      throw new ForbiddenException('You do not own this alias');
    }

    return this.prisma.alias.update({
      where: { id },
      data: { isPaused: !alias.isPaused },
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
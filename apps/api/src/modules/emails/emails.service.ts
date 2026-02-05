import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Email } from '@prisma/client';

@Injectable()
export class EmailsService {
  constructor(private prisma: PrismaService) {}

  async findAllByAlias(aliasId: string, user: any) {
    const alias = await this.prisma.alias.findUnique({
      where: { id: aliasId },
    });
    if (!alias) throw new NotFoundException('Alias not found');

    // Security Check:
    // 1. If Alias belongs to a user, requester MUST be that user.
    // 2. If Alias is anonymous (Guest), anyone with the ID can read (Standard Disposable Mail behavior).
    if (alias.userId && (!user || alias.userId !== user.userId)) {
      throw new ForbiddenException('You do not own this alias');
    }

    return this.prisma.email.findMany({
      where: { aliasId },
      orderBy: { receivedAt: 'desc' },
      select: {
        id: true,
        sender: true,
        subject: true,
        receivedAt: true,
        sizeBytes: true,
      },
    });
  }

  async findOne(id: string, user: any) {
    const email = await this.prisma.email.findUnique({
      where: { id },
      include: { alias: true },
    });

    if (!email) throw new NotFoundException('Email not found');

    if (email.alias.userId && (!user || email.alias.userId !== user.userId)) {
      throw new ForbiddenException('Access denied');
    }

    return email;
  }

  async delete(id: string, user: any) {
    const email = await this.findOne(id, user); // Perform lookup & auth check
    return this.prisma.email.delete({ where: { id } });
  }
}
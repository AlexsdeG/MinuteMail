import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Email } from '@prisma/client';

@Injectable()
export class EmailsService {
  constructor(private prisma: PrismaService) {}

  private requesterId(user: any): string | null {
    return user?.userId ?? user?.id ?? null;
  }

  async findAllByAlias(aliasId: string, user: any) {
    const alias = await this.prisma.alias.findUnique({
      where: { id: aliasId },
    });
    if (!alias) throw new NotFoundException('Alias not found');

    // Security Check:
    // 1. If Alias belongs to a user, requester MUST be that user.
    // 2. If Alias is anonymous (Guest), anyone with the ID can read (Standard Disposable Mail behavior).
    const requester = this.requesterId(user);
    if (alias.userId && (!requester || alias.userId !== requester)) {
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
        isRead: true,
      },
    });
  }

  async findOne(id: string, user: any): Promise<Email & { alias: any }> {
    const email = await this.prisma.email.findUnique({
      where: { id },
      include: { alias: true },
    });

    if (!email) throw new NotFoundException('Email not found');

    const requester = this.requesterId(user);
    if (email.alias.userId && (!requester || email.alias.userId !== requester)) {
      throw new ForbiddenException('Access denied');
    }

    // Auto-mark as read when viewing
    if (!email.isRead) {
      await this.prisma.email.update({
        where: { id },
        data: { isRead: true },
      });
    }

    return email;
  }

  async markRead(id: string, user: any, isRead: boolean): Promise<Email> {
    const email = await this.prisma.email.findUnique({
      where: { id },
      include: { alias: true },
    });

    if (!email) throw new NotFoundException('Email not found');

    const requester = this.requesterId(user);
    if (email.alias.userId && (!requester || email.alias.userId !== requester)) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.email.update({
      where: { id },
      data: { isRead },
    });
  }

  async generateEmlContent(id: string, user: any): Promise<{ filename: string; content: string }> {
    const email = await this.findOne(id, user);
    
    // Generate RFC 822 compliant .eml format
    const headers = [
      `From: ${email.sender}`,
      `To: ${email.alias.address}`,
      `Subject: ${email.subject || '(no subject)'}`,
      `Date: ${new Date(email.receivedAt).toUTCString()}`,
      `Content-Type: text/html; charset=utf-8`,
      `MIME-Version: 1.0`,
    ].join('\r\n');

    const body = email.bodyHtml || email.bodyText || '';
    const emlContent = `${headers}\r\n\r\n${body}`;
    
    // Generate filename from subject
    const safeSubject = (email.subject || 'email')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    const filename = `${safeSubject}_${Date.now()}.eml`;

    return { filename, content: emlContent };
  }

  async delete(id: string, user: any) {
    await this.findOne(id, user); // Perform lookup & auth check
    return this.prisma.email.delete({ where: { id } });
  }

  async deleteMany(ids: string[], user: any): Promise<{ count: number }> {
    // Verify ownership of all emails first
    for (const id of ids) {
      await this.findOne(id, user);
    }

    const result = await this.prisma.email.deleteMany({
      where: { id: { in: ids } },
    });

    return { count: result.count };
  }
}
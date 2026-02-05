import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailSenderService } from '../email-sender/email-sender.service';
import * as crypto from 'crypto';

@Injectable()
export class InvitesService {
  constructor(
    private prisma: PrismaService,
    private emailSender: EmailSenderService,
  ) {}

  async createInvite(creatorId: string, email?: string, expiresInDays = 7) {
    // Verify creator is master admin
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: { isMasterAdmin: true },
    });

    if (!creator?.isMasterAdmin) {
      throw new ForbiddenException('Only master admin can create invites');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const invite = await this.prisma.inviteToken.create({
      data: {
        token,
        email: email || null,
        expiresAt,
        createdBy: creatorId,
      },
    });

    // Send invite email if email provided
    if (email) {
      try {
        await this.emailSender.sendInviteEmail(email, token);
      } catch (error) {
        // Log but don't fail - invite still created
        console.error('Failed to send invite email:', error);
      }
    }

    return {
      id: invite.id,
      token: invite.token,
      email: invite.email,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    };
  }

  async listInvites(userId: string) {
    // Verify user is master admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isMasterAdmin: true },
    });

    if (!user?.isMasterAdmin) {
      throw new ForbiddenException('Only master admin can view invites');
    }

    return this.prisma.inviteToken.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        token: true,
        email: true,
        expiresAt: true,
        usedAt: true,
        createdAt: true,
      },
    });
  }

  async revokeInvite(userId: string, inviteId: string) {
    // Verify user is master admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isMasterAdmin: true },
    });

    if (!user?.isMasterAdmin) {
      throw new ForbiddenException('Only master admin can revoke invites');
    }

    const invite = await this.prisma.inviteToken.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    await this.prisma.inviteToken.delete({
      where: { id: inviteId },
    });

    return { message: 'Invite revoked successfully' };
  }

  async validateToken(token: string) {
    const invite = await this.prisma.inviteToken.findUnique({
      where: { token },
    });

    if (!invite) {
      return { valid: false, reason: 'Invalid invite token' };
    }

    if (invite.usedAt) {
      return { valid: false, reason: 'Invite has already been used' };
    }

    if (new Date() > invite.expiresAt) {
      return { valid: false, reason: 'Invite has expired' };
    }

    return { 
      valid: true, 
      email: invite.email,
      expiresAt: invite.expiresAt,
    };
  }

  async markTokenUsed(token: string) {
    await this.prisma.inviteToken.update({
      where: { token },
      data: { usedAt: new Date() },
    });
  }
}

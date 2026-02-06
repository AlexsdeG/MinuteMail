import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { randomBytes } from 'crypto';

@Injectable()
export class EmailVerificationService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  /**
   * Generate a secure verification token for a user
   */
  async generateToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token valid for 24 hours

    await this.prisma.emailVerificationToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Validate a token and verify the user's email
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new NotFoundException('Invalid verification token');
    }

    if (verificationToken.expiresAt < new Date()) {
      // Clean up expired token
      await this.prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      throw new BadRequestException('Verification token has expired');
    }

    // Verify user
    await this.usersService.update(verificationToken.userId, {
      emailVerified: true,
    });

    // Clean up used token
    await this.prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    return { message: 'Email verified successfully' };
  }

  /**
   * Resend verification email
   */
  async createVerificationTokenForUser(email: string): Promise<string> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Delete any existing tokens for this user to avoid clutter
    await this.prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    return this.generateToken(user.id);
  }
}

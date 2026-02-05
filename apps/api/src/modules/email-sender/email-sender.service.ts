import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_MAIL_PORT') || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const domain = this.configService.get<string>('DOMAIN') || 'localhost';
    const verifyUrl = `https://${domain}/verify-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM') || 'noreply@example.com',
        to,
        subject: 'Verify your email address',
        html: `
          <h2>Email Verification</h2>
          <p>Click the link below to verify your email address:</p>
          <a href="${verifyUrl}">${verifyUrl}</a>
          <p>This link will expire in 24 hours.</p>
        `,
      });
      this.logger.log(`Verification email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${to}`, error);
      throw error;
    }
  }

  async sendInviteEmail(to: string, inviteToken: string): Promise<void> {
    const domain = this.configService.get<string>('DOMAIN') || 'localhost';
    const inviteUrl = `https://${domain}/register?invite=${inviteToken}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM') || 'noreply@example.com',
        to,
        subject: 'You have been invited to MinuteMail',
        html: `
          <h2>Invitation to MinuteMail</h2>
          <p>You have been invited to create an account on MinuteMail.</p>
          <p>Click the link below to register:</p>
          <a href="${inviteUrl}">${inviteUrl}</a>
          <p>This invitation will expire in 7 days.</p>
        `,
      });
      this.logger.log(`Invite email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send invite email to ${to}`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const domain = this.configService.get<string>('DOMAIN') || 'localhost';
    const resetUrl = `https://${domain}/reset-password?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM') || 'noreply@example.com',
        to,
        subject: 'Reset your password',
        html: `
          <h2>Password Reset</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>This link will expire in 1 hour.</p>
        `,
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}`, error);
      throw error;
    }
  }
}

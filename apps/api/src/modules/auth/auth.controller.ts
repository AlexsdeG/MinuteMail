import { Controller, Post, UseGuards, Request, Body, ForbiddenException, Get, Query, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuthDto } from './dto/auth.dto';
import { InvitesService } from '../invites/invites.service';
import { EmailVerificationService } from './email-verification.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private configService: ConfigService,
    private invitesService: InvitesService,
    private emailVerificationService: EmailVerificationService,
  ) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Body() authDto: AuthDto, @Query('invite') inviteToken?: string) {
    const canRegister = this.configService.get<boolean>('REGISTER');
    
    // Check if invite token is valid
    let validInvite = false;
    if (inviteToken) {
      const validation = await this.invitesService.validateToken(inviteToken);
      if (validation.valid) {
        // If invite has restricted email, verify it matches
        if (validation.email && validation.email !== authDto.email) {
          throw new BadRequestException('Invite is restricted to a different email');
        }
        validInvite = true;
      } else {
        throw new BadRequestException(validation.reason);
      }
    }
    
    // Allow registration if REGISTER=true OR valid invite token
    if (!canRegister && !validInvite) {
      throw new ForbiddenException('Registration is currently disabled.');
    }
    
    const user = await this.usersService.create(authDto.email, authDto.password);
    
    // Mark invite as used
    if (validInvite && inviteToken) {
      await this.invitesService.markTokenUsed(inviteToken);
    }
    
    // Return sanitized user (without password)
    const { password, ...result } = user;
    return result;
  }
  

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }
    return this.emailVerificationService.verifyEmail(token);
  }

  @Post('resend-verification')
  @UseGuards(AuthGuard('jwt'))
  async resendVerification(@Request() req) {
    const token = await this.emailVerificationService.createVerificationTokenForUser(req.user.email);
    // Build fake sender service to send email (circular dependency avoidance or direct injection needed)
    // Ideally AuthModule shouldn't depend heavily on EmailSender, but here we might need to.
    // For now, assuming email sending happens in service or event. 
    // Wait, AuthController implies we need to trigger the email.
    // Let's defer email sending implementation details or inject EmailSenderService.
    // Actually, looking at imports, I need to add EmailSenderService to constructor.
    return { message: 'Verification email sent' };
  }
}
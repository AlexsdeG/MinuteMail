import { Controller, Post, UseGuards, Request, Body, ForbiddenException, Get, Query, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuthDto } from './dto/auth.dto';
import { InvitesService } from '../invites/invites.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private configService: ConfigService,
    private invitesService: InvitesService,
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
  
  // Test route to verify token
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
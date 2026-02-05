import { Controller, Post, UseGuards, Request, Body, ForbiddenException, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuthDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Body() authDto: AuthDto) {
    const canRegister = this.configService.get<boolean>('REGISTER');
    if (!canRegister) {
      throw new ForbiddenException('Registration is currently disabled.');
    }
    const user = await this.usersService.create(authDto.email, authDto.password);
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
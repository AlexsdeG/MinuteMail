import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Request() req) {
    return this.settingsService.getProfile(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('password')
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.settingsService.changePassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('email')
  async requestEmailChange(@Request() req, @Body() dto: ChangeEmailDto) {
    return this.settingsService.requestEmailChange(req.user.userId, dto.newEmail);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('send-verification')
  async sendVerificationEmail(@Request() req) {
    return this.settingsService.sendVerificationEmail(req.user.userId);
  }

  // Public endpoint - no auth required
  @Get('verify/:token')
  async verifyEmail(@Param('token') token: string) {
    return this.settingsService.verifyEmail(token);
  }
}


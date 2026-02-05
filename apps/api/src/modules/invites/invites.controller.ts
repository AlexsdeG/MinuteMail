import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';

@Controller('invites')
export class InvitesController {
  constructor(private invitesService: InvitesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createInvite(@Request() req, @Body() dto: CreateInviteDto) {
    return this.invitesService.createInvite(req.user.userId, dto.email, dto.expiresInDays);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async listInvites(@Request() req) {
    return this.invitesService.listInvites(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async revokeInvite(@Request() req, @Param('id') id: string) {
    return this.invitesService.revokeInvite(req.user.userId, id);
  }

  // Public endpoint to validate invite token
  @Get('validate/:token')
  async validateToken(@Param('token') token: string) {
    return this.invitesService.validateToken(token);
  }
}

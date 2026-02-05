import { Controller, Get, Delete, Param, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Controller()
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get('aliases/:aliasId/emails')
  async findAll(@Request() req, @Param('aliasId', ParseUUIDPipe) aliasId: string) {
    return this.emailsService.findAllByAlias(aliasId, req.user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('emails/:id')
  async findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.emailsService.findOne(id, req.user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Delete('emails/:id')
  async delete(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.emailsService.delete(id, req.user);
  }
}
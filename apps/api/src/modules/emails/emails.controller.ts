import { Controller, Get, Delete, Patch, Param, UseGuards, Request, ParseUUIDPipe, Body, Res } from '@nestjs/common';
import { Response } from 'express';
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
  @Patch('emails/:id/read')
  async markRead(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { isRead: boolean },
  ) {
    return this.emailsService.markRead(id, req.user, body.isRead ?? true);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('emails/:id/download')
  async download(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { filename, content } = await this.emailsService.generateEmlContent(id, req.user);
    res.setHeader('Content-Type', 'message/rfc822');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Delete('emails/:id')
  async delete(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.emailsService.delete(id, req.user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Delete('emails')
  async deleteMany(@Request() req, @Body() body: { ids: string[] }) {
    return this.emailsService.deleteMany(body.ids, req.user);
  }
}
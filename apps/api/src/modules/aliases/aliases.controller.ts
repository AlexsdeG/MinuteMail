import { Controller, Post, Get, Patch, Delete, UseGuards, Request, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { AliasesService } from './aliases.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CreateAliasDto } from './dto/create-alias.dto';

@Controller('aliases')
export class AliasesController {
  constructor(private readonly aliasesService: AliasesService) {}

  @UseGuards(ThrottlerGuard, OptionalJwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() createAliasDto: CreateAliasDto) {
    // req.user will be populated if token is valid, null otherwise
    return this.aliasesService.create(req.user, createAliasDto.slug);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Request() req) {
    return this.aliasesService.findAllForUser(req.user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Patch(':id/extend')
  async extend(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.aliasesService.extend(id, req.user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.aliasesService.findOne(id, req.user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Delete(':id')
  async delete(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.aliasesService.delete(id, req.user);
  }
}
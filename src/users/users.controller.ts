import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import type { JwtPayload } from '../auth/jwt-payload.interface.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  @Permissions('users:create')
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.users.create(dto, actor.tenantId);
  }

  @Get()
  @Permissions('users:read')
  findAll(@CurrentUser() actor: JwtPayload) {
    return this.users.findAll(actor.tenantId);
  }

  @Get(':id')
  @Permissions('users:read')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.users.findOne(id, actor.tenantId);
  }

  @Patch(':id')
  @Permissions('users:update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.users.update(id, dto, actor.tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('users:delete')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<void> {
    await this.users.remove(id, actor.tenantId);
  }
}

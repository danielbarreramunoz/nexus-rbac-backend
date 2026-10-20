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
import type { CreateRoleDto } from './dto/create-role.dto.js';
import type { UpdateRoleDto } from './dto/update-role.dto.js';
import { RolesService } from './roles.service.js';

@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Post()
  @Permissions('roles:create')
  create(@Body() dto: CreateRoleDto, @CurrentUser() actor: JwtPayload) {
    return this.roles.create(dto, actor.tenantId);
  }

  @Get()
  @Permissions('roles:read')
  findAll(@CurrentUser() actor: JwtPayload) {
    return this.roles.findAll(actor.tenantId);
  }

  @Get(':id')
  @Permissions('roles:read')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.roles.findOne(id, actor.tenantId);
  }

  @Patch(':id')
  @Permissions('roles:update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.roles.update(id, dto, actor.tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('roles:delete')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<void> {
    await this.roles.remove(id, actor.tenantId);
  }
}

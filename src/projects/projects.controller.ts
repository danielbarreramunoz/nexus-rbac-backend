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
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { ProjectsService } from './projects.service.js';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  @Permissions('projects:create')
  create(@Body() dto: CreateProjectDto, @CurrentUser() actor: JwtPayload) {
    return this.projects.create(dto, actor.tenantId);
  }

  @Get()
  @Permissions('projects:read')
  findAll(@CurrentUser() actor: JwtPayload) {
    return this.projects.findAll(actor.tenantId);
  }

  @Get(':id')
  @Permissions('projects:read')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.projects.findOne(id, actor.tenantId);
  }

  @Patch(':id')
  @Permissions('projects:update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.projects.update(id, dto, actor.tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('projects:delete')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<void> {
    await this.projects.remove(id, actor.tenantId);
  }
}

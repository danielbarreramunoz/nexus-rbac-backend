import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';
import { TenantsService } from './tenants.service.js';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  @Permissions('tenants:create')
  create(@Body() dto: CreateTenantDto) {
    return this.tenants.create(dto);
  }

  @Get()
  findAll() {
    return this.tenants.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenants.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  @Permissions('tenants:update')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTenantDto) {
    return this.tenants.update(id, dto);
  }
}

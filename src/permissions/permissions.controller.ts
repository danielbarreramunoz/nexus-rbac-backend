import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { Permission } from '../entities/permission.entity.js';

@Controller('permissions')
export class PermissionsController {
  constructor(
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
  ) {}

  @Get()
  @Permissions('roles:read')
  findAll(): Promise<Permission[]> {
    return this.permissions.find({ order: { code: 'ASC' } });
  }
}

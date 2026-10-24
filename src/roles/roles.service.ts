import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, type FindOptionsWhere } from 'typeorm';
import { Permission } from '../entities/permission.entity.js';
import { Role } from '../entities/role.entity.js';
import type { CreateRoleDto } from './dto/create-role.dto.js';
import type { UpdateRoleDto } from './dto/update-role.dto.js';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
  ) {}

  private scope(tenantId: string | null): FindOptionsWhere<Role> {
    return tenantId ? { tenantId } : {};
  }

  private async resolvePermissions(ids: string[] | undefined): Promise<Permission[]> {
    if (!ids || ids.length === 0) return [];
    const unique = [...new Set(ids)];
    const found = await this.permissions.find({ where: { id: In(unique) } });
    if (found.length !== unique.length) {
      throw new NotFoundException('One or more permissionIds do not exist');
    }
    return found;
  }

  async create(dto: CreateRoleDto, tenantId: string | null): Promise<Role> {
    const exists = await this.roles.findOne({
      where: { name: dto.name, ...this.scope(tenantId) },
    });
    if (exists) throw new ConflictException(`Role '${dto.name}' already exists`);
    const role = this.roles.create({
      name: dto.name,
      description: dto.description ?? null,
      tenantId,
      permissions: await this.resolvePermissions(dto.permissionIds),
    });
    return this.roles.save(role);
  }

  findAll(tenantId: string | null): Promise<Role[]> {
    return this.roles.find({
      where: this.scope(tenantId),
      relations: { permissions: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string | null): Promise<Role> {
    const role = await this.roles.findOne({
      where: { id, ...this.scope(tenantId) },
      relations: { permissions: true },
    });
    if (!role) throw new NotFoundException(`Role '${id}' not found`);
    return role;
  }

  async update(
    id: string,
    dto: UpdateRoleDto,
    tenantId: string | null,
  ): Promise<Role> {
    const role = await this.findOne(id, tenantId);
    if (role.isProtected) {
      throw new ForbiddenException(
        'Rol demo protegido: usa "Restablecer demo" para restaurarlo',
      );
    }
    if (dto.name !== undefined) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description;
    if (dto.permissionIds !== undefined) {
      role.permissions = await this.resolvePermissions(dto.permissionIds);
    }
    return this.roles.save(role);
  }

  async remove(id: string, tenantId: string | null): Promise<void> {
    const role = await this.findOne(id, tenantId);
    if (role.isProtected) {
      throw new ForbiddenException(
        'Rol demo protegido: usa "Restablecer demo" para restaurarlo',
      );
    }
    await this.roles.remove(role);
  }
}

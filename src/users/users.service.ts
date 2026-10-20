import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { In, Repository, type FindOptionsWhere } from 'typeorm';
import { Role } from '../entities/role.entity.js';
import { User } from '../entities/user.entity.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
  ) {}

  private scope(tenantId: string | null): FindOptionsWhere<User> {
    return tenantId ? { tenantId } : {};
  }

  private async resolveRoles(roleIds: string[] | undefined): Promise<Role[]> {
    if (!roleIds || roleIds.length === 0) return [];
    const unique = [...new Set(roleIds)];
    const found = await this.roles.find({ where: { id: In(unique) } });
    if (found.length !== unique.length) {
      throw new NotFoundException('One or more roleIds do not exist');
    }
    return found;
  }

  async create(dto: CreateUserDto, tenantId: string | null): Promise<User> {
    const exists = await this.users.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException(`Email '${dto.email}' already in use`);
    const password = await bcrypt.hash(dto.password, 10);
    const user = this.users.create({
      email: dto.email,
      password,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      isActive: true,
      tenantId,
      roles: await this.resolveRoles(dto.roleIds),
    });
    const saved = await this.users.save(user);
    return this.findOne(saved.id, tenantId);
  }

  findAll(tenantId: string | null): Promise<User[]> {
    return this.users.find({
      where: this.scope(tenantId),
      relations: { roles: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string | null): Promise<User> {
    const user = await this.users.findOne({
      where: { id, ...this.scope(tenantId) },
      relations: { roles: { permissions: true } },
    });
    if (!user) throw new NotFoundException(`User '${id}' not found`);
    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    tenantId: string | null,
  ): Promise<User> {
    const user = await this.findOne(id, tenantId);
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.roleIds !== undefined) user.roles = await this.resolveRoles(dto.roleIds);
    return this.users.save(user);
  }

  async remove(id: string, tenantId: string | null): Promise<void> {
    const user = await this.findOne(id, tenantId);
    await this.users.remove(user);
  }

  assertTenantAccess(resourceTenantId: string | null, actorTenantId: string | null): void {
    if (actorTenantId === null) return;
    if (resourceTenantId !== actorTenantId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }
  }
}

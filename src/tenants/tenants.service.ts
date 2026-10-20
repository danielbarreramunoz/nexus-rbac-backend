import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity.js';
import type { CreateTenantDto } from './dto/create-tenant.dto.js';
import type { UpdateTenantDto } from './dto/update-tenant.dto.js';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
  ) {}

  async create(dto: CreateTenantDto): Promise<Tenant> {
    const exists = await this.tenants.findOne({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException(`Tenant slug '${dto.slug}' already exists`);
    const tenant = this.tenants.create({
      name: dto.name,
      slug: dto.slug,
      isActive: dto.isActive ?? true,
    });
    return this.tenants.save(tenant);
  }

  findAll(): Promise<Tenant[]> {
    return this.tenants.find({ order: { createdAt: 'ASC' } });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenants.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant '${id}' not found`);
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    if (dto.slug && dto.slug !== tenant.slug) {
      const exists = await this.tenants.findOne({ where: { slug: dto.slug } });
      if (exists) throw new ConflictException(`Tenant slug '${dto.slug}' already exists`);
    }
    Object.assign(tenant, dto);
    return this.tenants.save(tenant);
  }
}

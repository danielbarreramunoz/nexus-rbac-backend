import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type FindOptionsWhere } from 'typeorm';
import { Project } from '../entities/project.entity.js';
import type { CreateProjectDto } from './dto/create-project.dto.js';
import type { UpdateProjectDto } from './dto/update-project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
  ) {}

  private scope(tenantId: string | null): FindOptionsWhere<Project> {
    return tenantId ? { tenantId } : {};
  }

  create(dto: CreateProjectDto, tenantId: string | null): Promise<Project> {
    return this.projects.save(
      this.projects.create({
        name: dto.name,
        description: dto.description ?? null,
        tenantId,
      }),
    );
  }

  findAll(tenantId: string | null): Promise<Project[]> {
    return this.projects.find({
      where: this.scope(tenantId),
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string | null): Promise<Project> {
    const project = await this.projects.findOne({
      where: { id, ...this.scope(tenantId) },
    });
    if (!project) throw new NotFoundException(`Project '${id}' not found`);
    return project;
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    tenantId: string | null,
  ): Promise<Project> {
    const project = await this.findOne(id, tenantId);
    if (dto.name !== undefined) project.name = dto.name;
    if (dto.description !== undefined) project.description = dto.description;
    return this.projects.save(project);
  }

  async remove(id: string, tenantId: string | null): Promise<void> {
    await this.projects.remove(await this.findOne(id, tenantId));
  }
}

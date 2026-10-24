import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity.js';
import { Project } from '../entities/project.entity.js';
import { Role } from '../entities/role.entity.js';
import { Tenant } from '../entities/tenant.entity.js';
import { User } from '../entities/user.entity.js';

const PERMISSION_CODES = [
  'tenants:create',
  'tenants:update',
  'users:create',
  'users:read',
  'users:update',
  'users:delete',
  'roles:create',
  'roles:read',
  'roles:update',
  'roles:delete',
  'projects:create',
  'projects:read',
  'projects:update',
  'projects:delete',
];

const DEMO_PASSWORD = 'Demo1234';

@Injectable()
export class DemoService {
  constructor(
    @InjectRepository(Tenant) private readonly tenants: Repository<Tenant>,
    @InjectRepository(Permission) private readonly permissions: Repository<Permission>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Project) private readonly projects: Repository<Project>,
  ) {}

  async resetDemo(): Promise<{ users: string[]; password: string }> {
    const permEntities: Permission[] = [];
    for (const code of PERMISSION_CODES) {
      let perm = await this.permissions.findOne({ where: { code } });
      if (!perm) perm = await this.permissions.save({ code, description: `Permite ${code}` });
      permEntities.push(perm);
    }
    const byCode = (codes: string[]): Permission[] =>
      codes.map((c) => permEntities.find((p) => p.code === c)!);

    let demo = await this.tenants.findOne({ where: { slug: 'demo' } });
    if (!demo) demo = await this.tenants.save({ name: 'Demo', slug: 'demo', isActive: true });

    const roleDefs = [
      {
        name: 'SUPER_ADMIN',
        description: 'Acceso total',
        tenantId: null,
        permissions: permEntities,
      },
      {
        name: 'TENANT_ADMIN',
        description: 'Administra su tenant',
        tenantId: demo.id,
        permissions: byCode([
          'users:create', 'users:read', 'users:update', 'users:delete',
          'roles:read',
          'projects:create', 'projects:read', 'projects:update', 'projects:delete',
        ]),
      },
      {
        name: 'VIEWER',
        description: 'Solo lectura',
        tenantId: demo.id,
        permissions: byCode(['users:read', 'roles:read', 'projects:read']),
      },
    ];
    const roleEntities: Record<string, Role> = {};
    for (const def of roleDefs) {
      let role = await this.roles.findOne({ where: { name: def.name } });
      if (!role) role = await this.roles.save({ ...def, isProtected: true });
      role.permissions = def.permissions;
      role.isProtected = true;
      roleEntities[def.name] = await this.roles.save(role);
    }

    const password = await bcrypt.hash(DEMO_PASSWORD, 10);
    const userDefs = [
      { email: 'admin@nexus.demo', firstName: 'Demo', lastName: 'Admin', tenantId: null, roles: [roleEntities.SUPER_ADMIN] },
      { email: 'manager@nexus.demo', firstName: 'Demo', lastName: 'Manager', tenantId: demo.id, roles: [roleEntities.TENANT_ADMIN] },
      { email: 'viewer@nexus.demo', firstName: 'Demo', lastName: 'Viewer', tenantId: demo.id, roles: [roleEntities.VIEWER] },
    ];
    for (const def of userDefs) {
      let user = await this.users.findOne({ where: { email: def.email } });
      if (!user) user = this.users.create({ ...def, isActive: true, isProtected: true });
      Object.assign(user, { ...def, password, isActive: true, isProtected: true });
      await this.users.save(user);
    }

    for (const name of ['Portal demo', 'Intranet Acme']) {
      const existing = await this.projects.findOne({ where: { name, tenantId: demo.id } });
      if (!existing) {
        await this.projects.save({ name, description: `Proyecto de ejemplo (${name})`, tenantId: demo.id });
      }
    }

    return { users: userDefs.map((u) => u.email), password: DEMO_PASSWORD };
  }
}

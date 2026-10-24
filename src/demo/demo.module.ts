import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../entities/permission.entity.js';
import { Project } from '../entities/project.entity.js';
import { Role } from '../entities/role.entity.js';
import { Tenant } from '../entities/tenant.entity.js';
import { User } from '../entities/user.entity.js';
import { DemoController } from './demo.controller.js';
import { DemoService } from './demo.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Permission, Role, User, Project])],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}

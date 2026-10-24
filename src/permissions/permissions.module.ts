import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../entities/permission.entity.js';
import { PermissionsController } from './permissions.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Permission])],
  controllers: [PermissionsController],
})
export class PermissionsModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../entities/tenant.entity.js';
import { User } from '../entities/user.entity.js';
import { Role } from '../entities/role.entity.js';
import { Permission } from '../entities/permission.entity.js';
import { Project } from '../entities/project.entity.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', config.get<string>('DB_USER', 'postgres')),
        password: config.get<string>('DB_PASSWORD', config.get<string>('DB_PASS', 'postgres')),
        database: config.get<string>('DB_NAME', 'nexus_rbac'),
        entities: [Tenant, User, Role, Permission, Project],
        synchronize: config.get<string>('DB_SYNC', 'false') === 'true',
        logging: config.get<string>('DB_LOGGING', 'false') === 'true',
      }),
    }),
  ],
})
export class DatabaseModule {}

import {
  Controller,
  Get,
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AuthController } from '../src/auth/auth.controller.js';
import { AuthService } from '../src/auth/auth.service.js';
import { Permissions } from '../src/auth/decorators/permissions.decorator.js';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard.js';
import { RolesGuard } from '../src/auth/guards/roles.guard.js';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy.js';

@Controller('protected')
class ProtectedController {
  @Get()
  @Permissions('test:read')
  ping(): { ok: boolean } {
    return { ok: true };
  }
}

describe('RBAC (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PassportModule,
        JwtModule.register({ secret: 'e2e-secret', signOptions: { expiresIn: '60s' } }),
      ],
      controllers: [AuthController, ProtectedController],
      providers: [
        JwtStrategy,
        { provide: AuthService, useValue: { login: vi.fn(async () => ({ accessToken: 'mock' })) } },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
        { provide: APP_GUARD, useClass: PermissionsGuard },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /protected sin Bearer token -> 401 Unauthorized', async () => {
    await request(app.getHttpServer()).get('/protected').expect(401);
  });

  it('POST /auth/login con DTO invalido -> 400 Bad Request', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);
    expect(res.body.message).toBeDefined();
  });

  it('POST /auth/login con DTO valido -> 200', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'a@x.com', password: 'Password123' })
      .expect(200);
  });
});

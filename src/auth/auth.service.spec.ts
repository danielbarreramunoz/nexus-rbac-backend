import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { User } from '../entities/user.entity.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  const findOne = vi.fn();
  const signAsync = vi.fn();

  const passwordHash = () => bcrypt.hash('Password123', 4);

  beforeEach(async () => {
    findOne.mockReset();
    signAsync.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: { findOne } },
        { provide: JwtService, useValue: { signAsync } },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('login exitoso retorna accessToken con roles y permisos', async () => {
    findOne.mockResolvedValue({
      id: 'u1',
      email: 'a@x.com',
      password: await passwordHash(),
      tenantId: 't1',
      roles: [
        {
          name: 'ADMIN',
          permissions: [{ code: 'users:read' }, { code: 'users:read' }],
        },
      ],
    });
    signAsync.mockResolvedValue('signed-token');

    const result = await service.login('a@x.com', 'Password123');

    expect(result).toEqual({ accessToken: 'signed-token' });
    expect(signAsync).toHaveBeenCalledWith({
      sub: 'u1',
      email: 'a@x.com',
      tenantId: 't1',
      roles: ['ADMIN'],
      permissions: ['users:read'],
    });
  });

  it('lanza UnauthorizedException si el usuario no existe', async () => {
    findOne.mockResolvedValue(null);
    await expect(service.login('no@x.com', 'Password123')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(signAsync).not.toHaveBeenCalled();
  });

  it('lanza UnauthorizedException con password incorrecto', async () => {
    findOne.mockResolvedValue({
      id: 'u1',
      email: 'a@x.com',
      password: await passwordHash(),
      tenantId: 't1',
      roles: [],
    });
    await expect(service.login('a@x.com', 'WrongPass1')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(signAsync).not.toHaveBeenCalled();
  });
});

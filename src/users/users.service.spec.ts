import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '../entities/role.entity.js';
import { User } from '../entities/user.entity.js';
import { UsersService } from './users.service.js';

describe('UsersService (tenant isolation)', () => {
  let service: UsersService;
  const usersStore = { find: vi.fn(), findOne: vi.fn(), create: vi.fn(), save: vi.fn(), remove: vi.fn() };
  const rolesStore = { find: vi.fn() };

  beforeEach(async () => {
    Object.values(usersStore).forEach((fn) => fn.mockReset());
    rolesStore.find.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: usersStore },
        { provide: getRepositoryToken(Role), useValue: rolesStore },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  it('findAll filtra siempre por el tenantId del actor', async () => {
    usersStore.find.mockResolvedValue([]);
    await service.findAll('tenant-1');
    expect(usersStore.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-1' } }),
    );
  });

  it('findAll sin tenant (super-admin) no aplica filtro', async () => {
    usersStore.find.mockResolvedValue([]);
    await service.findAll(null);
    expect(usersStore.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('findOne no expone usuarios de otro tenant (404)', async () => {
    usersStore.findOne.mockResolvedValue(null);
    await expect(service.findOne('u1', 'tenant-1')).rejects.toThrow();
    expect(usersStore.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1', tenantId: 'tenant-1' } }),
    );
  });

  it('remove rechaza cuentas demo protegidas', async () => {
    usersStore.findOne.mockResolvedValue({ id: 'u1', isProtected: true });
    await expect(service.remove('u1', 'tenant-1', 'u2')).rejects.toThrow(/protegida/);
    expect(usersStore.remove).not.toHaveBeenCalled();
  });

  it('remove rechaza la auto-eliminación', async () => {
    await expect(service.remove('u1', 'tenant-1', 'u1')).rejects.toThrow(/propia/);
    expect(usersStore.remove).not.toHaveBeenCalled();
  });
});

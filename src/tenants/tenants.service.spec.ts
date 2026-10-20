import { ConflictException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Tenant } from '../entities/tenant.entity.js';
import { TenantsService } from './tenants.service.js';

describe('TenantsService', () => {
  let service: TenantsService;
  const store = { find: vi.fn(), findOne: vi.fn(), create: vi.fn(), save: vi.fn() };

  beforeEach(async () => {
    Object.values(store).forEach((fn) => fn.mockReset());
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: getRepositoryToken(Tenant), useValue: store },
      ],
    }).compile();
    service = module.get<TenantsService>(TenantsService);
  });

  it('create guarda un tenant con slug unico', async () => {
    store.findOne.mockResolvedValue(null);
    store.create.mockImplementation((v: unknown) => v);
    store.save.mockImplementation(async (v: unknown) => ({ id: 't1', ...(v as object) }));
    const result = await service.create({ name: 'Acme', slug: 'acme-corp' });
    expect(result.slug).toBe('acme-corp');
    expect(store.save).toHaveBeenCalled();
  });

  it('create lanza ConflictException (409) si el slug se repite', async () => {
    store.findOne.mockResolvedValue({ id: 't0', slug: 'acme-corp' });
    await expect(
      service.create({ name: 'Otro', slug: 'acme-corp' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(store.save).not.toHaveBeenCalled();
  });
});

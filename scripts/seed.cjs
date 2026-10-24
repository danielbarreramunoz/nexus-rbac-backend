/**
 * Seed idempotente para demo/portafolio.
 * Uso: npm run seed  (compila y ejecuta contra dist/)
 *
 * Crea: permisos base, tenant "demo", roles SUPER_ADMIN / TENANT_ADMIN /
 * VIEWER y 3 usuarios demo (password: Demo1234).
 */
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const { DataSource } = require('typeorm');

dotenv.config();

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

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? 'Demo1234';

async function findOrCreate(repo, where, data) {
  const found = await repo.findOne({ where });
  if (found) return { entity: found, created: false };
  const entity = await repo.save(repo.create(data));
  return { entity, created: true };
}

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? 'postgres',
    database: process.env.DB_NAME ?? 'nexus_rbac',
    entities: [__dirname + '/../dist/entities/*.entity.js'],
    synchronize: true,
  });
  await ds.initialize();

  const tenants = ds.getRepository('Tenant');
  const permissions = ds.getRepository('Permission');
  const roles = ds.getRepository('Role');
  const users = ds.getRepository('User');
  const projects = ds.getRepository('Project');

  const permEntities = [];
  for (const code of PERMISSION_CODES) {
    const { entity } = await findOrCreate(
      permissions,
      { code },
      { code, description: `Permite ${code}` },
    );
    permEntities.push(entity);
  }
  const byCode = new Map(permEntities.map((p) => [p.code, p]));
  const pick = (...codes) => codes.map((c) => byCode.get(c));

  const { entity: demo } = await findOrCreate(
    tenants,
    { slug: 'demo' },
    { name: 'Demo', slug: 'demo', isActive: true },
  );

  const { entity: superAdmin } = await findOrCreate(
    roles,
    { name: 'SUPER_ADMIN' },
    { name: 'SUPER_ADMIN', description: 'Acceso total', tenantId: null },
  );
  superAdmin.permissions = permEntities;
  superAdmin.isProtected = true;
  await roles.save(superAdmin);

  const { entity: tenantAdmin } = await findOrCreate(
    roles,
    { name: 'TENANT_ADMIN' },
    {
      name: 'TENANT_ADMIN',
      description: 'Administra su tenant',
      tenantId: demo.id,
      tenant: demo,
    },
  );
  tenantAdmin.permissions = pick(
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'roles:read',
    'projects:create',
    'projects:read',
    'projects:update',
    'projects:delete',
  );
  tenantAdmin.isProtected = true;
  await roles.save(tenantAdmin);

  const { entity: viewer } = await findOrCreate(
    roles,
    { name: 'VIEWER' },
    {
      name: 'VIEWER',
      description: 'Solo lectura',
      tenantId: demo.id,
      tenant: demo,
    },
  );
  viewer.permissions = pick('users:read', 'roles:read', 'projects:read');
  viewer.isProtected = true;
  await roles.save(viewer);

  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const demos = [
    {
      email: 'admin@nexus.demo',
      firstName: 'Demo',
      lastName: 'Admin',
      tenantId: null,
      tenant: null,
      roles: [superAdmin],
    },
    {
      email: 'manager@nexus.demo',
      firstName: 'Demo',
      lastName: 'Manager',
      tenantId: demo.id,
      tenant: demo,
      roles: [tenantAdmin],
    },
    {
      email: 'viewer@nexus.demo',
      firstName: 'Demo',
      lastName: 'Viewer',
      tenantId: demo.id,
      tenant: demo,
      roles: [viewer],
    },
  ];
  for (const d of demos) {
    const existing = await users.findOne({ where: { email: d.email } });
    if (!existing) {
      await users.save(
        users.create({ ...d, password, isActive: true, isProtected: true }),
      );
      console.log(`USER_CREATED: ${d.email}`);
    } else {
      if (!existing.isProtected) {
        existing.isProtected = true;
        await users.save(existing);
      }
      console.log(`USER_EXISTS: ${d.email}`);
    }
  }

  for (const name of ['Portal demo', 'Intranet Acme']) {
    const existing = await projects.findOne({ where: { name, tenantId: demo.id } });
    if (!existing) {
      await projects.save(
        projects.create({ name, description: `Proyecto de ejemplo (${name})`, tenantId: demo.id }),
      );
      console.log(`PROJECT_CREATED: ${name}`);
    }
  }

  console.log('SEED_OK: tenant=demo password=' + DEMO_PASSWORD);
  await ds.destroy();
}

main().catch((e) => {
  console.error('SEED_FAIL:', e.message);
  process.exit(1);
});

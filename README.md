# Nexus RBAC · Backend

[![CI](https://github.com/danielbarreramunoz/nexus-rbac-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/danielbarreramunoz/nexus-rbac-backend/actions/workflows/ci.yml)

API REST multi-tenant con control de acceso basado en roles (RBAC), construida con **NestJS 12**, **TypeORM** y **PostgreSQL**. Emite JWT con el `tenantId`, los roles y los permisos del usuario; cada petición de datos se aísla por tenant a partir del token.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Framework | NestJS 12 (módulos, inyección de dependencias) |
| Lenguaje | TypeScript 6 (ESM, `type: module`) |
| Auth | `@nestjs/jwt` + `passport` / `passport-jwt` (estrategia `jwt.strategy.ts`) |
| ORM / DB | TypeORM 1.x + PostgreSQL (`pg`) |
| Validación | `class-validator` + `class-transformer` (`ValidationPipe` global con `whitelist` y `forbidNonWhitelisted`) |
| Config | `@nestjs/config` (variables de entorno globales) |
| Tests | Vitest 4 (unitarios `*.spec.ts`), Supertest + config e2e (`vitest.config.e2e.ts`) |
| Lint / formato | Oxlint, Prettier |

## Arquitectura

```
src/
├── main.ts                  # Bootstrap: CORS, ValidationPipe global, puerto
├── app.module.ts            # Agregado de módulos
├── auth/                    # Login, estrategia JWT, guards y decoradores
│   ├── auth.controller.ts   # POST /auth/login
│   ├── auth.service.ts      # Valida credenciales (bcrypt) y firma el JWT
│   ├── guards/              # jwt-auth, permissions, roles
│   └── decorators/          # @Permissions(), @Roles(), @CurrentUser(), @Public()
├── database/                # Configuración TypeORM (Postgres por variables de entorno)
├── entities/                # Tenant, User, Role, Permission, Project
├── tenants/ · users/ · roles/ · permissions/ · projects/
│                            # Módulo + controlador + servicio + DTOs por recurso
└── demo/                    # POST /demo/reset — restaura datos de demostración
scripts/seed.cjs             # Seed idempotente (compila y ejecuta contra dist/)
test/                        # Tests e2e
```

**Modelo de seguridad (importante):**

- El JWT contiene `sub`, `email`, `tenantId`, `roles[]` y `permissions[]` (`auth.service.ts:40-54`).
- Los servicios aíslan por tenant con `scope(tenantId)`: si `tenantId` es `null` (SUPER_ADMIN) no hay filtro; si no, todo se restringe a su tenant (`users.service.ts:24-26`).
- Los controladores exigen permisos con `@Permissions('users:read', …)` y roles con `@Roles('SUPER_ADMIN')` (ej. crear tenants).
- Las cuentas demo protegidas (`isProtected`) no se pueden editar ni eliminar; se restauran con `/demo/reset`.

## Requisitos

- Node.js LTS 20+ y npm
- PostgreSQL 14+ accesible (local o remoto)

## Instalación

```bash
cd nexus-rbac-backend
npm install

# 1. Copiar variables de entorno
cp .env.example .env   # en Windows: copy .env.example .env

# 2. Editar .env con tus valores (ver tabla siguiente)

# 3. Levantar en desarrollo (watch)
npm run start:dev
# La API queda en http://localhost:3003
```

### Variables de entorno (`.env`)

| Variable | Ejemplo | Descripción |
|---|---|---|
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASS` / `DB_NAME` | `localhost` / `5432` / `postgres` / `postgres` / `nexus_rbac` | Conexión a PostgreSQL |
| `DB_SYNC` | `false` | `true` crea el esquema automáticamente (solo desarrollo) |
| `DB_LOGGING` | `false` | Log de queries TypeORM |
| `JWT_SECRET` | `cambiar-este-secreto` | Secreto de firma del JWT |
| `JWT_EXPIRES_IN` | `3600s` | Expiración del token |
| `PORT` | `3003` | Puerto de la API |
| `CORS_ORIGINS` | `http://localhost:3002` | Orígenes permitidos (coma-separados) |

## Datos demo

Opción A — endpoint (con la API corriendo):

```bash
curl -X POST http://localhost:3003/demo/reset
```

Opción B — script (compila y siembra contra `dist/`):

```bash
npm run seed
```

Crea el tenant `demo`, 14 permisos, roles `SUPER_ADMIN` / `TENANT_ADMIN` / `VIEWER` y 3 usuarios (password `Demo1234`):

| Email | Rol | Tenant |
|---|---|---|
| `admin@nexus.demo` | SUPER_ADMIN | global (`null`, ve todo) |
| `manager@nexus.demo` | TENANT_ADMIN | demo |
| `viewer@nexus.demo` | VIEWER (solo lectura) | demo |

## Endpoints principales

| Método | Ruta | Permiso requerido |
|---|---|---|
| POST | `/auth/login` | público |
| POST | `/demo/reset` | público |
| GET | `/tenants`, `GET /tenants/:id` | público (lectura) |
| POST / PATCH | `/tenants` | `SUPER_ADMIN` + `tenants:create` / `tenants:update` |
| GET / POST | `/users` | `users:read` / `users:create` |
| GET / PATCH / DELETE | `/users/:id` | `users:read` / `users:update` / `users:delete` |
| GET / POST | `/roles` | `roles:read` / `roles:create` |
| PATCH / DELETE | `/roles/:id` | `roles:update` / `roles:delete` |
| GET | `/permissions` | autenticado |
| GET / POST / PATCH / DELETE | `/projects`, `/projects/:id` | `projects:read/create/update/delete` |

Todos (salvo login/demo/lectura de tenants) requieren `Authorization: Bearer <JWT>`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Desarrollo con watch |
| `npm run start` / `start:prod` | Arranque normal / producción (`node dist/main`) |
| `npm run build` | Compila a `dist/` |
| `npm run seed` | Build + seed demo (`scripts/seed.cjs`) |
| `npm run test` | Unitarios (Vitest) |
| `npm run test:e2e` | End-to-end (Supertest) |
| `npm run test:cov` | Cobertura |
| `npm run lint` / `npm run format` | Oxlint / Prettier |

## Integración continua

Workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (GitHub Actions, `ubuntu-latest`, Node 20). Se ejecuta en cada `push` y `pull_request`:

| Paso | Comando | Descripción |
|---|---|---|
| Install | `npm ci` | Instalación reproducible desde `package-lock.json` |
| Lint | `npm run lint` | Oxlint sobre `src/` y `test/` |
| Unit tests | `npm test` | Vitest (`*.spec.ts`, 11 tests) |
| E2E tests | `npm run test:e2e` | Supertest con `AuthService` mockeado (no requiere base de datos) |
| Build | `npm run build` | Compilación Nest a `dist/` |

## Producción (resumen)

```bash
npm install --omit=dev
npm run build
DB_SYNC=false npm run start:prod
```

Usa un `JWT_SECRET` robusto, `DB_SYNC=false` con migraciones propias y restringe `CORS_ORIGINS` al dominio del frontend.

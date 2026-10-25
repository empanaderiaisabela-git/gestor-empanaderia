# Plan: T-2 — Infraestructura de tests

- **Ítem del backlog**: T-2
- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-24 · **Estado**: Aprobado (plan del sprint)
- **Rama**: `feat/t-2-infraestructura-de-tests`

## Objetivo

Poder correr tests unit (y fuzz) sin base, y tests de integración contra un Postgres descartable (`db-test`) que
nunca sea la base de desarrollo ni la de producción. Habilita TDD para el resto del Sprint 0.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Qué se instala? | Vitest + `@vitest/coverage-v8` + `vite` + `vite-tsconfig-paths` + `fast-check`. Testing Library y jsdom entran en T-5 | dev |
| ¿Se versiona `.env.test`? | Sí: sólo apunta a `db-test` y lleva un `JWT_SECRET` de test | dev |
| ¿Cómo se habilita `unaccent` en `db-test`? | Migración custom de drizzle-kit; el `globalSetup` sólo migra | dev |
| Roles, UI, concurrencia, fechas | No aplica: no cambia el comportamiento de la app | — |

**Hechos verificados**:
- Vitest 5.0.5 pide Node ≥ 22.12 y `@types/node` ≥ 22. Por eso `@types/node` pasa de `^20` a `^22`, igual que el
  Node que corre el proyecto (22.15).
- En Vitest 5, el `globalSetup` de la raíz corre con todos los proyectos, así que va dentro del proyecto
  `integration`.
- La cobertura por defecto sólo cuenta los archivos que importan los tests.

## Cambios

| Área | Archivos | Responsabilidad |
|---|---|---|
| Config | `vitest.config.mts` | Alias `@/` (`vite-tsconfig-paths`), `server-only` → módulo vacío, `allowOnly: false`, cobertura v8 90/90/90/85; proyectos `unit` e `integration` |
| Guarda | `src/test/test-database-url.ts` | `assertTestDatabaseUrl({ url, nodeEnv })`: sólo acepta `localhost`/`127.0.0.1`, puerto 5434 y base `stock_test`, y nunca con `NODE_ENV=production` |
| Setup | `src/test/integration.global-setup.ts` | Guarda → pool propio → `migrate()` → cierra el pool |
| Stub | `src/test/empty-module.ts` | Reemplazo de `server-only` en los tests |
| Migración | `src/lib/db/migrations/0005_enable-unaccent.sql` | `CREATE EXTENSION IF NOT EXISTS unaccent;` |
| Docker | `docker-compose.yml` | Servicio `db-test`: postgres:15, `127.0.0.1:5434`, `tmpfs`, perfil `test` |
| Entorno | `.env.test`, `.env.example`, `.gitignore` | Variables de test versionadas; ejemplo sin valores reales |
| Scripts | `package.json` | `typecheck`, `test`, `test:watch`, `test:coverage`, `test:int`, `test:e2e` |
| Docs | ADR 0001, `testing.md`, `architecture.md`, `AGENTS.md`, `workflow.md`, `initial_prompt.md` | Reflejar lo que ya existe |

## Errores

No aplica: la guarda lanza `Error` con un mensaje en español porque es infraestructura de test, no una Server
Action.

## Tests

| Tipo | Casos |
|---|---|
| Unit | Guarda: acepta la URL de `db-test`; rechaza la base de desarrollo, Supabase, otra base, otro host, otro puerto, una URL ausente o inválida y `NODE_ENV=production` |
| Fuzz | Ninguna cadena arbitraria pasa la guarda |
| Unit | `import 'server-only'` resuelve en los tests |
| Integración | `db-test` tiene aplicadas todas las migraciones del journal y la extensión `unaccent` |

## Riesgos y decisiones

- La migración de `unaccent` también corre en producción en el próximo `db:migrate`; es idempotente.
- ADR 0001: Vitest como runner de tests con Next.js.

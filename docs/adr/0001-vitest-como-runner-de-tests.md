# 0001 — Vitest como runner de tests con Next.js

- **Estado**: Aceptado (2026-10-24)

## Contexto

Hasta T-2 el repo sólo tenía la suite E2E de Playwright. El flujo de trabajo (`docs/workflow.md`) exige TDD con
tests unit, de contrato, fuzz e integración por ítem, y que la suite unit corra en menos de 30 s sin red ni base. Los
tests de integración tienen que correr contra un Postgres real, que nunca puede ser la base de desarrollo ni la de
producción. La guía oficial de Next.js propone Vitest o Jest para los tests unit.

## Decisión

- **Runner**: Vitest 5 (`vitest.config.mts`), con dos proyectos:
  - `unit` (node): `src/**/*.test.ts`, sin `*.int.test.ts`. No incluye `tests/`, que es de Playwright.
  - `integration` (node): `src/**/*.int.test.ts`, con los archivos en serie y su propio `globalSetup`. Si fuera el
    `globalSetup` de la raíz, correría también con `unit`.
- **Alias**: `@/` se resuelve con `resolve.tsconfigPaths` nativo de Vite 8, en lugar del plugin
  `vite-tsconfig-paths` que nombra la guía de Next: el propio Vite pide usar la opción nativa. `server-only` se
  reemplaza por un módulo vacío (`src/test/empty-module.ts`) para poder testear código de servidor fuera de Next.
- **Cobertura**: proveedor v8, con umbrales de 90 % en líneas, funciones y statements y de 85 % en branches. Vitest 5
  sólo cuenta los archivos que importan los tests, así que el código heredado sin tests no la arrastra.
- **Fuzz**: `fast-check`.
- **Base de tests**: servicio `db-test` de `docker-compose.yml` (postgres:15, `127.0.0.1:5434`, datos en `tmpfs`,
  perfil `test`, así que `docker compose up -d` no lo levanta). Se configura en `.env.test`, que se versiona porque
  sólo apunta a esa base descartable y lleva un `JWT_SECRET` de test sin valor real.
- **Guarda**: el `globalSetup` de integración aborta si `NODE_ENV=production` o si `LOCAL_DATABASE_URL` no es
  exactamente `localhost|127.0.0.1:5434/stock_test` (`src/test/test-database-url.ts`). Después aplica las
  migraciones con el migrador de Drizzle.
- **`unaccent`**: se habilita con una migración custom de drizzle-kit (`0005_enable-unaccent.sql`), sin `sql` en el
  código TypeScript.
- **Node**: Vitest 5 pide Node ≥ 22.12, y `@types/node` pasa de `^20` a `^22` para coincidir con el runtime.

## Alternativas descartadas

- **Jest** (`next/jest`): necesita transformar ESM y TypeScript con SWC o Babel, y es más lento en modo watch. Vitest
  usa el mismo pipeline de Vite y entiende TypeScript y ESM sin configuración extra.
- **Testcontainers**: levantar un contenedor por corrida desde los tests es más lento y suma una dependencia. Docker
  Compose ya se usa para la base de desarrollo.
- **Integración contra la base de desarrollo**: los tests borran y cargan datos, y destruirían el trabajo del dev.
- **`CREATE EXTENSION` dentro del `globalSetup`**: obliga a usar `sql` fuera de `schema.ts`, que `AGENTS.md`
  prohíbe. La migración, además, deja `unaccent` garantizada en toda base que migre.

## Consecuencias

- El CI y cualquier máquina de desarrollo necesitan Node ≥ 22.12.
- La migración `0005` también corre en producción en el próximo `db:migrate`. Es idempotente (`IF NOT EXISTS`).
- Los tests de componente necesitan jsdom y Testing Library: se suman con un proyecto `component` cuando aparezca el
  primero (T-5).
- **Bug de Vite 8**: al imprimir un error lanzado en el `globalSetup`, falla el mapeo del stack y se oculta el
  mensaje. El `globalSetup` relanza los errores con un stack plano para que el mensaje se vea. Si Vite lo corrige, se
  puede quitar.

# Plan maestro: Sprint 0 completo

- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-24 · **Estado**: Aprobado (2026-10-24)
- Cada ítem conserva su `docs/plans/<ID>-<slug>.md`, que sale de su sección de acá y suma lo que aparezca al
  arrancarlo (skill `start-task`, con un OK corto del dev).

## Contexto

El Sprint 0 tiene que dejar andando el flujo completo: backlog → plan → TDD → gates → integración. Hoy sólo existen el
E2E de Playwright y el lint con 1 error. Las exploraciones encontraron además problemas que no estaban en el
backlog:

- **Exposición de datos**:
  - el `password_hash` viaja al navegador;
  - hay lecturas de productos y proveedores que no piden sesión.
- **`next build` lee la base de producción.** `/home` se prerenderiza y `NODE_ENV=production` hace que se cargue
  `.env.prod`.
- **Los errores de Postgres se traducen mal**: un error de unicidad o de clave foránea se le muestra al usuario como
  "concurrencia".

Este plan ordena todo el sprint e incorpora esos hallazgos según lo que decidió el dev.

## Decisiones del dev (2026-10-24)

| Tema | Decisión |
|---|---|
| Herramientas de T-2 | Vitest + cobertura v8 + `vite-tsconfig-paths` + fast-check. Testing Library y jsdom entran en T-5 |
| `.env.test` | Versionado (sólo apunta a `db-test`) |
| `unaccent` | Migración custom de drizzle-kit |
| Base de datos | **Nuevo T-8**: la base de producción se elige sólo con `APP_ENV=production`, nunca por `NODE_ENV` |
| Hallazgos al Sprint 0 | **BUG-7** (`password_hash` al navegador), **BUG-8** (lecturas sin sesión), **BUG-9** (errores de base mal traducidos) |
| Hallazgos al Sprint 1 | **BUG-10** (`wipe-db`, el `db:generate` de `reset-full`, `seed-users` que pisa contraseñas), **BUG-11** (fotos sin límite de tamaño ni de tipo, subida antes de validar, sin auditoría), **BUG-12** (el vendedor puede llamar a `fetchDashboardStats`; pregunta abierta: ¿puede ver ingresos y ganancia?) |
| Fotos (BUG-1) | Admin **y** vendedor pueden subir, borrar y listar. Se le muestra el botón al vendedor |
| PRs | **No hay PR, como regla general.** Cada ítem va en su rama, con merge squash local a `develop` y el OK del dev, y después push. El cierre del sprint es un merge local de `develop` a `main` con el tag |
| Orden | **T-6 antes que T-5**: el E2E pasa a `db-test` antes del refactor de proveedores |

## Orden de ejecución

| # | Ítem | Depende de | Rama |
|---|---|---|---|
| 0 | **T-9** Flujo sin PR, y backlog al día | — | `docs/t-9-flujo-sin-pr` |
| 1 | T-2 Infraestructura de tests | T-1 | `feat/t-2-infraestructura-de-tests` |
| 2 | BUG-2 Test de `JWT_SECRET` | T-2 | `fix/bug-2-test-jwt-secret` |
| 3 | **T-8** Base elegida con `APP_ENV` | T-2 | `feat/t-8-base-explicita` |
| 4 | BUG-3 Guarda de los scripts destructivos | T-2, T-8 | `fix/bug-3-guarda-scripts` |
| 5 | T-3 Gates: ESLint, hooks y CI | T-2, T-8 | `feat/t-3-gates` |
| 6 | BUG-5 Consultas en paralelo en el dashboard | T-2 | `fix/bug-5-dashboard-secuencial` |
| 7 | BUG-6 Contraseña en los logs y lecturas de más | T-2 | `fix/bug-6-datos-sensibles` |
| 8 | **BUG-9** Errores de base mal traducidos | T-2 | `fix/bug-9-errores-de-base` |
| 9 | T-4 Bases de la arquitectura | T-3 | `feat/t-4-bases-arquitectura` |
| 10 | BUG-1 Sesión en las acciones de fotos | T-4 | `fix/bug-1-fotos-sesion` |
| 11 | **BUG-7** `password_hash` al navegador | T-4 | `fix/bug-7-password-hash` |
| 12 | **BUG-8** Lecturas sin sesión | T-4 | `fix/bug-8-lecturas-sin-sesion` |
| 13 | T-6 E2E sobre `db-test` | T-4, T-8 | `feat/t-6-e2e-db-test` |
| 14 | T-5 Proveedores como molde | T-6 | `feat/t-5-proveedores-molde` |
| 15 | T-7 Cierre del Sprint 0 | todos | `docs/t-7-cierre-sprint-0` |

Los bugs se hacen después de T-3 para que los gates ya controlen su código. Las dependencias del backlog sólo cambian
donde está en **negrita** en la sección de cada ítem.

**Ciclo de cada ítem.** `start-task` → plan del ítem con el OK del dev → `BACKLOG.md` en `En progreso` → rama → TDD →
`finish-task` con evidencia (salida de los comandos) → lista simple de lo que entra → con el OK del dev:
`git merge --squash` a `develop`, commit Conventional en español con `Refs: <ID>` y el trailer `Co-Authored-By`,
push y borrado de la rama → `En revisión` → el dev lo pasa a `Hecho`.

**Un commit por ítem, no por sprint.** El Sprint 0 son 16 ítems, así que van a ser 16 commits en `develop`, uno al
cerrar cada ítem. El sprint termina recién con T-7, con el merge de `develop` a `main` y el tag `sprint-0`.

---

## 0 · T-9 Flujo sin PR, y backlog al día (nuevo, S, ~25 min)

- **Docs sin PR**: `AGENTS.md` (DoD y Comandos), `docs/workflow.md` (diagrama, §4 y §7), `docs/git.md` (Flujo: squash
  local; release: merge local más tag), `docs/definition-of-done.md`, `docs/initial_prompt.md` (§8) y
  `.agents/skills/finish-task/SKILL.md`, con `npm run skills:sync` y `skills:check`. Antes, un `grep "PR"` en `docs/`,
  `.agents/` y `AGENTS.md` para no dejar ninguna mención afuera.
- **`BACKLOG.md`**:
  - **Convenciones**: la fila `PR` pasa a `Merge` (hash del squash en `develop`). `En revisión` = "integrado en
    `develop` y verificado; espera la revisión del dev".
  - **Ítems nuevos** con historia, CA y estimación: T-8, T-9, BUG-7, BUG-8 y BUG-9 en el Sprint 0; BUG-10, BUG-11 y
    BUG-12 en el Sprint 1.
  - **Dependencias**: T-3 → T-2, T-8; T-6 → T-4, T-8; T-5 → T-6; T-7 → T-5 y BUG-1 a BUG-9.
  - **Cambios en ítems existentes**: BUG-1 con la pregunta resuelta y un CA-3 nuevo (el vendedor ve el botón de
    fotos). T-3 CA-2 y CA-5 dicen "push" en vez de "PR", y el job de E2E pasa a T-6. T-5 CA-8 se integra con un merge
    squash local y el CI en verde.
  - **Totales**: el total del sprint pasa de 19 h 2 min a **≈ 22 h 32 min**.
- **Memoria** (`feedback`): sin PR, como regla general; rama por ítem y merge squash local con el OK del dev.
- Se guarda este plan en `docs/plans/sprint-0.md`.

## 1 · T-2 Infraestructura de tests (M, 2 h 10 min)

- **Paquetes**: `npm i -D vitest @vitest/coverage-v8 vite vite-tsconfig-paths fast-check`. Vitest 5.0.5 pide Node
  ≥ 22.12; el dev tiene 22.15.
- **`vitest.config.mts`**:
  - `tsconfigPaths()`, el alias `server-only` → `src/test/empty-module.ts` y `allowOnly: false`.
  - Cobertura v8 (`text`, `html`, `lcov`) con umbrales de 90 en líneas, funciones y statements, y de 85 en branches.
    En Vitest 5 sólo cuentan los archivos que importan los tests, así que el código heredado no la arrastra.
  - Proyecto **unit**: node, `src/**/*.test.ts` sin `*.int.test.ts`. Deja afuera `tests/` de Playwright.
  - Proyecto **integration**: node, `src/**/*.int.test.ts`, con su propio `globalSetup` (el de la raíz correría
    también con unit) y los archivos en serie.
- **`src/test/`**:
  - `test-database-url.ts`: `assertTestDatabaseUrl({ url, nodeEnv })`. Rechaza la producción y cualquier host,
    puerto o base que no sea `127.0.0.1|localhost:5434/stock_test`.
  - `integration.global-setup.ts`: guarda → pool propio → `migrate()` → cierra el pool. Si no puede conectar, dice
    "docker compose up -d db-test".
  - `empty-module.ts`.
- **Migración** `0005_enable-unaccent.sql`: `npm run db:generate -- --custom --name enable-unaccent`.
- **`docker-compose.yml`**: servicio `db-test` (postgres:15, `127.0.0.1:5434:5432`, `tmpfs`, base `stock_test`,
  `profiles: ["test"]`, sin `restart`).
- **Entorno**:
  - `.env.test` (versionado): `LOCAL_DATABASE_URL` de `db-test` y un `JWT_SECRET` de test.
  - `.env.example`: variables sin valores reales.
  - `.gitignore`: `!.env.example`, `!.env.test` y `.vitest/`.
- **Scripts**: `typecheck`, `test`, `test:watch`, `test:coverage`, `test:int` y `test:e2e`, tal cual `docs/testing.md`.
- **Tests**:
  - Unit de la guarda: `it.each` con valores frontera y un fuzz que verifica que sólo pasa la URL de `db-test`.
  - Unit `server-only.test.ts`: falla si falta el alias.
  - Integración `db-test.int.test.ts`, con el query builder: `drizzle.__drizzle_migrations` tiene tantas filas como
    el journal, y `pg_extension` incluye `unaccent`.
- **ADR 0001** "Vitest como runner de tests con Next.js".
- **Docs**: `testing.md`, `architecture.md`, `AGENTS.md` (Comandos), `workflow.md` §6 e `initial_prompt.md`.
- **BUG-2 CA-3** se cumple con `.env.example`.
- **Riesgo**: la migración también corre en producción en el próximo `db:migrate`. Es idempotente.

## 2 · BUG-2 CA-2 (S, 10 min)

- `src/lib/auth/jwt.test.ts`: `regression BUG-2`. Sin `JWT_SECRET` (`vi.stubEnv`), `signToken` y `verifyToken`
  fallan con "Falta la variable de entorno JWT_SECRET.". Con la variable, firma y verificación funcionan.
- El fix ya está aplicado (excepción a TDD aprobada), así que el test no se puede ver fallar antes. Queda anotado.

## 3 · T-8 Base elegida con `APP_ENV` (nuevo, S, ~55 min)

**Historia**: como dev quiero que la base de producción sólo se use cuando lo pido explícitamente, de forma que ni
`next build`, ni `next start`, ni un test o un script le peguen a Supabase por accidente.

- `src/lib/db/database-config.ts`, funciones puras:
  - `envFileFor(env)`: `.env.prod` sólo si `APP_ENV=production`.
  - `resolveDatabaseConfig(env) → { url, ssl, logQueries }`. En producción, `DATABASE_URL` obligatoria y SSL. Si no,
    `LOCAL_DATABASE_URL` obligatoria (sin el default silencioso al 5433) y sin SSL.
- `src/lib/db/index.ts` y `drizzle.config.ts` lo usan; desaparecen los `!`. `NODE_ENV` deja de elegir la base.
- **CA**:
  1. Tests unit en tabla: `NODE_ENV=production` sin `APP_ENV` usa la base local, `APP_ENV=production` usa la de
     producción, y una variable faltante da un error claro.
  2. `npm run build` en local prerenderiza `/home` contra la base de desarrollo, demostrado con el seed local.
  3. `.env.example`, `architecture.md` (Entornos), el aviso de `initial_prompt.md` §7 y los comandos de producción
     (`APP_ENV=production npm run db:migrate`).
  4. ADR 0002 "La base se elige con `APP_ENV`, no con `NODE_ENV`".
- **Riesgo**: quien despliegue la app (el hosting está a definir) tiene que definir `APP_ENV=production`. Va en el
  ADR y en el README de T-7.

## 4 · BUG-3 Guarda de los scripts destructivos (S, 35 min)

- `src/lib/db/scripts/assert-safe-to-wipe.ts`: recibe la config de T-8. Rechaza `APP_ENV=production` y cualquier
  host que no sea `localhost`/`127.0.0.1`.
- `regression BUG-3`: unit con `it.each`.
- `setup-initial-data.ts` (`db:seed`, `db:reset-data`) y `reset-full.ts` la llaman antes de borrar. `reset-full`
  protege también su paso de `wipe-db`; el resto de `wipe-db` queda para BUG-10.

## 5 · T-3 Gates: ESLint, hooks y CI (M, 3 h)

- **ESLint (CA-1)**, en `eslint.config.mjs` (≤ 100 líneas) más reglas locales en `eslint/`:
  - `max-lines` 100 físicas; `max-lines-per-function` 40; `max-params` 3.
  - `no-explicit-any`, `no-non-null-assertion`, `consistent-type-assertions: never` (permite `as const`). Las
    fronteras validadas van como excepción por archivo en la config, nunca con un comentario.
  - `explicit-module-boundary-types`.
  - `no-restricted-imports`: `sql` de `drizzle-orm` fuera de `schema.ts`; `pg` fuera de `src/lib/db/index.ts` y
    `src/test/`; y las capas según la tabla de `architecture.md`, por glob, sin dependencias nuevas.
  - Regla local `no-comments`: prohíbe todo comentario salvo los que empiezan con `Por qué:` (la excepción de
    `AGENTS.md`). Las directivas `eslint-disable` también son comentarios, así que en código nuevo no hay escape.
  - Un script `scripts/line-limit.mjs` controla el tope en `.css`, que ESLint no parsea.
  - `ignores` suma `.agents/**` y `.claude/**`.
- **CA-2**: `eslint-legacy.json` con los ~85 archivos que hoy violan alguna regla (63 pasan las 100 líneas, entre
  ellos `globals.css` y `playwright.config.ts`). En esos archivos sólo se apagan las reglas nuevas.
  `scripts/legacy-check.mjs <ref>` falla si la lista tiene entradas que no estaban en `<ref>`.
- **CA-3**: `loadPhotos` declarada antes del `useEffect` en `product-photos-manager.tsx:29-54`; `npm run lint` en verde.
- **CA-4**: `lefthook`, `@commitlint/cli` y `@commitlint/config-conventional`.
  - `pre-commit`: bloquea `.env*` salvo `.env.example` y `.env.test`; ESLint sobre los archivos staged; typecheck.
  - `commit-msg`: commitlint.
  - `pre-push`: `test:coverage` y `skills:check`.
- **CA-5**: `.github/workflows/ci.yml` en cada push a `develop` y `main`, con Node 22.
  - Jobs: `quality` (lint, `legacy-check` contra `github.event.before`, typecheck, `skills:check`), `unit`
    (cobertura, como artefacto), `integration` (servicio postgres:15 como `db-test`) y `build` (`db-test` migrada y
    `.env.test`; sin `APP_ENV`, así que no lee producción).
  - El E2E entra en T-6 y la mutación en T-5.
- **CA-6**: se demuestran tres rechazos: un mensaje de commit inválido, un `.env` staged y un archivo nuevo de 101
  líneas.
- **CA-7**: ADR 0003 "Reglas estrictas en código nuevo, con una lista legacy que sólo se achica".
- **Riesgo**: `typecheck` en un clon limpio puede necesitar `next typegen` (`next-env.d.ts` está ignorado). Se resuelve
  en el job.

## 6 · BUG-5 Consultas en paralelo en el dashboard (S, 30 min)

- Las tres consultas pasan de `stats.actions.ts` a `src/features/stats/repository/stats.repository.ts`
  (`getDashboardSnapshot({ start, end })`). Corren **secuenciales** en la misma transacción, `repeatable read` y
  `read only`: así la foto queda consistente de verdad.
- **CA-1**: `regression BUG-5` de integración, que espía `process.emitWarning` y verifica que no aparece el aviso de
  `pg`.
- **CA-2**: con un seed de prueba, los totales son los mismos antes y después.

## 7 · BUG-6 Contraseña en los logs y lecturas de más (S, 35 min)

- **CA-1**: `logging: { serverFunctions: false }` en `next.config.ts` (Next no tiene una opción para redactar). El
  logger de Drizzle pasa a imprimir el SQL sin parámetros. Evidencia: test unit de la config y el log de un login en
  `npm run dev`.
- **CA-2**: integración. `getSaleById` y `getDashboardSnapshot` usan `vendor: { columns: { id, username } }`, y
  `getUserById` y los chequeos de duplicado de `createUser` y `updateUser` excluyen `passwordHash`. El test recorre
  esas lecturas y verifica que ninguna trae el hash.

## 8 · BUG-9 Errores de base mal traducidos (nuevo, S, ~40 min)

**Actual**: Drizzle 0.45 envuelve el error de Postgres en `DrizzleQueryError` (el original queda en `.cause`), y
`handleDatabaseError` sólo mira `error.code`. Resultado: un 23505 o un 23503 se le muestra al usuario como
"concurrencia". **Esperado**: cada error real tiene su mensaje.

- **CA-1**: `regression BUG-9` de integración contra `db-test`. Un nombre de proveedor duplicado da
  `UNIQUE_VIOLATION`; un producto con un proveedor inexistente da `RELATION_NOT_FOUND`; borrar un proveedor
  referenciado da `FOREIGN_KEY_VIOLATION`, distinguido por el `detail` de Postgres.
- **CA-2**: `handleDatabaseError` lee `error.cause`.
- **CA-3**: se revisa el escenario C de `concurrencia.spec.ts`. Por el código, el texto de concurrencia sale del
  chequeo de `providerVersion`; se confirma en T-6, sobre `db-test`.

## 9 · T-4 Bases de la arquitectura (M, 2 h)

- **CA-1**:
  - `src/lib/errors/`: `codes.ts` (union `ErrorCode` y mensajes iguales a `MESSAGES`), `app-error.ts` y `index.ts`.
  - El actual `src/lib/errors.ts` pasa adentro del directorio, para que `@/lib/errors` siga resolviendo.
  - `verifyAuthOrAdmin` lanza `AppError('UNAUTHENTICATED' | 'FORBIDDEN')` con los mismos textos.
  - Test unit por código, con el mensaje exacto.
- **CA-2**: `ActionResult` en el caso de fallo pasa a `{ success: false; error: string; code?: ErrorCode }`. Es
  opcional para no romper a los ~40 retornos heredados. El código nuevo usa un helper `fail(code)` que siempre la
  completa.
- **CA-3**:
  - `withTransaction` y el tipo `DbTransaction` en `src/lib/db/transaction.ts`.
  - `formatDateTime` en `src/lib/format-date-time.ts`: `Intl` con `timeZone` de Buenos Aires, con tests de UTC a
    hora local.
  - **`import 'server-only'` en `index.ts`** rompe a `tsx` (scripts `db:*`) y a los Page Objects de Playwright: fuera
    de Next no hay alias. Se instala el paquete `server-only` y los scripts y Playwright corren con
    `--conditions=react-server` (resuelve al módulo vacío). Si no funciona, se separa la conexión en un módulo sin la
    marca. Se decide en el plan del ítem.
- **CA-4**:
  - `setupFiles` del proyecto unit con `vi.mock('next/headers')` sobre un cookie store en memoria (Vitest 5 no
    permite `vi.mock` dentro de funciones).
  - `asUser({ role })` firma el JWT y hace `vi.spyOn(userRepository, 'getUserById')`.
  - `truncateAll()` usa `db.delete` en orden de FKs, sin SQL plano.
  - Test de `asUser` contra `verifyAuthOrAdmin`.

## 10 · BUG-1 Sesión en las acciones de fotos (S, 35 min → **45 min**)

- **CA-1**: `regression BUG-1`, uno por acción. Sin sesión, `UNAUTHENTICATED`. Cloudinary se reemplaza con `vi.mock`
  de `@/lib/cloudinary`.
- **CA-2**: las tres acciones llaman a `verifyAuthOrAdmin(false)`, para admin y vendedor. Test con `asUser` vendedor
  contra `db-test`.
- **CA-3 (nuevo)**: el vendedor ve el botón de fotos (`product-columns.tsx:96`, `product-card.tsx:92`). Test de la
  función de columnas por rol.

## 11 · BUG-7 `password_hash` al navegador (nuevo, S, ~50 min)

**Actual**: `createUserAction` y `updateUserAction` devuelven la fila con `passwordHash`, con un cast `as UserDef`
sin parsear, y `verifyAuthOrAdmin` devuelve la fila entera. **Esperado**: ninguna respuesta al cliente ni ningún
`caller` lleva el hash.

- **CA-1**: `regression BUG-7`, contrato. Con `asUser` admin contra `db-test`, la `data` de crear y de editar no
  tiene `passwordHash`.
- **CA-2**: las actions parsean con `userRowSchema`, y los `.returning()` de `user.repository` listan las columnas.
- **CA-3**: `verifyAuthOrAdmin` devuelve un tipo sin `passwordHash`, con un test de tipos.

## 12 · BUG-8 Lecturas sin sesión (nuevo, S, ~30 min)

**Actual**: cualquiera puede llamar a `fetchProducts` (precios de compra y proveedor) y a `fetchSelectorData`
(teléfono y mail de los proveedores). **Esperado**: exigen una sesión válida.

- **CA-1**: `regression BUG-8`, contrato. Sin sesión, no devuelven datos.
- **CA-2**: las dos llaman a `verifyAuthOrAdmin(false)`.
- **Pregunta abierta para el cliente**: ¿el vendedor debe ver los precios de compra y el contacto de los proveedores?

## 13 · T-6 E2E sobre `db-test` (M, 1 h 25 min), **ahora antes de T-5**

- **CA-1**:
  - `playwright.config.ts` se reescribe en ≤ 100 líneas, sin comentarios, y sale de la lista legacy. Carga
    `.env.test`, así que los Page Objects le pegan a `db-test`.
  - `webServer`: `next build && next start -p 3100`, para no chocar con el `next dev` del dev ni con la caché de
    Turbopack. T-8 garantiza que `next start` no lee producción.
  - El setup `db.setup.ts` se reescribe: guarda de T-2, migraciones, `truncateAll` y un seed mínimo (usuarios
    `admin` y `vendedor` y los datos base que piden los specs).
  - `auth.setup.ts` pasa a una URL relativa.
- **CA-2**: `retries` en 0 local y 1 en CI; firefox y webkit sólo en el CI de `main`; sin `waitForTimeout` en los
  Page Objects que se toquen.
- **CA-3**: `tests/readme.md` sin `db:reset-data-hard`.
- **CA-4**: `npm run test:e2e` en verde, más un job `e2e` en el CI. Evidencia de que la base de desarrollo no
  cambió: conteos por tabla antes y después, con `docker compose exec db psql` (sólo lectura).

## 14 · T-5 Proveedores como molde (L, 5 h)

- **CA-1**: `tests/proveedores.spec.ts` en verde antes y después, sobre `db-test` gracias a T-6. Se conservan los
  textos de la UI y los mensajes exactos.
- **CA-2**: estructura de `src/features/provider/`:
  - `domain/` con schemas `strictObject`.
  - `repository/`: interfaz, Drizzle y fake en `testing/`.
  - `services/provider.service.ts`: reactivación, `DUPLICATE`, `HAS_RELATIONS` y `STALE_VERSION`.
  - `actions/`: un archivo por operación, todas con `ActionResult` y `code`.
  - Los `ilike` escapan `%` y `_`. `version` se calcula como `input.version + 1`, filtrando por `version`, sin
    `sql`. `updatedAt` es `new Date()`.
  - Se le saca `providerRepository` a `product.actions`.
  - El feature sale de `eslint-legacy.json`.
- **CA-3**: una suite de comportamiento que corre contra el fake y contra Drizzle.
- **CA-4**: un test de contrato por fila de la tabla de errores.
- **CA-5**: activar o desactivar y borrar exigen `version`; el panel la envía.
- **CA-6**: Stryker (`@stryker-mutator/core` y `vitest-runner` 10.1, que admiten Vitest ≥ 2).
  - Mutación sobre `provider/{domain,services}` y `src/lib/errors`, en modo incremental.
  - Se agregan `test:mutation` y `verify`, y un job de mutación en el CI. `reports/` va al `.gitignore`.
  - Umbrales: mutación ≥ 70 y cobertura ≥ 90/85.
- **CA-7**: `docs/features/provider/README.md` desde la plantilla.
- **CA-8**: recorre el ciclo completo con merge squash local y el CI en verde.
- Testing Library, jsdom y un proyecto `component` entran acá, con el primer test de componente.

## 15 · T-7 Cierre del Sprint 0 (S, 1 h)

- `README.md` en español con el setup real: puertos, `APP_ENV`, `.env*`, scripts y tests.
- `architecture.md` y `testing.md` sin "(a crear)" en lo que ya existe, y la "Matriz de pruebas · Sprint 0".
- `initial_prompt.md` al día.
- `npm run verify` en verde sobre `develop`. Con el OK del dev: merge local `--no-ff` de `develop` a `main`
  ("chore(release): sprint 0"), tag `sprint-0` y push.

## Verificación de todo el sprint

- **Por ítem**: la salida de `npm run test`, `test:int`, `typecheck` y `lint` (y `test:e2e` y `test:mutation` cuando
  existan), pegada en el cierre.
- **Al final**:
  - `npm run verify` en verde y el CI en verde sobre `develop` y `main`.
  - `git log --oneline develop`: un commit por ítem.
  - La base de desarrollo, igual antes y después del E2E.
  - `grep` sin `PR` en el flujo documentado.

## Riesgos generales

- **El repo es público.** Antes de cada push, revisar que no entre ningún `.env` real. El hook de T-3 lo bloquea de
  ahí en adelante.
- **Nunca se corre nada con `APP_ENV=production`**, ni se lee `.env.prod`.
- **Las estimaciones suponen que el dev revisa cada ítem en el día.** El cuello de botella son T-3 (la lista legacy)
  y T-5 (la lectura de código).

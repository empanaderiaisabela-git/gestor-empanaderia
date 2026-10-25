# Estrategia de tests

Todo cambio de comportamiento viene con tests. Se escriben **antes** del código (TDD, skill
`test-driven-development`): test que falla → código mínimo → refactor.

> **Estado actual.** Desde T-2 y T-5 existen Vitest 5 (proyectos `unit`, `component` con jsdom e `integration`), fast-check, la base
> `db-test` y los scripts `typecheck`, `test`, `test:watch`, `test:coverage`, `test:int` y `test:e2e`
> ([ADR 0001](adr/0001-vitest-como-runner-de-tests.md)). Testing Library, Stryker (`stryker.config.mjs`),
> `test:mutation` y `verify` existen desde T-5.

## Tipos de test

| Tipo | Dónde | Archivo | Qué verifica |
|---|---|---|---|
| Unit: dominio | `src/features/<f>/domain/` | `*.test.ts` | Schemas Zod: entradas válidas e inválidas, con el **mensaje exacto** en español. |
| Unit: service | `src/features/<f>/services/` | `*.test.ts` | Reglas de negocio con el repositorio **fake en memoria**: permisos por rol, stock, `version`, reactivación, errores del catálogo. |
| Tipos | junto al schema | `*.test-d.ts` | Con `expectTypeOf`, que los tipos inferidos sean los esperados (por ejemplo, `version: number` y `passwordHash` ausente del row público). |
| Contrato (caja negra) | `src/features/<f>/actions/` | `*.contract.test.ts` | La Server Action vista desde afuera: entrada → `ActionResult`. Sesión simulada por rol, `data` validada contra su `*RowSchema` y un test por fila de la tabla de errores. |
| Fuzz | junto al schema o a la action | `*.fuzz.test.ts` | Con `fast-check`, que ninguna entrada arbitraria haga lanzar a la action ni devuelva un error fuera del catálogo. Es el equivalente de "nunca un 500". |
| Integración | `src/features/<f>/repository/` | `*.int.test.ts` | El repositorio Drizzle contra un Postgres real (`db-test`): `unique`, FK y `check`; filtro por `version`; transacciones; `unaccent`; descuento atómico de stock. |
| Componente | `src/features/<f>/ui/`, `src/components/` | `*.test.tsx` | Testing Library: estados de carga, vacío y error; validación del formulario; qué ve cada rol. |
| E2E | `tests/` (Page Objects en `tests/pages/`) | `*.spec.ts` | Playwright: flujos críticos en un navegador real, como login, CRUD, POS, catálogo público y concurrencia entre dos sesiones. |
| Mutación | `domain/`, `services/` y `lib/` puro | Stryker | Que los tests fallen cuando se altera la lógica. Umbral ≥ 70. |

Herramientas: Vitest para unit, tipos, contrato, fuzz, integración y componente; `@testing-library/react` con
`jsdom`; `fast-check`; `@stryker-mutator/core` con el runner de Vitest; Playwright.

### Cómo se arma un test de contrato

Una Server Action depende de `next/headers` (cookies) y de los repositorios. En el test de contrato:

- La sesión se simula con `asUser({ role, isActive?, username? })` (`src/test/as-user.ts`). El helper firma un JWT
  para ese rol, lo guarda en la cookie `session` y hace un `vi.spyOn` de `userRepository.getUserById` para que
  `verifyAuthOrAdmin` encuentre al usuario. `next/headers` está simulado para todos los tests por
  `src/test/setup/next-headers.setup.ts`, que además limpia cookies, spies y variables después de cada test. Los
  ids de los usuarios de test están en `TEST_USER_IDS`, por si un test de integración necesita insertarlos.
- En el proyecto unit, `src/test/setup/no-database.setup.ts` reemplaza `@/lib/db` por un objeto que falla al
  usarse: un test unit nunca toca la base.
- Los repositorios del feature, y el de usuarios que usa `verifyAuthOrAdmin`, se reemplazan por sus fakes en
  memoria con `vi.mock`.
- Se llama a la action exportada como lo haría el cliente y se verifica sólo lo observable: `success`, el código
  y el mensaje del error, y la forma de `data` contra el `*RowSchema`.

Para que el fake no mienta, **la misma suite de comportamiento del repositorio corre contra el fake (unit) y
contra Drizzle (integración)**. Si el fake se aparta del real, falla la suite del fake.

### Infraestructura: integración, no mutación

Repositorios, `lib/db`, `proxy.ts`, Cloudinary y los scripts de base son infraestructura: valen por cómo hablan
con algo externo. Se prueban con integración (contra `db-test`) o con E2E, y **quedan fuera de Stryker**:

- Un mutante en una query (`gte` → `gt`) sólo se mata con una base real, y correr mutación contra Postgres
  multiplica el tiempo por cientos.
- Que un repositorio esté cubierto no dice si su query es correcta. Un test de integración con valores frontera
  sí lo dice.

La mutación se concentra donde están las decisiones: `domain/`, `services/` y las utilidades puras de `lib/`.
Cloudinary nunca se llama desde unit ni contrato: se reemplaza por un fake en el borde (`lib/cloudinary.ts`).

### Qué **no** cubre cada capa (y por eso existen las otras)

| Capa | No detecta | Lo cubre |
|---|---|---|
| Unit (service con fake) | Que la query real haga lo que el fake simula; las restricciones de Postgres | Integración |
| Integración | Permisos, validación de entrada, forma del `ActionResult` | Contrato |
| Contrato | Que la pantalla muestre el error; estados de carga y vacío | Componente |
| Componente | Cookies reales, `proxy.ts`, navegación, dos sesiones a la vez | E2E |
| E2E | La combinatoria de entradas: es lento y cubre pocos casos | Unit + fuzz |
| Fuzz | Que el resultado sea el **correcto**: sólo prueba que no explote | Unit + contrato |
| Cobertura | Que los tests tengan asserts útiles | Mutación |

## Criterios de aceptación → tests

Cada criterio de aceptación de la US se traduce en al menos un test con su texto en la descripción. Cada fila
de la tabla de errores del feature (`docs/features/<f>/README.md`) tiene su test.

Convención de nombres para poder rastrearlos con una búsqueda:

| Origen | Nombre del test |
|---|---|
| Criterio de aceptación | `it('US-3 CA-2: rechaza la venta si no hay stock suficiente')` |
| Fila de la tabla de errores | `it('STALE_VERSION: avisa que los datos cambiaron al editar con una versión vieja')` |
| Bug corregido | `it('regression BUG-4: no duplica el cliente al reactivarlo por DNI')`. Tiene que fallar antes del fix. |

## Reutilización (equivalentes a JUnit)

| JUnit  | Uso en este repo |
|---|---|
| `@Test` | `it('…')` en Vitest, `test('…')` en Playwright |
| `@DisplayName` | El texto del `it`, en español y en presente: "rechaza un DNI duplicado" |
| `@Nested` | `describe` anidado por escenario |
| `@BeforeEach` / `@AfterEach` | `beforeEach` / `afterEach`: fake nuevo en unit, tablas vacías en integración |
| `@BeforeAll` / `@AfterAll` | `beforeAll` / `afterAll`; lo global (migraciones de `db-test`) va en `globalSetup` |
| `@ParameterizedTest` + `@CsvSource` | `it.each([...])`: la herramienta para la tabla de errores y los valores frontera |
| `assertThrows` | `await expect(promesa).rejects.toThrow(...)`. Una action no lanza: se compara su `ActionResult` |
| `assertAll` | `expect.soft` en Playwright |
| Mockito `@Mock` | **Fakes en memoria** primero; `vi.fn()` para callbacks; `vi.mock()` sólo en los bordes (`next/headers`, Cloudinary) |
| `@InjectMocks` | Fábrica con dependencias por parámetro: `createSaleService({ saleRepository, productRepository })` |
| Test Data Builder / Object Mother | `src/features/<f>/testing/builders.ts`: `aCustomer({ name: 'Ana' })`, con valores por defecto válidos |
| Extensions / `@RegisterExtension` | Fixtures de Playwright (`test.extend`) y helpers en `src/test/` |
| Testcontainers | Servicio `db-test` de Docker Compose |
| `@Tag("integration")` | Sufijo del archivo (`*.int.test.ts`) y proyecto aparte en la config de Vitest |
| `@Timeout` | `it('…', { timeout })` / `test.setTimeout()` |
| `@Disabled` | `it.skip`: no se mergea sin un ítem `BUG-N` que lo justifique |

Reglas:

- Un comportamiento por test. Si el nombre necesita una "y", son dos tests.
- Cada test arma sus datos y no depende del orden ni de otro test. En E2E se usan datos efímeros con sufijo
  único, como `inyectarClienteEfimero()`.
- Fakes antes que mocks. No se verifica "que se llamó a X" cuando se puede verificar el resultado.
- Nada de código sólo para tests en producción: builders, fakes y helpers viven en `testing/` o `src/test/`.
- En E2E: selectores por rol y texto visible; `data-testid` (de `src/constants/test-ids.ts`) sólo cuando no
  hay otro; Page Objects en `tests/pages/`; nunca `waitForTimeout`.
- Prohibido `.only`: Playwright usa `forbidOnly` en CI y Vitest `allowOnly: false`.
- El tope de 100 líneas también vale para los tests: un archivo por action o por escenario.

## Cuándo se corre cada cosa

| Momento | Comando | Incluye |
|---|---|---|
| Mientras programás | `npm run test:watch` | Vitest en modo watch: unit, tipos, contrato y fuzz con pocas corridas |
| `git commit` (hook) | `npm run lint && npm run typecheck` | ESLint (con el tope de líneas), `tsc --noEmit` y bloqueo de `.env` |
| `git push` (hook) | `npm run test:coverage` | Unit, tipos, contrato, fuzz y componente, con umbrales de cobertura |
| Si tocaste un repositorio o el schema | `npm run test:int` | Integración contra `db-test` |
| Si tocaste un flujo cubierto por E2E | `npm run test:e2e` | Playwright en Chromium |
| Antes de integrar a `develop` | `npm run verify` | Lint, tipos, cobertura, integración, mutación y `next build` |
| Push a `develop` o `main` | GitHub Actions | Lo mismo que `verify` más E2E, en jobs paralelos |

Scripts de `package.json`:

```jsonc
"typecheck": "tsc --noEmit",
"test": "vitest run --project unit --project component",
"test:watch": "vitest --project unit --project component",
"test:coverage": "vitest run --project unit --project component --coverage",
"test:int": "dotenv -e .env.test -- vitest run --project integration",
"test:e2e": "dotenv -e .env.test -v NODE_OPTIONS=--conditions=react-server -- playwright test --project=chromium",
"test:mutation": "stryker run",
"verify": "npm run lint && npm run typecheck && npm run test:coverage && npm run test:int && npm run test:mutation && dotenv -v NEXT_DIST_DIR=.next-e2e -- next build"
```

## Velocidad de la suite

| Suite | Objetivo | Cómo |
|---|---|---|
| Unit, tipos, contrato y fuzz | < 30 s | Sin red ni base: fakes en memoria. Fuzz con 100 corridas por propiedad. |
| Integración | < 2 min | `db-test` en `tmpfs`, migraciones una sola vez en `globalSetup`, `TRUNCATE` entre tests, archivos en serie. |
| E2E | < 5 min en Chromium | Datos efímeros en vez de resetear la base, login una sola vez (`storageState`). Los tres navegadores sólo en el CI de `main`. |
| Mutación | < 10 min | Sólo `domain/`, `services/` y `lib/` puro, con el modo incremental de Stryker. |

Reintentos (desde T-6): 0 en local y 1 en el CI. Un test que pasa al segundo intento es un test inestable y se
investiga. Ningún test espera con `sleep`: espera una condición. Los Page Objects heredados todavía tienen algunos
`waitForTimeout` cortos al tipear; se sacan cuando un ítem los toque.

## Bases de datos

- Desarrollo: servicio `db`.
- Tests: servicio `db-test`. Nunca se testea contra la base de desarrollo, y **jamás** contra producción.

Cómo está armado (desde T-6):

| Uso | Detalle |
|---|---|
| `db-test` | postgres:15 en `127.0.0.1:5434`, base `stock_test`, con `tmpfs` (los datos no sobreviven al contenedor y es más rápido) y perfil `test` (`docker compose up -d` no lo levanta). Se configura en `.env.test`, que está versionado. Se levanta con `docker compose up -d --wait db-test`. |
| Integración | `src/test/integration.global-setup.ts` aborta si `NODE_ENV=production`, si `APP_ENV=production` o si `LOCAL_DATABASE_URL` no es la de `db-test`, y aplica las migraciones (incluida `0005_enable-unaccent`). Cada test arranca con las tablas vacías (`truncateAll()`, T-4). |
| E2E | `npm run test:e2e` carga `.env.test`, y `playwright.config.ts` aborta si la URL no es la de `db-test`. El `webServer` (`npm run e2e:server`) vuelve a verificarla, aplica las migraciones, carga el seed (`db:seed`: `admin`, `vendedor` y datos de demo) y levanta la app con `next build` + `next start` en el puerto 3100, con la carpeta `.next-e2e`. El proyecto `setup` inicia sesión y abre cada pantalla del panel (prueba de humo). Detalle en [`tests/readme.md`](../tests/readme.md). |
| Scripts destructivos | `db:seed`, `db:reset-data`, `db:reset-full` y `wipe-db` se niegan a correr si la URL no es local o si `APP_ENV=production` (BUG-3 y BUG-10). `db:seed-users` sólo crea los usuarios que faltan. |

## Reportes

| Reporte | Dónde | Umbral o uso |
|---|---|---|
| Cobertura (Vitest, proveedor v8) | `coverage/index.html` y `coverage/lcov.info` | Líneas, funciones y statements ≥ 90 %; branches ≥ 85 %. Si no se cumplen, falla el push. |
| Mutación (Stryker) | `reports/mutation/mutation.html` | Score ≥ 70. Cada mutante sobreviviente es un assert que falta. |
| E2E (Playwright) | `playwright-report/` (`npx playwright show-report`) | Trazas en el primer reintento (`trace: 'on-first-retry'`). |
| CI | Artefactos del job de GitHub Actions | Los tres reportes quedan adjuntos a cada corrida. |

Fuera de la cobertura: migraciones, `src/lib/db/scripts/`, `src/scripts/`, archivos de configuración y lo que
sólo se prueba por E2E (`proxy.ts`, layouts). `reports/` se agrega al `.gitignore` al instalar Stryker.

Cómo se mide hoy (`vitest.config.mts`):

- Sólo cuentan los archivos que importan los tests unit (comportamiento de Vitest 5).
- Se excluyen `eslint/`, `scripts/` y `src/config/` (textos y columnas de tablas); los repositorios y
  `src/lib/db/schema.ts`, que se prueban con integración; y los helpers de test (`src/test/`, `testing/`).
- Se excluyen los archivos de `eslint-legacy.json`: el umbral es un gate para el código nuevo, igual que las reglas
  duras (ADR 0003). Cuando un archivo sale de la lista, entra solo a la medición.

## Matriz de pruebas del incremento: Sprint N

Plantilla. Al cerrar cada sprint se copia esta sección con su número y se completa con una fila por cada
criterio de aceptación y por cada fila de la tabla de errores de los ítems del sprint.

| Ítem | Criterio o error | Tipo de test | Archivo | Estado |
|---|---|---|---|---|
| US-N | CA-1: … | Contrato | `src/features/…/….contract.test.ts` | ✅ / ❌ |

### Defectos encontrados en la pasada de QA

| ID | Descripción | Test de regresión | Estado |
|---|---|---|---|
| BUG-N | … | `regression BUG-N: …` en `…` | Corregido / Abierto |

## Matriz de pruebas · Sprint 0

| Qué | Unit / contrato / fuzz | Componente | Integración (`db-test`) | E2E | Mutación |
|---|---|---|---|---|---|
| Guarda de `db-test` y de scripts destructivos (T-2, BUG-3) | Sí | — | Sí | — | — |
| Elección de base con `APP_ENV` (T-8) | Sí | — | — | — | — |
| `JWT_SECRET` (BUG-2) | Sí | — | — | — | — |
| Reglas de ESLint (T-3) | Sí | — | — | — | — |
| Dashboard secuencial (BUG-5) | Sí | — | Sí | Sí | — |
| Datos sensibles: logs, lecturas, `password_hash` (BUG-6, BUG-7) | Sí | — | Sí | — | — |
| Errores de base traducidos (BUG-9) | Sí | — | Sí | Sí | — |
| Catálogo de errores, `asUser`, `formatDateTime` (T-4) | Sí | — | — | — | Sí (`src/lib/errors`) |
| Sesión en fotos y lecturas (BUG-1, BUG-8) | Sí | — | — | Sí | — |
| Proveedores, feature molde (T-5) | Sí | Sí | Sí | Sí | Sí |

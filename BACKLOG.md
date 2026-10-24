# Backlog

> Estado vigente de todo el trabajo del proyecto. **Si no está acá, no se programa.**
>
> Cómo se usa: [`docs/workflow.md`](docs/workflow.md).

## Índice

- [Convenciones](#convenciones)
- [Sprint 0 · Base técnica](#sprint-0--base-técnica)
- [Sprint 1 · Primeras historias del cliente](#sprint-1--primeras-historias-del-cliente)

## Convenciones

### Tipos de ítem

| ID      | Qué es                                                                                   | Ejemplo                          |
| ------- | ---------------------------------------------------------------------------------------- | -------------------------------- |
| `US-N`  | **Historia de usuario**: algo que el cliente o el personal ven y usan                    | Vender por docena                |
| `T-N`   | **Habilitador técnico**: no aporta nada visible, pero hace falta para construir lo demás | Instalar Vitest                  |
| `BUG-N` | **Defecto**: algo que funciona mal                                                       | Una acción sin control de sesión |

### Estados

| Estado        | Significa                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| `Pendiente`   | Cargado, todavía no empezó                                                                                |
| `En progreso` | Alguien lo tomó: tiene dueño y fecha de inicio                                                            |
| `En revisión` | Terminado y verificado; espera que el dev lo revise y lo apruebe. Si el ítem tiene PR, el PR está abierto |
| `Hecho`       | El dev lo aprobó y los cambios ya están en `develop` (o en `main`, en el caso del arranque)               |

### Cuándo se puede tomar un ítem

Cuando cumple la Definition of Ready ([`docs/definition-of-done.md`](docs/definition-of-done.md)):

- Tiene historia y criterios de aceptación medibles, cada uno con su estimación.
- Sus dependencias están en `Hecho`.
- Tiene un plan aprobado en `docs/plans/<ID>-<slug>.md`.

### Cómo se registran los criterios de aceptación (CA)

- Cada CA ocupa **una sola línea**, separada de la siguiente por una línea en blanco.
- `[ ]` = pendiente; `[x]` = cumplido y verificado.
- **Completado**: fecha y hora de cierre en hora de Argentina (`AAAA-MM-DD HH:MM`). Mientras está pendiente dice
  `—`.
- **Horas reales**: el total del ítem, que el dev carga al cerrarlo.

### Cómo se estima

- La implementación la hace el agente y lleva minutos. **El cuello de botella es el dev**: leer el plan,
  inspeccionar el código, verificar, correr los tests y aprobar.
- La **estimación** de un CA es el tiempo total hasta cerrarlo:
  - la implementación del agente;
  - las esperas de comandos (instalar dependencias, CI, Stryker);
  - la revisión del dev.
- La lectura del plan del ítem se suma al primer CA.
- Formato: `20 min`, `1 h`, `1 h 30 min`.

### Plantilla de ítem

```markdown
### <ID> · <título>

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | S / M / L |
| Depende de   | —         |
| Plan         | —         |
| PR           | —         |
| Horas reales | —         |

**Historia**: Como <rol> quiero <qué>, de forma que <para qué>.
(En un BUG, en lugar de la historia: **Actual** y **Esperado**.)

**Criterios de aceptación**

- [ ] **CA-1** · <criterio medible> · Estimación: 20 min · Completado: —

- [ ] **CA-2** · <criterio medible> · Estimación: 10 min · Completado: —

**Preguntas abiertas**

- <dudas que el dev no puede responder sin el cliente>
```

------------------------------------------------------------------------------------------------------------------------

## Sprint 0 · Base técnica

------------------------------------------------------------------------------------------------------------------------

**Objetivo**: que el flujo completo (requerimiento → backlog → plan → TDD → tests → PR) se pueda ejecutar de punta
a punta.

**Regla del sprint**: no se implementa ninguna US hasta que el Sprint 0 esté `Hecho`. Las US sí se pueden ir
cargando en el Sprint 1 en paralelo.

### Resumen del Sprint 0

| ID                                                                             | Título                                       | Estado      | Depende de         | Estimación     |
| ------------------------------------------------------------------------------ | -------------------------------------------- | ----------- | ------------------ | -------------- |
| [T-1](#t-1--backlog-specs-y-base-inicial-del-repo)                             | Backlog, specs y base inicial del repo       | Hecho       | —                  | 1 h 5 min      |
| [T-2](#t-2--infraestructura-de-tests)                                          | Infraestructura de tests                     | Pendiente   | T-1                | 2 h 10 min     |
| [T-3](#t-3--gates-eslint-con-reglas-duras-hooks-y-ci)                          | Gates: ESLint con reglas duras, hooks y CI   | Pendiente   | T-2                | 3 h            |
| [T-4](#t-4--bases-de-la-arquitectura-objetivo)                                 | Bases de la arquitectura objetivo            | Pendiente   | T-3                | 2 h            |
| [T-5](#t-5--proveedores-como-feature-molde)                                    | Proveedores como feature molde               | Pendiente   | T-4                | 5 h            |
| [BUG-1](#bug-1--acciones-de-fotos-de-producto-sin-control-de-sesión)           | Acciones de fotos sin control de sesión      | Pendiente   | T-4                | 35 min         |
| [BUG-2](#bug-2--jwt_secret-con-valor-por-defecto-en-el-código)                 | `JWT_SECRET` con valor por defecto           | En progreso | T-2                | 25 min         |
| [BUG-3](#bug-3--scripts-de-base-que-borran-todo-sin-protección)                | Scripts que borran todo sin protección       | Pendiente   | T-2                | 35 min         |
| [BUG-4](#bug-4--npm-run-dev-se-cuelga-en-compiling-home)                       | `npm run dev` se cuelga en "Compiling /home" | Hecho       | —                  | 42 min         |
| [BUG-5](#bug-5--consultas-en-paralelo-sobre-la-misma-conexión-en-el-dashboard) | Consultas en paralelo en el dashboard        | Pendiente   | T-2                | 30 min         |
| [BUG-6](#bug-6--datos-sensibles-en-los-logs-de-desarrollo-y-lecturas-de-más)   | Datos sensibles en logs y lecturas de más    | Pendiente   | T-2                | 35 min         |
| [T-6](#t-6--e2e-sobre-db-test)                                                 | E2E sobre `db-test`                          | Pendiente   | T-5                | 1 h 25 min     |
| [T-7](#t-7--cierre-del-sprint-0)                                               | Cierre del Sprint 0                          | Pendiente   | T-6, BUG-1 a BUG-6 | 1 h            |
|                                                                                | **Total del sprint**                         |             |                    | **19 h 2 min** |

### T-1 · Backlog, specs y base inicial del repo

| Campo        | Valor                                                              |
| ------------ | ------------------------------------------------------------------ |
| Estado       | Hecho                                                              |
| Dueño        | Ignacio Tomas                                                      |
| Inicio       | 2026-10-23                                                         |
| Tamaño       | S                                                                  |
| Depende de   | —                                                                  |
| Plan         | [`docs/plans/T-1-base-inicial.md`](docs/plans/T-1-base-inicial.md) |
| PR           | — (arranque directo en `main`, porque todavía no existe `develop`) |
| Horas reales | — (lo carga el dev)                                                |

**Historia**: Como dev quiero un backlog, documentación coherente y el repo versionado con `main` y `develop`, de
forma que el flujo de `docs/workflow.md` se pueda seguir desde el primer ítem.

**Criterios de aceptación**

- [x] **CA-1** · `BACKLOG.md` existe con convenciones, Sprint 0 y Sprint 1 · Estimación: 15 min · Completado: 2026-10-23 21:50

- [x] **CA-2** · Ningún doc ni skill propia apunta a `docs/specs/`; todos usan `docs/requerimientos/specs.md` · Estimación: 5 min · Completado: 2026-10-23 21:49

- [x] **CA-3** · `coding-standards.md` y la skill `code-refactoring` respetan el tope estricto de 100 líneas · Estimación: 5 min · Completado: 2026-10-23 21:49

- [x] **CA-4** · `docs/workflow.md` describe la entrada de requerimientos (§0) · Estimación: 5 min · Completado: 2026-10-23 21:49

- [x] **CA-5** · Existe el índice de ADRs `docs/adr/README.md` · Estimación: 5 min · Completado: 2026-10-23 21:51

- [x] **CA-6** · `npm run skills:check` en verde · Estimación: 5 min · Completado: 2026-10-23 21:51

- [x] **CA-7** · Lo que se va a commitear no tiene secretos ni logs (sin el `JWT_SECRET` por defecto, `*.log` ignorados) · Estimación: 10 min · Completado: 2026-10-23 22:07

- [x] **CA-8** · `main` y `develop` existen en `origin` con el commit inicial, sin ningún `.env` · Estimación: 15 min · Completado: 2026-10-24 15:09

**Preguntas resueltas** (dev, 2026-10-23)

El repo de GitHub es **público**, así que:

- El `JWT_SECRET` por defecto se quita **antes** del primer commit, para que nunca se publique (ver BUG-2).
- `src/lib/contact/contact.config.ts` queda como está: por ahora sólo se despliega el gestor y el catálogo público
  queda en el código, sin publicar.
- `eslint-error.log` se borra y `*.log` pasa al `.gitignore`.
- El commit y el push esperan la revisión del dev.

**Avance de CA-8** (2026-10-24 15:08): el dev aprobó el commit inicial **sólo en su PC**. Se hizo `f6be135 chore:
base inicial del proyecto` en `main` y se creó `develop` localmente, que es la rama activa. Todavía no se subió nada
a GitHub, así que CA-8 sigue pendiente hasta el push de `main` y `develop`.

**CA-8 cumplido** (2026-10-24 15:09): a pedido del dev se subieron `main` y `develop` a GitHub. Las dos apuntan a
`f6be135` y `main` es la rama por defecto del repo.

**Cerrado por el dev** (2026-10-24 15:14): T-1 pasa a `Hecho`. Las horas reales quedan sin cargar.

### T-2 · Infraestructura de tests

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | M         |
| Depende de   | T-1       |
| Plan         | —         |
| PR           | —         |
| Horas reales | —         |

**Historia**: Como dev quiero poder correr tests unit, de contrato, fuzz e integración contra una base
descartable, de forma que cada ítem se pueda hacer con TDD.

**Criterios de aceptación**

- [ ] **CA-1** · Vitest configurado según la guía oficial de Next.js (proyectos `unit` e `integration`, alias `@/`, `server-only` reemplazado por un módulo vacío) · Estimación: 40 min · Completado: —

- [ ] **CA-2** · Servicio `db-test` en `docker-compose.yml` (postgres:15, puerto 5434, `tmpfs`) y `.env.test` · Estimación: 15 min · Completado: —

- [ ] **CA-3** · El `globalSetup` de integración aborta si la URL no es la de `db-test`, y aplica las migraciones y `unaccent` · Estimación: 30 min · Completado: —

- [ ] **CA-4** · `.env.example` (con `!.env.example` en `.gitignore`) y los scripts `typecheck`, `test`, `test:watch`, `test:coverage`, `test:int` y `test:e2e` · Estimación: 15 min · Completado: —

- [ ] **CA-5** · Un test unit y uno de integración de prueba pasan; `npm run typecheck` en verde · Estimación: 15 min · Completado: —

- [ ] **CA-6** · ADR "Vitest como runner de tests con Next.js" · Estimación: 15 min · Completado: —

### T-3 · Gates: ESLint con reglas duras, hooks y CI

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | M         |
| Depende de   | T-2       |
| Plan         | —         |
| PR           | —         |
| Horas reales | —         |

**Historia**: Como dev quiero que las reglas duras de `AGENTS.md` se hagan cumplir solas, de forma que el código
nuevo no pueda violarlas.

**Criterios de aceptación**

- [ ] **CA-1** · ESLint rechaza las violaciones de las reglas duras (ver detalle) · Estimación: 45 min · Completado: —

- [ ] **CA-2** · `eslint-legacy.json` lista los archivos heredados que hoy las violan; el CI rechaza un PR que agregue entradas · Estimación: 30 min · Completado: —

- [ ] **CA-3** · Corregido el error de `react-hooks/immutability` en `product-photos-manager.tsx`; `npm run lint` en verde · Estimación: 10 min · Completado: —

- [ ] **CA-4** · lefthook: `pre-commit` (bloquea `.env`, lint, typecheck), `commit-msg` (commitlint), `pre-push` (`test:coverage`, `skills:check`) · Estimación: 20 min · Completado: —

- [ ] **CA-5** · `.github/workflows/ci.yml` en cada PR y push a `develop`/`main` · Estimación: 45 min · Completado: —

- [ ] **CA-6** · Demostrado que se rechazan un mensaje de commit inválido, un `.env` staged y un archivo nuevo de 101 líneas · Estimación: 15 min · Completado: —

- [ ] **CA-7** · ADR "Reglas estrictas en código nuevo con lista legacy que sólo se achica" · Estimación: 15 min · Completado: —

**Detalle**

- **Reglas de CA-1**:
  - Archivos de más de 100 líneas físicas.
  - Funciones de más de 40 líneas o con más de 3 parámetros.
  - `any` y `!`.
  - `sql` de Drizzle fuera de `schema.ts`.
  - Importaciones prohibidas entre capas.
  - Comentarios.
- **Lista legacy (CA-2)**: en esos archivos se apagan *sólo* las reglas nuevas.
- **CI (CA-5)**: lint, typecheck, cobertura, integración, build, `skills:check`, chequeo de la lista legacy y E2E.
  La estimación incluye esperar las primeras corridas y corregir lo que falle.

### T-4 · Bases de la arquitectura objetivo

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | M         |
| Depende de   | T-3       |
| Plan         | —         |
| PR           | —         |
| Horas reales | —         |

**Historia**: Como dev quiero las piezas transversales de la arquitectura objetivo, de forma que cualquier feature
pueda migrarse o crearse siguiendo `docs/architecture.md`.

**Criterios de aceptación**

- [ ] **CA-1** · `AppError(code)` y su catálogo en `src/lib/errors/`, con los mismos textos que `src/config/messages.ts`; el código heredado muestra los mismos mensajes · Estimación: 45 min · Completado: —

- [ ] **CA-2** · El caso de error de `ActionResult` suma `code` y conserva `error` · Estimación: 15 min · Completado: —

- [ ] **CA-3** · `withTransaction` en `src/lib/db/`, `import 'server-only'` en `src/lib/db/index.ts` y `formatDateTime` en `America/Argentina/Buenos_Aires` · Estimación: 30 min · Completado: —

- [ ] **CA-4** · Helpers de test `asUser({ role })` y `truncateAll()`, con un test de `asUser` contra `verifyAuthOrAdmin` · Estimación: 30 min · Completado: —

### T-5 · Proveedores como feature molde

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | L         |
| Depende de   | T-4       |
| Plan         | —         |
| PR           | —         |
| Horas reales | —         |

**Historia**: Como dev quiero una feature completa en la arquitectura objetivo y con todos los tipos de test, de
forma que sirva de molde para las demás y demuestre el flujo de punta a punta.

**Criterios de aceptación**

- [ ] **CA-1** · `tests/proveedores.spec.ts` pasa antes y después: no cambia el comportamiento visible · Estimación: 20 min · Completado: —

- [ ] **CA-2** · `provider` tiene `domain`, `repository` (más fake), `services`, `actions` y `ui` según las reglas duras, y sale de `eslint-legacy.json` · Estimación: 2 h · Completado: —

- [ ] **CA-3** · Una suite de comportamiento del repositorio corre contra el fake y contra Drizzle · Estimación: 30 min · Completado: —

- [ ] **CA-4** · Un test de contrato por fila de la tabla de errores (`DUPLICATE`, `STALE_VERSION`, `HAS_RELATIONS`, permisos) · Estimación: 30 min · Completado: —

- [ ] **CA-5** · Activar/desactivar un proveedor filtra por `version`, con su test · Estimación: 15 min · Completado: —

- [ ] **CA-6** · Stryker configurado (`test:mutation`, `verify`); mutación ≥ 70 y cobertura ≥ 90/85 en `provider` · Estimación: 40 min · Completado: —

- [ ] **CA-7** · `docs/features/provider/README.md` desde la plantilla · Estimación: 15 min · Completado: —

- [ ] **CA-8** · Recorrió `start-task` → PR a `develop` con CI verde → `finish-task` · Estimación: 30 min · Completado: —

**Detalle**

- CA-2 es la revisión más pesada del sprint: unos 15 archivos nuevos o partidos. La estimación es casi toda lectura
  de código del dev.

### BUG-1 · Acciones de fotos de producto sin control de sesión

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | S         |
| Depende de   | T-4       |
| Plan         | —         |
| PR           | —         |
| Horas reales | —         |

**Actual**: `upload-product-photo.ts`, `delete-product-photo.ts` y `get-product-photos.ts` (en
`src/features/product/actions/`) no verifican sesión ni rol. Cualquiera puede invocarlas con un POST.

**Esperado**: sólo los roles autorizados las ejecutan; el resto recibe `UNAUTHENTICATED` o `FORBIDDEN`.

**Criterios de aceptación**

- [ ] **CA-1** · Un test `regression BUG-1` por acción, que falla antes del fix · Estimación: 20 min · Completado: —

- [ ] **CA-2** · Las tres acciones verifican sesión y rol · Estimación: 15 min · Completado: —

**Preguntas abiertas**

- ¿Qué roles pueden subir, borrar y listar fotos? Hoy un `vendedor` puede crear productos.

### BUG-2 · `JWT_SECRET` con valor por defecto en el código

| Campo        | Valor                            |
| ------------ | -------------------------------- |
| Estado       | En progreso                      |
| Dueño        | Ignacio Tomas                    |
| Inicio       | 2026-10-23                       |
| Tamaño       | S                                |
| Depende de   | T-2 (para el test)               |
| Plan         | — (fix adelantado dentro de T-1) |
| PR           | —                                |
| Horas reales | —                                |

**Actual** (antes del fix): `src/lib/auth/jwt.ts` usaba un secreto escrito en el código si faltaba la variable de
entorno.

**Esperado**: sin `JWT_SECRET` no se pueden firmar ni verificar sesiones, y `.env.example` documenta la variable.

**Criterios de aceptación**

- [x] **CA-1** · El secreto ya no está en el código y la variable es obligatoria · Estimación: 10 min · Completado: 2026-10-23 22:06

- [ ] **CA-2** · Test `regression BUG-2`: sin la variable, firmar y verificar falla con un error claro (requiere T-2) · Estimación: 10 min · Completado: —

- [ ] **CA-3** · `JWT_SECRET` documentada en `.env.example` (se crea en T-2) · Estimación: 5 min · Completado: —

**Notas**

- CA-1 se adelantó para que el secreto nunca llegara al repo público. Es una **excepción a TDD aprobada por el
  dev**: el test (CA-2) se escribe en cuanto exista Vitest.
- `getSecretKey()` lee la variable al usarla, para que `next build` no falle donde no esté definida.
- Verificado a mano con `tsx`: con la variable, firma y verificación funcionan; sin ella, falla con "Falta la
  variable de entorno JWT_SECRET.". `tsc` y ESLint en verde.
- Las credenciales de login no cambian: `admin`/`admin` y `vendedor`/`vendedor` viven en la base (seed), son
  temporales y se borran cuando estén las cuentas reales.

### BUG-3 · Scripts de base que borran todo sin protección

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | S         |
| Depende de   | T-2       |
| Plan         | —         |
| PR           | —         |
| Horas reales | —         |

**Actual**: `db:seed`, `db:reset-data` y `db:reset-full` borran todas las tablas, también con
`NODE_ENV=production` (Supabase).

**Esperado**: se niegan a correr si `NODE_ENV=production` o si la URL no es local o de test.

**Criterios de aceptación**

- [ ] **CA-1** · Función de guarda con su test `regression BUG-3` · Estimación: 25 min · Completado: —

- [ ] **CA-2** · Los tres scripts usan la guarda antes de borrar · Estimación: 10 min · Completado: —

### BUG-4 · `npm run dev` se cuelga en "Compiling /home"

| Campo        | Valor                                          |
| ------------ | ---------------------------------------------- |
| Estado       | Hecho                                          |
| Dueño        | Ignacio Tomas                                  |
| Inicio       | 2026-10-24                                     |
| Tamaño       | S                                              |
| Depende de   | —                                              |
| Plan         | — (aprobado en la sesión; causa y pasos abajo) |
| PR           | —                                              |
| Horas reales | —                                              |

**Actual**: `npm run dev` arranca, pero se queda en `○ Compiling /home ...` y localhost nunca responde. Hay un
`package-lock.json` vacío en `C:\Users\hermi\` y Next 16 toma el lockfile de más arriba como raíz del workspace,
así que Turbopack trabaja sobre toda la carpeta de usuario (`AppData`, `OneDrive`…). El log lo avisa: *"Next.js
inferred your workspace root, but it may not be correct"*.

**Esperado**: la raíz es siempre la carpeta del proyecto, `/home` compila y localhost responde. Además, la base
local y `.env.local` quedan listos para loguearse.

**Criterios de aceptación**

- [x] **CA-1** · `next.config.ts` fija `turbopack.root` en la carpeta del proyecto y desaparece el aviso de lockfiles · Estimación: 5 min · Completado: 2026-10-24 13:10

- [x] **CA-2** · Lockfile vacío de `C:\Users\hermi` borrado y caché `.next` limpia · Estimación: 2 min · Completado: 2026-10-24 13:09

- [x] **CA-3** · `npm run dev` compila `/home` y responde 200 · Estimación: 10 min · Completado: 2026-10-24 13:10

- [x] **CA-4** · Base local lista (compose, migraciones, `unaccent`, seed) y `.env.local` creado; el login `admin`/`admin` funciona · Estimación: 15 min · Completado: 2026-10-24 14:28

- [x] **CA-5** · El `npm run dev` del dev sirve `/login` (200) y permite loguearse; las verificaciones del agente no dejan la caché de Turbopack corrupta · Estimación: 10 min · Completado: 2026-10-24 14:28

**Reabierto (2026-10-24 14:1x)**: el servidor que levantó el dev respondía **404** en `/login`. El archivo de la ruta estaba intacto y `/home` funcionaba. La causa probable es la caché persistente de Turbopack (`.next/dev/cache/turbopack`, activada por defecto en Next 16): el agente detuvo sus servidores de verificación con `taskkill /F`, la caché quedó a medio escribir y el servidor del dev la reutilizó. CA-4 había quedado verificado sólo en el servidor del agente, así que vuelve a pendiente.

**Notas**

- **Choque de puertos con otro proyecto.** ArgenStockTestApp (`C:\Users\hermi\OneDrive\Escritorio\ArgenStockTestApp`) tiene sus contenedores con `restart=always`: Docker los levanta solos al abrirse y ocupan el 5432. Por decisión del dev, **este proyecto pasó al 5433**, que es lo que ya decía el README:
  - `docker-compose.yml` publica `127.0.0.1:5433:5432`. También se restringió a `127.0.0.1`, porque antes quedaba expuesto a toda la red local con la contraseña `password`.
  - El valor por defecto de `src/lib/db/index.ts` pasó a 5433. Si hubiera seguido en 5432, un script corrido sin `.env.local` le pegaría a la base del otro proyecto.
  - `.env.local` usa 5433.
- **Verificado:**
  - `/home` responde 200: 42 s el primer compilado y ~0,5 s después.
  - El aviso de lockfiles desapareció.
  - Login real con Chromium (Playwright): `admin` entra a `/`, `vendedor` a `/productos`, y la cookie `session` es `httpOnly`.
  - `tsc` y ESLint en verde.
- **Reapertura:**
  - Se detuvo el servidor del dev y se borró `.next` completo.
  - Con un servidor nuevo, arrancado desde PowerShell igual que el del dev, `/login` dio 200 y el login real con
    Chromium funcionó para `admin` y `vendedor` (2026-10-24 14:18).
  - Al terminar se detuvo el servidor de verificación y se volvió a borrar `.next`.
  - **Confirmado por el dev** (2026-10-24 14:28, log de su `npm run dev`): `GET /login 200`, `loginAction` con
    `admin` y `GET / 200` con el dashboard cargado.
- **Cerrado por el dev** (2026-10-24 15:14): BUG-4 pasa a `Hecho`. Los cambios ya están en `main` y `develop`
  (`f6be135`).
- **Para que no se repita:** quedó anotado en `docs/initial_prompt.md` (sección 10) que un agente que levanta
  `npm run dev` para verificar debe borrar `.next` al terminar, y verificar en el servidor del dev.
- **Pendiente del dev:**
  - `.env.local` no tiene `CLOUDINARY_URL`, así que las fotos de producto no van a funcionar hasta agregarla.
  - El primer compilado de cada página tarda entre 9 y 18 s. Si molesta, la causa probable es OneDrive (ver `docs/architecture.md` → Entornos).

### BUG-5 · Consultas en paralelo sobre la misma conexión en el dashboard

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | S         |
| Depende de   | T-2       |
| Plan         | —         |
| PR           | —         |
| Horas reales | —         |

**Actual**: `fetchDashboardStats` (`src/features/stats/actions/stats.actions.ts`) abre una transacción y lanza tres consultas con `Promise.all` sobre la misma conexión. `pg` avisa: *"Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0"*. Con `pg` 9 va a fallar.

**Esperado**: el dashboard muestra los mismos números, sin el aviso y sin consultas simultáneas sobre una misma conexión.

**Criterios de aceptación**

- [ ] **CA-1** · Test `regression BUG-5` (integración) que reproduce el aviso antes del fix · Estimación: 15 min · Completado: —

- [ ] **CA-2** · El dashboard muestra los mismos totales y el aviso de `pg` no aparece · Estimación: 15 min · Completado: —

### BUG-6 · Datos sensibles en los logs de desarrollo y lecturas de más

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | S         |
| Depende de   | T-2       |
| Plan         | —         |
| PR           | —         |
| Horas reales | —         |

**Actual**:
- En desarrollo, Next 16 imprime los argumentos de cada Server Action: la contraseña del login sale en texto plano en la terminal (`loginAction({"password":"admin",...})`).
- La consulta del dashboard trae el `password_hash` de los vendedores (`with: { vendor: true }`). No llega al navegador, pero se lee sin necesidad.

**Esperado**: ninguna contraseña aparece en los logs, y fuera de `auth` ninguna consulta lee `password_hash`.

**Criterios de aceptación**

- [ ] **CA-1** · Loguearse en desarrollo no imprime la contraseña en la terminal · Estimación: 15 min · Completado: —

- [ ] **CA-2** · Test que garantiza que las lecturas fuera de `auth` no traen `password_hash` · Estimación: 20 min · Completado: —

**Notas**

- Next 16 tiene la opción `logging.serverFunctions` (por defecto `true`) en `next.config.ts`. Apagarla o redactar los argumentos se decide en el plan del ítem.
- El logger de Drizzle (`logger: !isProd` en `src/lib/db/index.ts`) también imprime los parámetros de las consultas en desarrollo: revisarlo en el mismo plan.

### T-6 · E2E sobre `db-test`

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | M         |
| Depende de   | T-5       |
| Plan         | —         |
| PR           | —         |
| Horas reales | —         |

**Historia**: Como dev quiero que el E2E corra contra una base descartable, de forma que nunca toque los datos de
desarrollo.

**Criterios de aceptación**

- [ ] **CA-1** · Playwright levanta la app con `.env.test` (`webServer`) y carga un seed mínimo · Estimación: 40 min · Completado: —

- [ ] **CA-2** · 0 reintentos en local y 1 en CI; Chromium por defecto y los tres navegadores en el CI de `main` · Estimación: 10 min · Completado: —

- [ ] **CA-3** · `tests/readme.md` corregido: no menciona scripts inexistentes · Estimación: 5 min · Completado: —

- [ ] **CA-4** · `npm run test:e2e` en verde, y la base de desarrollo igual antes y después · Estimación: 30 min · Completado: —

### T-7 · Cierre del Sprint 0

| Campo        | Valor              |
| ------------ | ------------------ |
| Estado       | Pendiente          |
| Dueño        | —                  |
| Inicio       | —                  |
| Tamaño       | S                  |
| Depende de   | T-6, BUG-1 a BUG-6 |
| Plan         | —                  |
| PR           | —                  |
| Horas reales | —                  |

**Historia**: Como dev quiero la documentación al día con lo construido, de forma que el próximo agente arranque
con un contexto verdadero.

**Criterios de aceptación**

- [ ] **CA-1** · `README.md` describe el setup real: puertos, `.env`, scripts y tests · Estimación: 20 min · Completado: —

- [ ] **CA-2** · `docs/architecture.md` y `docs/testing.md` sin marcas "(a crear)" para lo que ya existe · Estimación: 10 min · Completado: —

- [ ] **CA-3** · `docs/initial_prompt.md` actualizado · Estimación: 10 min · Completado: —

- [ ] **CA-4** · `npm run verify` en verde sobre `develop`; merge a `main` con el tag `sprint-0` · Estimación: 20 min · Completado: —

------------------------------------------------------------------------------------------------------------------------

## Sprint 1 · Primeras historias del cliente

------------------------------------------------------------------------------------------------------------------------

Se carga desde [`docs/requerimientos/specs.md`](docs/requerimientos/specs.md) siguiendo `docs/workflow.md` §0.

Todavía no hay ítems.

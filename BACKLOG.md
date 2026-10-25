# Backlog

> Estado vigente de todo el trabajo del proyecto. **Si no está acá, no se programa.**
>
> Cómo se usa: [`docs/workflow.md`](docs/workflow.md).

## Índice

- [Convenciones](#convenciones)
- [Sprint 0 · Base técnica](#sprint-0--base-técnica)
- [Sprint 1 · Vender con el modelo de la empanadería](#sprint-1--vender-con-el-modelo-de-la-empanadería)
- [Sprint 2 · Promociones, tarjetas, estadísticas y gastos](#sprint-2--promociones-tarjetas-estadísticas-y-gastos)

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
| `En revisión` | Terminado, verificado e integrado en `develop` con el OK del dev (merge squash local, sin PR); espera la revisión final del dev |
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
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como <rol> quiero <qué>, de forma que <para qué>.
(En un BUG, en lugar de la historia: **Actual** y **Esperado**.)

**Criterios de aceptación**

- [ ] **CA-1** · <criterio medible> · Estimación: 20 min · Completado: —

- [ ] **CA-2** · <criterio medible> · Estimación: 10 min · Completado: —

**Preguntas abiertas**

- <dudas que el dev no puede responder sin el cliente>
```

`Merge` es el hash del commit del ítem en `develop`, y se carga al pasarlo a `Hecho`. No se abren PR: cada ítem se
integra con merge squash local, con el OK del dev (ver [`docs/git.md`](docs/git.md#flujo)).

------------------------------------------------------------------------------------------------------------------------

## Sprint 0 · Base técnica

------------------------------------------------------------------------------------------------------------------------

**Objetivo**: que el flujo completo (requerimiento → backlog → plan → TDD → tests → integración) se pueda ejecutar
de punta a punta.

**Plan del sprint**: [`docs/plans/sprint-0.md`](docs/plans/sprint-0.md) (orden, decisiones del dev y enfoque de cada
ítem). La tabla de abajo está en orden de ejecución.

**Regla del sprint**: no se implementa ninguna US hasta que el Sprint 0 esté `Hecho`. Las US sí se pueden ir
cargando en el Sprint 1 en paralelo.

### Resumen del Sprint 0

| #   | ID                                                                             | Título                                       | Estado      | Depende de         | Estimación      |
| --- | ------------------------------------------------------------------------------ | -------------------------------------------- | ----------- | ------------------ | --------------- |
| —   | [T-1](#t-1--backlog-specs-y-base-inicial-del-repo)                             | Backlog, specs y base inicial del repo       | Hecho       | —                  | 1 h 5 min       |
| —   | [BUG-4](#bug-4--npm-run-dev-se-cuelga-en-compiling-home)                       | `npm run dev` se cuelga en "Compiling /home" | Hecho       | —                  | 42 min          |
| 0   | [T-9](#t-9--flujo-sin-pr-y-backlog-al-día)                                     | Flujo sin PR y backlog al día                | En revisión | —                  | 25 min          |
| 1   | [T-2](#t-2--infraestructura-de-tests)                                          | Infraestructura de tests                     | En revisión | T-1                | 2 h 10 min      |
| 2   | [BUG-2](#bug-2--jwt_secret-con-valor-por-defecto-en-el-código)                 | `JWT_SECRET` con valor por defecto           | En revisión | T-2                | 25 min          |
| 3   | [T-8](#t-8--la-base-de-producción-se-elige-con-app_env)                        | La base de producción se elige con `APP_ENV` | En revisión | T-2                | 55 min          |
| 4   | [BUG-3](#bug-3--scripts-de-base-que-borran-todo-sin-protección)                | Scripts que borran todo sin protección       | En revisión | T-2, T-8           | 35 min          |
| 5   | [T-3](#t-3--gates-eslint-con-reglas-duras-hooks-y-ci)                          | Gates: ESLint con reglas duras, hooks y CI   | En revisión | T-2, T-8           | 3 h             |
| 6   | [BUG-5](#bug-5--consultas-en-paralelo-sobre-la-misma-conexión-en-el-dashboard) | Consultas en paralelo en el dashboard        | En revisión | T-2                | 30 min          |
| 7   | [BUG-6](#bug-6--datos-sensibles-en-los-logs-de-desarrollo-y-lecturas-de-más)   | Datos sensibles en logs y lecturas de más    | En revisión | T-2                | 35 min          |
| 8   | [BUG-9](#bug-9--errores-de-base-de-datos-mal-traducidos)                       | Errores de base de datos mal traducidos      | En revisión | T-2                | 40 min          |
| 9   | [T-4](#t-4--bases-de-la-arquitectura-objetivo)                                 | Bases de la arquitectura objetivo            | En revisión | T-3                | 2 h             |
| 10  | [BUG-1](#bug-1--acciones-de-fotos-de-producto-sin-control-de-sesión)           | Acciones de fotos sin control de sesión      | En revisión | T-4                | 45 min          |
| 11  | [BUG-7](#bug-7--el-password_hash-llega-al-navegador)                           | El `password_hash` llega al navegador        | En revisión | T-4                | 50 min          |
| 12  | [BUG-8](#bug-8--lecturas-de-productos-y-proveedores-sin-sesión)                | Lecturas de productos y proveedores sin sesión | En revisión | T-4                | 30 min          |
| 13  | [T-6](#t-6--e2e-sobre-db-test)                                                 | E2E sobre `db-test`                          | En revisión | T-4, T-8           | 1 h 25 min      |
| 14  | [T-5](#t-5--proveedores-como-feature-molde)                                    | Proveedores como feature molde               | En revisión | T-6                | 5 h             |
| 15  | [T-7](#t-7--cierre-del-sprint-0)                                               | Cierre del Sprint 0                          | En revisión | T-5, BUG-1 a BUG-9 | 1 h             |
|     |                                                                                | **Total del sprint**                         |             |                    | **22 h 32 min** |

### T-1 · Backlog, specs y base inicial del repo

| Campo        | Valor                                                              |
| ------------ | ------------------------------------------------------------------ |
| Estado       | Hecho                                                              |
| Dueño        | Ignacio Tomas                                                      |
| Inicio       | 2026-10-23                                                         |
| Tamaño       | S                                                                  |
| Depende de   | —                                                                  |
| Plan         | [`docs/plans/T-1-base-inicial.md`](docs/plans/T-1-base-inicial.md) |
| Merge        | `f6be135` (arranque directo en `main`, antes de existir `develop`) |
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

### T-9 · Flujo sin PR y backlog al día

| Campo        | Valor                                                         |
| ------------ | ------------------------------------------------------------- |
| Estado       | En revisión                                                   |
| Dueño        | Ignacio Tomas                                                 |
| Inicio       | 2026-10-24                                                    |
| Tamaño       | S                                                             |
| Depende de   | —                                                             |
| Plan         | [`docs/plans/sprint-0.md`](docs/plans/sprint-0.md) (sección 0) |
| Merge        | —                                                             |
| Horas reales | —                                                             |

**Historia**: Como dev quiero que el flujo documentado refleje que no se usan pull requests y que el backlog tenga
todo el Sprint 0 ordenado, de forma que cada ítem se integre siempre igual y nada quede afuera del backlog.

**Criterios de aceptación**

- [x] **CA-1** · Ningún doc del flujo, skill propia ni regla pide abrir un PR; `docs/git.md` describe el merge squash local y el cierre de sprint con merge local y tag · Estimación: 15 min · Completado: 2026-10-24 15:55

- [x] **CA-2** · `BACKLOG.md` con el campo `Merge`, los ítems nuevos (T-8, BUG-7 a BUG-12), las dependencias y el orden de `docs/plans/sprint-0.md` · Estimación: 8 min · Completado: 2026-10-24 15:55

- [x] **CA-3** · `npm run skills:check` en verde después de `skills:sync` · Estimación: 2 min · Completado: 2026-10-24 15:55

**Decisiones del dev** (2026-10-24)

- **Sin PR, como regla general.** Rama por ítem y, con el OK del dev, `git merge --squash` a `develop`, push y
  borrado de la rama. El cierre de sprint es un merge local `develop → main` con el tag.
- Entran al Sprint 0 tres hallazgos de la exploración del código: BUG-7, BUG-8 y BUG-9. BUG-10, BUG-11 y BUG-12
  quedan en el Sprint 1.
- T-8 (la base de producción se elige con `APP_ENV`) va antes de T-3, y T-6 (E2E sobre `db-test`) antes de T-5.

### T-2 · Infraestructura de tests

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-24 |
| Tamaño       | M         |
| Depende de   | T-1       |
| Plan         | [`docs/plans/T-2-infraestructura-de-tests.md`](docs/plans/T-2-infraestructura-de-tests.md) |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como dev quiero poder correr tests unit, de contrato, fuzz e integración contra una base
descartable, de forma que cada ítem se pueda hacer con TDD.

**Criterios de aceptación**

- [x] **CA-1** · Vitest configurado según la guía oficial de Next.js (proyectos `unit` e `integration`, alias `@/`, `server-only` reemplazado por un módulo vacío) · Estimación: 40 min · Completado: 2026-10-24 16:15

- [x] **CA-2** · Servicio `db-test` en `docker-compose.yml` (postgres:15, puerto 5434, `tmpfs`) y `.env.test` · Estimación: 15 min · Completado: 2026-10-24 16:15

- [x] **CA-3** · El `globalSetup` de integración aborta si la URL no es la de `db-test`, y aplica las migraciones y `unaccent` · Estimación: 30 min · Completado: 2026-10-24 16:15

- [x] **CA-4** · `.env.example` (con `!.env.example` en `.gitignore`) y los scripts `typecheck`, `test`, `test:watch`, `test:coverage`, `test:int` y `test:e2e` · Estimación: 15 min · Completado: 2026-10-24 16:15

- [x] **CA-5** · Un test unit y uno de integración de prueba pasan; `npm run typecheck` en verde · Estimación: 15 min · Completado: 2026-10-24 16:15

- [x] **CA-6** · ADR "Vitest como runner de tests con Next.js" · Estimación: 15 min · Completado: 2026-10-24 16:15

**Notas**

- **Desvío de la guía de Next**: el alias `@/` usa `resolve.tsconfigPaths`, que es nativo en Vite 8, en lugar del
  plugin `vite-tsconfig-paths` (el propio Vite pide no usar el plugin). Va en el ADR 0001.
- **`@types/node` pasó de `^20` a `^22`**: Vitest 5 lo pide, y coincide con el Node del proyecto (22.15).
- **Evidencia de la guarda (CA-3)**: sin `.env.test`, con la URL del 5433, con `NODE_ENV=production` y con
  `db-test` apagada, `vitest --project integration` sale con código 1 y el mensaje en español. Con `.env.test` y
  `db-test` nueva, aplica las 6 migraciones y pasa.
- **Bug de Vite 8**: al imprimir un error del `globalSetup`, el mapeo del stack falla y oculta el mensaje. El setup
  relanza los errores con un stack plano (ver ADR 0001).
- La migración `0005_enable-unaccent` va a correr en producción en el próximo `db:migrate`. Es idempotente.

### T-8 · La base de producción se elige con `APP_ENV`

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-24 |
| Tamaño       | S         |
| Depende de   | T-2       |
| Plan         | [`docs/plans/T-8-base-explicita.md`](docs/plans/T-8-base-explicita.md) |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como dev quiero que la base de producción sólo se use cuando lo pido explícitamente, de forma que ni
`next build`, ni `next start`, ni un test o un script le peguen a Supabase por accidente.

Hoy `src/lib/db/index.ts` y `drizzle.config.ts` eligen la base por `NODE_ENV`. `next build` y `next start` corren con
`NODE_ENV=production`, así que cargan `.env.prod`. Además, `/home` se prerenderiza en el build y lee los productos,
así que un `npm run build` local consulta la base de producción, y en el CI no hay forma de apuntar a `db-test`.

**Criterios de aceptación**

- [x] **CA-1** · Una función pura resuelve la configuración: producción sólo con `APP_ENV=production` (`DATABASE_URL` y SSL); si no, `LOCAL_DATABASE_URL` obligatoria y sin SSL. Tests en tabla, incluido `NODE_ENV=production` sin `APP_ENV` → base local · Estimación: 20 min · Completado: 2026-10-24 16:24

- [x] **CA-2** · `src/lib/db/index.ts` y `drizzle.config.ts` la usan, y `npm run build` prerenderiza `/home` contra la base local, verificado · Estimación: 20 min · Completado: 2026-10-24 16:24

- [x] **CA-3** · `.env.example`, `docs/architecture.md` (Entornos), `docs/initial_prompt.md` y los comandos contra producción (`APP_ENV=production npm run …`) actualizados; ADR "La base se elige con `APP_ENV`, no con `NODE_ENV`" · Estimación: 15 min · Completado: 2026-10-24 16:24

**Notas**

- Quien despliegue la app (el hosting está a definir) tiene que definir `APP_ENV=production`.
- **Evidencia de CA-2**: `npm run build` con `DATABASE_URL` apuntando a una IP inalcanzable (203.0.113.1) terminó con
  código 0, prerenderizó `/home` (ISR de 30 s) y el log mostró las 2 consultas del catálogo por la configuración
  local. No hubo ningún intento de conexión al host falso. En esta PC no existe `.env.prod`.
- `APP_ENV` desconocido (`prod`, `PRODUCTION`…) es un error, para que una errata no elija una base sin querer.
- La guarda de los tests de integración (T-2) también rechaza `APP_ENV=production`.

### T-3 · Gates: ESLint con reglas duras, hooks y CI

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-24 |
| Tamaño       | M         |
| Depende de   | T-2, T-8  |
| Plan         | [`docs/plans/T-3-gates.md`](docs/plans/T-3-gates.md) |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como dev quiero que las reglas duras de `AGENTS.md` se hagan cumplir solas, de forma que el código
nuevo no pueda violarlas.

**Criterios de aceptación**

- [x] **CA-1** · ESLint rechaza las violaciones de las reglas duras (ver detalle) · Estimación: 45 min · Completado: 2026-10-24 16:41

- [x] **CA-2** · `eslint-legacy.json` lista los archivos heredados que hoy las violan; el CI rechaza un push que agregue entradas · Estimación: 30 min · Completado: 2026-10-24 16:41

- [x] **CA-3** · Corregido el error de `react-hooks/immutability` en `product-photos-manager.tsx`; `npm run lint` en verde · Estimación: 10 min · Completado: 2026-10-24 16:41

- [x] **CA-4** · lefthook: `pre-commit` (bloquea `.env`, lint, typecheck), `commit-msg` (commitlint), `pre-push` (`test:coverage`, `skills:check`) · Estimación: 20 min · Completado: 2026-10-24 16:41

- [x] **CA-5** · `.github/workflows/ci.yml` en cada push a `develop`/`main` · Estimación: 45 min · Completado: 2026-10-24 16:46

- [x] **CA-6** · Demostrado que se rechazan un mensaje de commit inválido, un `.env` staged y un archivo nuevo de 101 líneas · Estimación: 15 min · Completado: 2026-10-24 16:41

- [x] **CA-7** · ADR "Reglas estrictas en código nuevo con lista legacy que sólo se achica" · Estimación: 15 min · Completado: 2026-10-24 16:41

**Notas**

- **CA-1**: además de las reglas del detalle, `as` (salvo `as const`) y los tipos de retorno explícitos en lo
  exportado. La excepción a "cero comentarios" se marca con `Por qué:`. `src/test/eslint-rules.test.ts` verifica cada
  regla (22 casos).
- **CA-2**: 143 archivos heredados (142 de código y `globals.css`). `npm run lint:legacy -- <ref>` falla si la lista
  crece, tiene repetidos o apunta a archivos que ya no existen.
- **CA-6**, evidencia en esta rama, con los hooks instalados:
  - `git commit -m "cambio cualquiera"`: commitlint rechaza con `subject-empty` y `type-empty`.
  - `.env.demo` en el stage: "Commit bloqueado: no se commitean archivos .env reales".
  - `src/lib/demo-101.ts` de 101 líneas: `max-lines` "File has too many lines (101)".
- Los tests no tienen `max-lines-per-function` (los `describe` son estructura); el tope por archivo y `max-params`
  sí aplican.
- **CA-5**: la primera corrida del CI (run 40126729595, push de `036ee6c` a `develop`) terminó en verde en los 4 jobs
  (quality, unit, integración y build contra `db-test`). El primer push lo frenó el `pre-push`: la cobertura medía la
  config de ESLint, y se corrigió excluyendo `eslint/` y `scripts/` antes de publicar.

**Detalle**

- **Reglas de CA-1**:
  - Archivos de más de 100 líneas físicas.
  - Funciones de más de 40 líneas o con más de 3 parámetros.
  - `any` y `!`.
  - `sql` de Drizzle fuera de `schema.ts`.
  - Importaciones prohibidas entre capas.
  - Comentarios.
- **Lista legacy (CA-2)**: en esos archivos se apagan *sólo* las reglas nuevas.
- **CI (CA-5)**: lint, typecheck, cobertura, integración, build (contra `db-test`, gracias a T-8), `skills:check` y
  chequeo de la lista legacy. El job de E2E se suma en T-6 y el de mutación en T-5. La estimación incluye esperar
  las primeras corridas y corregir lo que falle.

### T-4 · Bases de la arquitectura objetivo

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-24 |
| Tamaño       | M         |
| Depende de   | T-3       |
| Plan         | [`docs/plans/T-4-bases-arquitectura.md`](docs/plans/T-4-bases-arquitectura.md) |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como dev quiero las piezas transversales de la arquitectura objetivo, de forma que cualquier feature
pueda migrarse o crearse siguiendo `docs/architecture.md`.

**Criterios de aceptación**

- [x] **CA-1** · `AppError(code)` y su catálogo en `src/lib/errors/`, con los mismos textos que `src/config/messages.ts`; el código heredado muestra los mismos mensajes · Estimación: 45 min · Completado: 2026-10-24 17:20

- [x] **CA-2** · El caso de error de `ActionResult` suma `code` y conserva `error` · Estimación: 15 min · Completado: 2026-10-24 17:20

- [x] **CA-3** · `withTransaction` en `src/lib/db/`, `import 'server-only'` en `src/lib/db/index.ts` y `formatDateTime` en `America/Argentina/Buenos_Aires` · Estimación: 30 min · Completado: 2026-10-24 17:20

- [x] **CA-4** · Helpers de test `asUser({ role })` y `truncateAll()`, con un test de `asUser` contra `verifyAuthOrAdmin` · Estimación: 30 min · Completado: 2026-10-24 17:20

**Notas**

- **CA-1**: códigos `VALIDATION`, `UNAUTHENTICATED`, `SESSION_EXPIRED`, `INACTIVE_USER`, `FORBIDDEN`, `NOT_FOUND`,
  `DUPLICATE`, `HAS_RELATIONS`, `RELATION_NOT_FOUND`, `STALE_VERSION` y `UNEXPECTED`, con los textos que ya veía el
  usuario (los de `MESSAGES` y los de `verifyAuthOrAdmin`/`verifyToken`, que ahora lanzan `AppError`).
  `src/lib/errors.ts` pasó a `src/lib/errors/legacy-errors.ts`, y `@/lib/errors` sigue resolviendo para los 12
  archivos que lo importan.
- **CA-2**: `code` es opcional en el tipo, para no romper el código heredado. `fail(code)` y
  `toActionFailure(error, entidad)` lo completan siempre, y el segundo nunca filtra el mensaje de un error desconocido.
- **CA-3**: con `server-only`, un script corrido con `tsx` sin la condición falla (verificado). Los scripts `db:*`, el
  paso de seed de `reset-full` y `test:e2e` corren con `--conditions=react-server`. `db:seed` contra `db-test` y
  `next build` funcionan.
- **CA-4**: `truncateAll()` se había adelantado en BUG-5. `asUser` usa un `next/headers` simulado (setup global) y
  un spy de `getUserById`. En unit, `@/lib/db` falla al usarse.
- **Para T-6**: el `webServer` de Playwright tiene que vaciar `NODE_OPTIONS`, porque la condición `react-server`
  aplicada a `next start` rompería el render.

### T-5 · Proveedores como feature molde

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-24 |
| Tamaño       | L         |
| Depende de   | T-6       |
| Plan         | [T-5-proveedores-molde](docs/plans/T-5-proveedores-molde.md) |
| Merge        | `02996ca` (avance) y el squash del cierre |
| Horas reales | ≈ 4 h 30 min |

**Historia**: Como dev quiero una feature completa en la arquitectura objetivo y con todos los tipos de test, de
forma que sirva de molde para las demás y demuestre el flujo de punta a punta.

**Criterios de aceptación**

- [x] **CA-1** · `tests/proveedores.spec.ts` pasa antes y después, sobre `db-test` (T-6): no cambia el comportamiento visible · Estimación: 20 min · Completado: 2026-10-24 21:27

- [x] **CA-2** · `provider` tiene `domain`, `repository` (más fake), `services`, `actions` y `ui` según las reglas duras, y sale de `eslint-legacy.json` · Estimación: 2 h · Completado: 2026-10-24 18:55

- [x] **CA-3** · Una suite de comportamiento del repositorio corre contra el fake y contra Drizzle · Estimación: 30 min · Completado: 2026-10-24 18:55

- [x] **CA-4** · Un test de contrato por fila de la tabla de errores (`DUPLICATE`, `STALE_VERSION`, `HAS_RELATIONS`, permisos) · Estimación: 30 min · Completado: 2026-10-24 18:55

- [x] **CA-5** · Activar/desactivar un proveedor filtra por `version`, con su test · Estimación: 15 min · Completado: 2026-10-24 18:55

- [x] **CA-6** · Stryker configurado (`test:mutation`, `verify`); mutación ≥ 70 y cobertura ≥ 90/85 en `provider` · Estimación: 40 min · Completado: 2026-10-24 21:25

- [x] **CA-7** · `docs/features/provider/README.md` desde la plantilla · Estimación: 15 min · Completado: 2026-10-24 21:32

- [x] **CA-8** · Recorrió `start-task` → `finish-task` → merge squash local a `develop` con CI verde en el push · Estimación: 30 min · Completado: 2026-10-24 21:33

**Detalle**

- CA-2 es la revisión más pesada del sprint: unos 15 archivos nuevos o partidos. La estimación es casi toda lectura
  de código del dev.

**Avance (2026-10-24 18:55)**: integrado parcialmente en `develop` porque se cortó la sesión.

- **Hecho**:
  - `provider` quedó con domain (`strictObject`), repository (interfaz, Drizzle y unidad de trabajo con auditoría),
    fake, service, una action por archivo y UI en `features/provider/ui`. Salió de `eslint-legacy.json` (139 → 132).
  - La suite de comportamiento corre contra el fake y contra Drizzle (CA-3).
  - Contratos por fila de la tabla de errores (`UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION`, `DUPLICATE`,
    `STALE_VERSION`, `HAS_RELATIONS`) y un fuzz (CA-4).
  - Activar/desactivar y borrar exigen `version` (CA-5).
  - 184 unit y 27 de integración en verde; lint y cobertura en verde.

**Cierre (2026-10-24 21:33)**:

- CA-1: `tests/proveedores.spec.ts` 24/24 en verde sobre `db-test` después del refactor.
- CA-6: `stryker.config.mjs` (con `vitest.mutation.config.mts`, sólo los tests de `provider` y `src/lib/errors`),
  `test:mutation`, `verify` y un job `mutation` en el CI. Score **97,46** (115 muertos, 3 sobrevivientes en
  `providerRowSchema`); cobertura 97,75 % de líneas.
- CA-7: `docs/features/provider/README.md`.
- Proyecto `component` de Vitest (jsdom) con su primer test, `provider-form-fields.test.tsx`. `test` y
  `test:coverage` corren `unit` y `component`: 186 tests.
- El commit `02996ca` del avance quedó con el título de T-6 (mensaje vacío por error); lo aclara `35868e0`.

### BUG-1 · Acciones de fotos de producto sin control de sesión

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-24 |
| Tamaño       | S         |
| Depende de   | T-4       |
| Plan         | [`docs/plans/BUG-1-fotos-sesion.md`](docs/plans/BUG-1-fotos-sesion.md) |
| Merge        | —         |
| Horas reales | —         |

**Actual**: `upload-product-photo.ts`, `delete-product-photo.ts` y `get-product-photos.ts` (en
`src/features/product/actions/`) no verifican sesión ni rol. Cualquiera puede invocarlas con un POST.

**Esperado**: `admin` y `vendedor` pueden subir, borrar y listar fotos; sin sesión válida se recibe
`UNAUTHENTICATED`.

**Criterios de aceptación**

- [x] **CA-1** · Un test `regression BUG-1` por acción, que falla antes del fix · Estimación: 20 min · Completado: 2026-10-24 17:30

- [x] **CA-2** · Las tres acciones verifican sesión y permiten `admin` y `vendedor` · Estimación: 15 min · Completado: 2026-10-24 17:30

- [x] **CA-3** · El `vendedor` ve el botón de fotos en la tabla y en la tarjeta de productos, con su test · Estimación: 10 min · Completado: 2026-10-24 17:30

**Preguntas resueltas** (dev, 2026-10-24)

- Subir, borrar y listar fotos: `admin` y `vendedor`. Por eso se le muestra el botón al vendedor (hoy sólo lo ve el
  admin).

**Notas**

- **CA-1**: `product-photos.contract.test.ts`. Antes del fix, subir una foto sin sesión **llamaba a Cloudinary**, y
  las otras dos llegaban a la base. Ahora las tres devuelven `{ code: 'UNAUTHENTICATED' }`.
- **CA-2**: `product-photos.contract.int.test.ts`: admin y vendedor suben, listan y borran contra `db-test`, con
  Cloudinary reemplazado por un fake. El cambio en las acciones es mínimo y siguen en la lista legacy; la validación
  y la auditoría de las fotos son BUG-11.
- **CA-3**: `canManagePhotos(role)` en `product/domain/product-permissions.ts` y render a HTML de la tabla y del menú
  de la tarjeta. Con la condición vieja, el test del vendedor falla.
- La cobertura excluye ahora los archivos de `eslint-legacy.json` y los helpers de test: el umbral es para el código
  nuevo (`docs/testing.md`).

### BUG-2 · `JWT_SECRET` con valor por defecto en el código

| Campo        | Valor                            |
| ------------ | -------------------------------- |
| Estado       | En revisión                      |
| Dueño        | Ignacio Tomas                    |
| Inicio       | 2026-10-23                       |
| Tamaño       | S                                |
| Depende de   | T-2 (para el test)               |
| Plan         | — (fix adelantado dentro de T-1) |
| Merge        | —                                |
| Horas reales | —                                |

**Actual** (antes del fix): `src/lib/auth/jwt.ts` usaba un secreto escrito en el código si faltaba la variable de
entorno.

**Esperado**: sin `JWT_SECRET` no se pueden firmar ni verificar sesiones, y `.env.example` documenta la variable.

**Criterios de aceptación**

- [x] **CA-1** · El secreto ya no está en el código y la variable es obligatoria · Estimación: 10 min · Completado: 2026-10-23 22:06

- [x] **CA-2** · Test `regression BUG-2`: sin la variable, firmar y verificar falla con un error claro (requiere T-2) · Estimación: 10 min · Completado: 2026-10-24 16:18

- [x] **CA-3** · `JWT_SECRET` documentada en `.env.example` (se crea en T-2) · Estimación: 5 min · Completado: 2026-10-24 16:15

**Notas**

- CA-1 se adelantó para que el secreto nunca llegara al repo público. Es una **excepción a TDD aprobada por el
  dev**: el test (CA-2) se escribe en cuanto exista Vitest.
- `getSecretKey()` lee la variable al usarla, para que `next build` no falle donde no esté definida.
- Verificado a mano con `tsx`: con la variable, firma y verificación funcionan; sin ella, falla con "Falta la
  variable de entorno JWT_SECRET.". `tsc` y ESLint en verde.
- Las credenciales de login no cambian: `admin`/`admin` y `vendedor`/`vendedor` viven en la base (seed), son
  temporales y se borran cuando estén las cuentas reales.
- **CA-2** (2026-10-24): `src/lib/auth/jwt.test.ts`. Como el fix ya estaba aplicado, el rojo se mostró simulando el
  código anterior (secreto por defecto): los dos tests `regression BUG-2` fallaron, y con el fix pasan.

### BUG-3 · Scripts de base que borran todo sin protección

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-24 |
| Tamaño       | S         |
| Depende de   | T-2, T-8  |
| Plan         | [`docs/plans/BUG-3-guarda-scripts.md`](docs/plans/BUG-3-guarda-scripts.md) |
| Merge        | —         |
| Horas reales | —         |

**Actual**: `db:seed`, `db:reset-data` y `db:reset-full` borran todas las tablas, también con
`NODE_ENV=production` (Supabase).

**Esperado**: se niegan a correr si la configuración es de producción (`APP_ENV=production`, ver T-8) o si la URL no
es local o de test.

**Criterios de aceptación**

- [x] **CA-1** · Función de guarda con su test `regression BUG-3` · Estimación: 25 min · Completado: 2026-10-24 16:27

- [x] **CA-2** · Los tres scripts usan la guarda antes de borrar · Estimación: 10 min · Completado: 2026-10-24 16:27

**Notas**

- La guarda (`src/lib/db/scripts/assert-safe-to-wipe.ts`) valida la URL que resuelve `database-config.ts` (T-8):
  bloquea `APP_ENV=production`, una URL inválida y cualquier host que no sea `localhost`/`127.0.0.1`.
- **Evidencia**: con `APP_ENV=production` y con un host remoto falso, `db:seed`, `db:reset-data` y `db:reset-full`
  salen con código 1 y el mensaje "Script destructivo bloqueado…"; `reset-full` no llega al paso 1. `db:seed` contra
  `db-test` funciona (2 usuarios, 5 productos).
- `reset-full` lee el `.env` en una copia del entorno, así sus pasos se comportan igual que antes.
- `wipe-db.ts` (sin script npm), el `db:generate` de `reset-full` y `db:seed-users` quedan para BUG-10.

### BUG-4 · `npm run dev` se cuelga en "Compiling /home"

| Campo        | Valor                                          |
| ------------ | ---------------------------------------------- |
| Estado       | Hecho                                          |
| Dueño        | Ignacio Tomas                                  |
| Inicio       | 2026-10-24                                     |
| Tamaño       | S                                              |
| Depende de   | —                                              |
| Plan         | — (aprobado en la sesión; causa y pasos abajo) |
| Merge        | `f6be135`                                      |
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
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-24 |
| Tamaño       | S         |
| Depende de   | T-2       |
| Plan         | [`docs/plans/BUG-5-dashboard-secuencial.md`](docs/plans/BUG-5-dashboard-secuencial.md) |
| Merge        | —         |
| Horas reales | —         |

**Actual**: `fetchDashboardStats` (`src/features/stats/actions/stats.actions.ts`) abre una transacción y lanza tres consultas con `Promise.all` sobre la misma conexión. `pg` avisa: *"Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0"*. Con `pg` 9 va a fallar.

**Esperado**: el dashboard muestra los mismos números, sin el aviso y sin consultas simultáneas sobre una misma conexión.

**Criterios de aceptación**

- [x] **CA-1** · Test `regression BUG-5` (integración) que reproduce el aviso antes del fix · Estimación: 15 min · Completado: 2026-10-24 16:53

- [x] **CA-2** · El dashboard muestra los mismos totales y el aviso de `pg` no aparece · Estimación: 15 min · Completado: 2026-10-24 16:53

**Notas**

- **CA-1**: `stats.repository.int.test.ts` espía `process.emitWarning`. Con las consultas en paralelo (como antes)
  el test falló, y con las consultas secuenciales pasa.
- **CA-2**: los totales salen de un cálculo puro (`compute-dashboard-stats.ts`) que replica la fórmula original, con
  el mismo orden de suma. Están verificados con tests unit y con un test de integración sobre datos sembrados. La
  respuesta de la action tiene la misma forma que antes.
- Las consultas corren en una transacción `repeatable read` de sólo lectura (antes, `read committed` no garantizaba
  una foto consistente) y traen sólo las columnas que se usan. Del vendedor sólo viene `username`, lo que adelanta
  parte de BUG-6.
- `stats` es el primer feature con capas `services` y `repository`, y tiene su `docs/features/stats/README.md`.
  `stats.actions.ts` salió de `eslint-legacy.json` (143 → 142).
- `truncateAll()` (previsto en T-4 CA-4) se adelantó acá en `src/test/truncate-all.ts`, con la guarda de `db-test`.

### BUG-6 · Datos sensibles en los logs de desarrollo y lecturas de más

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-24 |
| Tamaño       | S         |
| Depende de   | T-2       |
| Plan         | [`docs/plans/BUG-6-datos-sensibles.md`](docs/plans/BUG-6-datos-sensibles.md) |
| Merge        | —         |
| Horas reales | —         |

**Actual**:
- En desarrollo, Next 16 imprime los argumentos de cada Server Action: la contraseña del login sale en texto plano en la terminal (`loginAction({"password":"admin",...})`).
- La consulta del dashboard trae el `password_hash` de los vendedores (`with: { vendor: true }`). No llega al navegador, pero se lee sin necesidad.

**Esperado**: ninguna contraseña aparece en los logs, y fuera de `auth` ninguna consulta lee `password_hash`.

**Criterios de aceptación**

- [x] **CA-1** · Loguearse en desarrollo no imprime la contraseña en la terminal · Estimación: 15 min · Completado: 2026-10-24 17:01

- [x] **CA-2** · Test que garantiza que las lecturas fuera de `auth` no traen `password_hash` · Estimación: 20 min · Completado: 2026-10-24 17:01

**Notas**

- Next 16 tiene la opción `logging.serverFunctions` (por defecto `true`) en `next.config.ts`. Apagarla o redactar los argumentos se decide en el plan del ítem.
- El logger de Drizzle (`logger: !isProd` en `src/lib/db/index.ts`) también imprime los parámetros de las consultas en desarrollo: revisarlo en el mismo plan.
- **Decisión**: se apagó `logging.serverFunctions`, porque Next no permite redactar los argumentos, y Drizzle pasó a
  un logger que imprime el SQL sin parámetros (`src/lib/db/query-logger.ts`).
- **Evidencia de CA-1** con un `next dev` real en el puerto 3100 y un login con una contraseña única:
  - Antes del fix, el log mostraba `ƒ loginAction({"password":"clave-unica-BUG6-7319","username":"admin"})`.
  - Después, el `POST /login` aparece sin los argumentos y la contraseña no figura en el log (0 apariciones).
- **CA-2**: `src/test/password-hash-reads.int.test.ts` cubre `getUserById` (lo usa `verifyAuthOrAdmin`),
  `getSaleById`, la foto del dashboard y el listado de usuarios. Antes del fix, `getUserById` y `getSaleById` fallaban.
  Los chequeos de duplicado de `createUser` y `updateUser` ahora piden sólo las columnas que usan.
- **Hallazgo**: un `next dev` levantado después del `npm run build` de T-8 daba 404 en `/login` hasta borrar `.next`.
  Quedó anotado en `docs/initial_prompt.md` y lo tiene en cuenta T-6.

### BUG-7 · El `password_hash` llega al navegador

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-24 |
| Tamaño       | S         |
| Depende de   | T-4       |
| Plan         | [`docs/plans/BUG-7-password-hash.md`](docs/plans/BUG-7-password-hash.md) |
| Merge        | —         |
| Horas reales | —         |

**Actual**: `createUserAction` y `updateUserAction` (`src/features/user/actions/user.actions.ts:79` y `:110`)
devuelven la fila de `.returning()` con un cast `as UserDef`, sin parsear, así que el `password_hash` viaja al
navegador en la respuesta. Además, `verifyAuthOrAdmin` devuelve la fila completa del usuario, hash incluido.

**Esperado**: ninguna respuesta al cliente, ni el usuario que devuelve `verifyAuthOrAdmin`, lleva el
`password_hash`.

**Criterios de aceptación**

- [x] **CA-1** · Test `regression BUG-7` de contrato: la `data` de crear y de editar un usuario no tiene `passwordHash` · Estimación: 20 min · Completado: 2026-10-24 17:34

- [x] **CA-2** · Las actions de usuario parsean la respuesta con `userRowSchema`, y los `.returning()` de `user.repository` listan las columnas · Estimación: 15 min · Completado: 2026-10-24 17:34

- [x] **CA-3** · `verifyAuthOrAdmin` devuelve un tipo sin `passwordHash`, con su test de tipos · Estimación: 15 min · Completado: 2026-10-24 17:34

**Notas**

- **CA-1**: `user-password-hash.contract.int.test.ts`, con `asUser` admin contra `db-test`. Cubre crear, reactivar y
  editar, y que editar no toca el hash guardado. Antes del fix fallaban los 3.
- **CA-2**: los cinco `.returning()` de `user.repository` usan `PUBLIC_USER_COLUMNS`, y las actions parsean con
  `userRowSchema`.
- **CA-3**: `verifyAuthOrAdmin(): Promise<UserDef>` y `userRowSchema.parse`. El test de tipos (`expectTypeOf`) lo
  controla `npm run typecheck`: antes del fix el tipo era `any` y `tsc` fallaba. Además, una regresión unit verifica
  que el hash no sale aunque el repositorio lo traiga.

### BUG-8 · Lecturas de productos y proveedores sin sesión

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-24 |
| Tamaño       | S         |
| Depende de   | T-4       |
| Plan         | [`docs/plans/BUG-8-lecturas-sin-sesion.md`](docs/plans/BUG-8-lecturas-sin-sesion.md) |
| Merge        | —         |
| Horas reales | —         |

**Actual**: `fetchProducts` y `fetchSelectorData` (`src/features/product/actions/product.actions.ts`) no verifican
sesión. Cualquiera puede llamarlas con un POST y leer los precios de compra, el proveedor de cada producto y el
teléfono y el mail de los proveedores.

**Esperado**: las dos exigen una sesión válida (`admin` o `vendedor`, que son quienes usan `/productos`).

**Criterios de aceptación**

- [x] **CA-1** · Test `regression BUG-8` de contrato: sin sesión, ninguna de las dos devuelve datos · Estimación: 20 min · Completado: 2026-10-24 17:38

- [x] **CA-2** · Las dos acciones verifican la sesión · Estimación: 10 min · Completado: 2026-10-24 17:38

**Notas**

- **CA-1**: `product-reads.contract.test.ts` espía los repositorios con datos reales. Antes del fix, sin sesión,
  devolvían los productos (con precio de compra) y los proveedores (con teléfono y mail). Ahora devuelven listas
  vacías sin llamar al repositorio, y con sesión de vendedor siguen devolviendo los datos.
- **CA-2**: `verifyAuthOrAdmin(false)` al empezar las dos acciones. `product.actions.ts` sigue en la lista legacy.

**Preguntas abiertas**

- (Cliente) ¿El vendedor debe ver los precios de compra y el contacto de los proveedores? Se consulta junto con la
  de US-4 (¿el vendedor ingresa stock?), en la lista de [`docs/plans/sprint-1.md`](docs/plans/sprint-1.md#preguntas-para-el-cliente).

### BUG-9 · Errores de base de datos mal traducidos

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-24 |
| Tamaño       | S         |
| Depende de   | T-2       |
| Plan         | [`docs/plans/BUG-9-errores-de-base.md`](docs/plans/BUG-9-errores-de-base.md) |
| Merge        | —         |
| Horas reales | —         |

**Actual**: Drizzle 0.45 envuelve cada error de Postgres en un `DrizzleQueryError` cuyo mensaje empieza con
`Failed query:` y que guarda el error original en `.cause`. `handleDatabaseError` (`src/lib/db-errors.ts`) sólo mira
`error.code` y `error.originalError?.code`, así que un 23505 (unicidad) o un 23503 (clave foránea) caen en la rama
`failed query` y el usuario ve el mensaje de **concurrencia**.

**Esperado**: cada error real de la base muestra su mensaje (duplicado, entidad relacionada inexistente, registros
relacionados).

**Criterios de aceptación**

- [x] **CA-1** · Test `regression BUG-9` de integración contra `db-test`: duplicado → `UNIQUE_VIOLATION`, referencia inexistente → `RELATION_NOT_FOUND`, borrado de un registro referenciado → `FOREIGN_KEY_VIOLATION` · Estimación: 20 min · Completado: 2026-10-24 17:07

- [x] **CA-2** · `handleDatabaseError` lee el código y el detalle de `error.cause` · Estimación: 10 min · Completado: 2026-10-24 17:07

- [x] **CA-3** · Revisado el escenario C de `tests/concurrencia.spec.ts`, que hoy espera el texto de concurrencia; queda confirmado en T-6, sobre `db-test` · Estimación: 10 min · Completado: 2026-10-24 17:07

**Notas**

- **CA-1**: `src/lib/db-errors.int.test.ts`, con errores reales de Drizzle. Antes del fix fallaban los 3 casos.
- **CA-2**: `handleDatabaseError` lee código, detalle y mensaje en el error, en `originalError` y en `cause`, y
  distingue los dos 23503 por el `detail`. Un fuzz (`fast-check`) demostró que la versión anterior **lanzaba** con
  entradas como `null`; la nueva nunca lanza. Salió de `eslint-legacy.json` (142 → 141).
- **CA-3**: el escenario C (crear un producto cuyo proveedor se acaba de borrar) recibía el texto de concurrencia
  **por culpa de este bug**: `createProductAction` no verifica la versión del proveedor, así que lo que falla es la
  clave foránea. Ahora el mensaje correcto es "Una de las entidades relacionadas ya no existe. Por favor, sincroniza
  los datos.", y el spec se actualizó para esperarlo. La corrida del E2E queda para T-6, sobre `db-test`.
- `src/config/` quedó fuera de la cobertura (textos), como ya decía `testing.md`.

### T-6 · E2E sobre `db-test`

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-24 |
| Tamaño       | M         |
| Depende de   | T-4, T-8  |
| Plan         | [`docs/plans/T-6-e2e-db-test.md`](docs/plans/T-6-e2e-db-test.md) |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como dev quiero que el E2E corra contra una base descartable, de forma que nunca toque los datos de
desarrollo.

**Criterios de aceptación**

- [x] **CA-1** · Playwright levanta la app con `.env.test` (`webServer`) y carga un seed mínimo · Estimación: 40 min · Completado: 2026-10-24 18:30

- [x] **CA-2** · 0 reintentos en local y 1 en CI; Chromium por defecto y los tres navegadores en el CI de `main` · Estimación: 10 min · Completado: 2026-10-24 18:30

- [x] **CA-3** · `tests/readme.md` corregido: no menciona scripts inexistentes · Estimación: 5 min · Completado: 2026-10-24 18:30

- [x] **CA-4** · `npm run test:e2e` en verde, con su job en el CI, y la base de desarrollo igual antes y después · Estimación: 30 min · Completado: 2026-10-24 18:30

**Notas de cierre**

- **CA-4**: 79 de 79 tests en verde en Chromium (6 min). Los conteos por tabla de la base de desarrollo quedaron
  iguales antes y después de 5 corridas completas.
- **Decisión**: primero se probó con `next dev`, pero en esta PC fallaban por tiempo 3 a 7 tests distintos en cada
  corrida. Se pasó a `next build` + `next start` (puerto 3100, carpeta `.next-e2e`), que es estable. El spec de
  landing ahora espera la revalidación de ISR (30 s) del catálogo.
- `playwright.config.ts` y `scripts/e2e-prepare.ts` abortan si la URL no es la de `db-test`. `tests/db.setup.ts`
  se borró, y `playwright.config.ts` salió de la lista legacy (141 → 139).
- **Escenario B de concurrencia**: con la suite en paralelo, a veces el aviso de éxito de la venta (que dura 4,5 s) no
  se llegaba a ver, aunque la venta sí se registraba. Ahora espera la venta en la lista. El aviso de éxito lo cubre
  `ventas.spec.ts`.
- **Escenario C**: confirma en el navegador el mensaje correcto de BUG-9.
- `ProductosPage.alternarVisibilidadLanding` espera la condición en vez de `waitForTimeout(500)`.

**Notas**

- Va **antes que T-5** (decisión del dev, 2026-10-24): así el E2E de proveedores de T-5 corre sobre `db-test` y no
  ensucia la base de desarrollo.

### T-7 · Cierre del Sprint 0

| Campo        | Valor              |
| ------------ | ------------------ |
| Estado       | En revisión        |
| Dueño        | Ignacio Tomas      |
| Inicio       | 2026-10-24         |
| Tamaño       | S                  |
| Depende de   | T-5, BUG-1 a BUG-9 |
| Plan         | —                  |
| Merge        | squash en `develop`, `chore(release): sprint 0` en `main`, tag `sprint-0` |
| Horas reales | ≈ 40 min           |

**Historia**: Como dev quiero la documentación al día con lo construido, de forma que el próximo agente arranque
con un contexto verdadero.

**Criterios de aceptación**

- [x] **CA-1** · `README.md` describe el setup real: puertos, `.env`, scripts y tests · Estimación: 20 min · Completado: 2026-10-24 21:40

- [x] **CA-2** · `docs/architecture.md` y `docs/testing.md` sin marcas "(a crear)" para lo que ya existe · Estimación: 10 min · Completado: 2026-10-24 21:40

- [x] **CA-3** · `docs/initial_prompt.md` actualizado · Estimación: 10 min · Completado: 2026-10-24 21:40

- [x] **CA-4** · `npm run verify` en verde sobre `develop`; merge local `develop → main` ("chore(release): sprint 0") con el tag `sprint-0` · Estimación: 20 min · Completado: 2026-10-24 21:40

------------------------------------------------------------------------------------------------------------------------

## Sprint 1 · Vender con el modelo de la empanadería

------------------------------------------------------------------------------------------------------------------------

**Objetivo**: que el local venda con su catálogo real (gustos y bebidas, presentaciones fijas y precio por gusto),
con stock por gusto, el POS del wireframe, 4 medios de pago y la marca Empanadería Isabela, sin restos del modelo de
la casa de celulares.

**Plan del sprint**: [`docs/plans/sprint-1.md`](docs/plans/sprint-1.md). Tiene las decisiones del dev, el orden, el
enfoque de cada ítem, la trazabilidad con [`specs.md`](docs/requerimientos/specs.md) y las preguntas para el
cliente. La tabla de abajo está en orden de ejecución.

**Regla del sprint**: el modelo nuevo se construye en tablas nuevas, en paralelo al heredado. Cada pantalla vieja se
retira cuando la reemplaza su ítem, y T-12 borra el resto. `main` recibe el sprint recién en T-13.

### Resumen del Sprint 1

| #   | ID                                                                              | Título                                                         | Estado      | Depende de | Estimación      |
| --- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------- | ---------- | --------------- |
| 0   | [T-10](#t-10--backlog-de-los-sprints-1-y-2-desde-specsmd)                       | Backlog de los Sprints 1 y 2 desde `specs.md`                  | En revisión | —          | 30 min          |
| 1   | [BUG-12](#bug-12--el-vendedor-puede-pedir-las-estadísticas-del-dashboard)       | El vendedor puede pedir las estadísticas                       | En revisión | T-4        | 25 min          |
| 2   | [BUG-10](#bug-10--scripts-destructivos-que-quedaron-fuera-de-bug-3)             | Scripts destructivos que quedaron fuera de BUG-3               | En revisión | BUG-3      | 40 min          |
| 3   | [T-11](#t-11--el-catálogo-público-se-regenera-sólo-cuando-cambia)               | El catálogo público se regenera sólo cuando cambia             | En revisión | —          | 1 h 5 min       |
| 4   | [US-1](#us-1--la-app-con-la-marca-empanadería-isabela)                          | La app con la marca Empanadería Isabela                        | En revisión | —          | 1 h 50 min      |
| 5   | [US-2](#us-2--menú-por-rol-y-sidebar-más-angosto)                               | Menú por rol y sidebar más angosto                             | En revisión | —          | 1 h 15 min      |
| 6   | [US-3](#us-3--alta-de-productos-gustos-y-bebidas-con-precio-por-presentación)   | Alta de productos: gustos y bebidas con precio por presentación | En revisión | US-2       | 4 h 45 min      |
| 7   | [US-4](#us-4--stock-grilla-ingresar-stock-y-mermas)                             | Stock: grilla, ingresar stock y mermas                         | En revisión | US-3       | 3 h 30 min      |
| 8   | [US-5](#us-5--ventas-tablero-por-comida-y-pedido-actual)                        | Ventas: tablero por comida y pedido actual                     | En revisión | US-4       | 4 h 40 min      |
| 9   | [US-6](#us-6--ventas-cobrar-con-4-medios-de-pago-y-precios-del-servidor)        | Ventas: cobrar con 4 medios de pago y precios del servidor     | En revisión | US-5       | 3 h 50 min      |
| 10  | [US-7](#us-7--ventas-historial-comprobante-y-anulación)                         | Ventas: historial, comprobante y anulación                     | En revisión | US-6       | 2 h 30 min      |
| 11  | [US-15](#us-15--ventas-colores-y-emojis-de-cada-grupo)                          | Ventas: colores y emojis de cada grupo                         | Pendiente   | US-5       | 1 h             |
| 12  | [T-12](#t-12--retirar-el-modelo-heredado-de-la-casa-de-celulares)               | Retirar el modelo heredado de la casa de celulares             | Pendiente   | US-7, T-11 | 3 h 30 min      |
| 13  | [T-13](#t-13--cierre-del-sprint-1)                                              | Cierre del Sprint 1                                            | Pendiente   | todos      | 1 h             |
|     |                                                                                 | **Total del sprint**                                           |             |            | **30 h 30 min** |

### Decisiones del dev para los Sprints 1 y 2 (2026-10-25)

Respuestas a las preguntas de descubrimiento sobre `specs.md`. El detalle y el porqué están en
[`docs/plans/sprint-1.md`](docs/plans/sprint-1.md#decisiones-del-dev-2026-10-25).

| Tema | Decisión |
| --- | --- |
| Grupos | **Fijos en el código**: Empanadas, Pizzas, Sanguches (de miga), Ciabattas, Coca-Cola y Pepsi. Desaparece Categorías |
| Presentaciones | **Fijas**: Empanadas y Sanguches 1, 3, 6 y 12 u; Pizzas de 1 o 2 sabores (siempre entera); Ciabattas y bebidas, por unidad |
| Precio | Empanadas y Ciabattas: **un precio por presentación para todo el grupo**. Sanguches, Pizzas y bebidas: **por gusto** ("Aclaración de precios" de `specs.md`). La pizza de 2 sabores cuesta lo que el sabor más caro |
| Surtidas | Dentro de la misma presentación, con "Agregar uno" y "Completar" (AGREGADO de `specs.md`). En Sanguches se cobra la parte proporcional del precio de cada gusto. Una línea incompleta no se puede cobrar |
| Stock | Por gusto. La pizza mitad y mitad descuenta ½ de cada gusto, y su costo es ½ del costo de cada uno |
| Inicio del vendedor | Ventas/Pedidos |
| Push | Después de cada ítem integrado a `develop`; el merge a `main` espera el OK del dev |
| Comprador | Nombre libre y opcional; vacío se muestra "Sin nombre". La venta deja de exigir un cliente de Clientes |
| Turno | Mañana o tarde según una hora de corte en hora de Argentina. **La hora la consulta el dev con el cliente** |
| Ingresar stock | Cantidad, costo unitario (actualiza el costo del gusto) y proveedor opcional, con historial |
| Mermas y descuentos | Se mantienen los dos; las mermas siguen restando de la ganancia |
| Auditoría | **El vendedor no tiene Auditoría** (el dev corrige la lista de `specs.md`) |
| Pedidos | "Ventas/Pedidos" es el nombre del botón de Ventas, no un concepto nuevo |
| Ventas/Pedidos | Muestra el historial de ventas con toda la información de la grilla. **"Nuevo pedido"** abre el tablero del wireframe y reemplaza a "Nueva Venta" ("Consideraciones del primer sprint" de `specs.md`) |
| Colores y emojis | Cada grupo con su color en el tablero y en el KPI de dinero por comida: Empanadas naranja 🥟, Pizzas amarillo suave 🍕, Ciabattas marrón claro 🥖, Sanguches verde suave 🥪, Coca-Cola rojo 🥤 y Pepsi azul 🥤. Emojis Unicode, no la librería de íconos |
| Base de producción | Ya hay una base real en Supabase. La conecta el dev con su clave en `.env.prod` (`DATABASE_URL`, con SSL); el agente nunca la lee ni corre nada contra ella |
| Gastos | Anotador aislado de facturas: número, título y monto. No afecta Estadísticas |
| Tarjetas | Recargo % por plan de cuotas (1, 3, 6 y 12) |
| Promos | Se arman con grupo + presentación + cantidad; los gustos se eligen al vender |
| ISR | Revalidación a demanda: el catálogo se regenera sólo cuando cambia |
| Datos de producción | Sólo demo: el modelo viejo se puede borrar (se conservan los usuarios) |
| Marca | Empanadería Isabela, con [`logo-empanaderia.jpeg`](docs/wireframes-ventas-gestor/logo-empanaderia.jpeg) |

### T-10 · Backlog de los Sprints 1 y 2 desde `specs.md`

| Campo        | Valor                                              |
| ------------ | -------------------------------------------------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas                                      |
| Inicio       | 2026-10-25                                         |
| Tamaño       | S                                                  |
| Depende de   | —                                                  |
| Plan         | [`docs/plans/sprint-1.md`](docs/plans/sprint-1.md) |
| Merge        | —                                                  |
| Horas reales | —                                                  |

**Historia**: Como dev quiero los pedidos del cliente convertidos en ítems formales, de forma que cada uno se pueda
planificar e implementar sin volver a interpretar `specs.md`.

**Criterios de aceptación**

- [x] **CA-1** · `BACKLOG.md` con los Sprints 1 y 2: cada ítem con historia, CA medibles con estimación, dependencias y preguntas abiertas · Estimación: 15 min · Completado: 2026-10-25 02:44

- [x] **CA-2** · `docs/plans/sprint-1.md` y `docs/plans/sprint-2.md` con las decisiones del dev, el orden, la trazabilidad specs → ítem y las preguntas para el cliente · Estimación: 10 min · Completado: 2026-10-25 02:44

- [x] **CA-3** · `specs.md` y `docs/wireframes-ventas-gestor/` versionados; `docs/initial_prompt.md` §3 y §4 al día · Estimación: 5 min · Completado: 2026-10-25 02:44

**Notas**

- Descubrimiento hecho con el dev el 2026-10-25, sobre `specs.md`, los dos wireframes y el logo.
- **Hallazgos del código** que pasaron a los ítems:
  - `createSale` guarda los precios, costos, totales y pagos que manda el navegador, sin recalcularlos: va en US-6
    CA-2.
  - "Ingresar Stock" crea un producto nuevo (un lote) y el producto no tiene nombre propio: lo reemplazan US-3 y
    US-4.
  - El stock no tiene `CHECK` en la base y puede quedar negativo: va en US-3 CA-1.
  - Estadísticas arranca con todo el historial y arma el día con la hora del servidor: va en US-12 CA-1.
- BUG-11 pasó al Sprint 2: las fotos son del catálogo público, que hoy no es prioridad.

**Actualización** (2026-10-25): el dev sumó a `specs.md` el AGREGADO de surtidas, la regla de Sanguches y Ciabatta,
los gustos del local y la aclaración de precios. Se incorporaron a US-3 (precios del grupo para Empanadas y
Ciabattas, CA-7 nuevo y seed real), US-5 ("Agregar uno" / "Completar", precio proporcional, línea incompleta) y
US-6 (recalcula el proporcional y rechaza líneas incompletas; costo de la mitad y mitad ½ + ½). El Sprint 1 pasa de
28 h 30 min a 29 h 30 min.

### BUG-12 · El vendedor puede pedir las estadísticas del dashboard

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-25 |
| Tamaño       | S         |
| Depende de   | T-4       |
| Plan         | —         |
| Merge        | —         |
| Horas reales | —         |

**Actual**: `fetchDashboardStats` usa `verifyAuthOrAdmin(false)`. `proxy.ts` no deja entrar al vendedor a `/`, pero
la action se puede invocar igual y devuelve ingresos, costos y ganancia. Además, en caso de error devuelve `message`
en vez del campo `error` de `ActionResult`.

**Esperado**: sólo el admin puede pedir las estadísticas, y el error tiene la forma de `ActionResult`.

**Criterios de aceptación**

- [x] **CA-1** · Test de contrato `regression BUG-12`: el vendedor recibe `FORBIDDEN` y el admin recibe los datos · Estimación: 15 min · Completado: 2026-10-25 02:55

- [x] **CA-2** · El error de `fetchDashboardStats` tiene la forma de `ActionResult` · Estimación: 10 min · Completado: 2026-10-25 02:55

**Preguntas resueltas** (`specs.md`, 2026-10-25)

- El vendedor no tiene Estadísticas: sólo el admin ve ingresos, costos y ganancia.

**Notas**

- **CA-1**: `src/features/stats/actions/stats.contract.test.ts`. Antes del fix, el vendedor recibía las estadísticas
  (el test falló); ahora recibe `FORBIDDEN` sin que se lea la base. Sin sesión, `UNAUTHENTICATED`.
- **CA-2**: `fetchDashboardStats` devuelve `ActionResult<DashboardStats>` y arma el error con `toActionFailure`. Un
  error inesperado da `UNEXPECTED` con el mensaje del catálogo, en vez del `message` suelto de antes.
- La pantalla no cambia: ya leía `success` y `data`. `DashboardStatsResult` se borró.

### BUG-10 · Scripts destructivos que quedaron fuera de BUG-3

| Campo        | Valor           |
| ------------ | --------------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-25 |
| Tamaño       | S               |
| Depende de   | BUG-3           |
| Plan         | —               |
| Merge        | —               |
| Horas reales | —               |

**Actual**:
- `src/lib/db/scripts/wipe-db.ts` hace `DROP SCHEMA public CASCADE` sin verificar la URL. Lee sólo `.env` y no
  tiene script npm.
- `db:reset-full` corre `db:generate` en el medio, y puede crear migraciones nuevas en el repo.
- `db:seed-users` pisa la contraseña y el rol de los usuarios que ya existen: contra producción, resetea al admin
  real a `admin`/`admin`.

**Esperado**: `wipe-db` usa la guarda de BUG-3, `reset-full` no genera migraciones y `seed-users` no pisa usuarios
existentes.

**Criterios de aceptación**

- [x] **CA-1** · `wipe-db.ts` usa la guarda de BUG-3, con su test `regression BUG-10` · Estimación: 15 min · Completado: 2026-10-25 03:03

- [x] **CA-2** · `db:reset-full` no ejecuta `db:generate` · Estimación: 5 min · Completado: 2026-10-25 03:03

- [x] **CA-3** · `db:seed-users` sólo crea los usuarios que faltan, con su test · Estimación: 20 min · Completado: 2026-10-25 03:03

**Preguntas abiertas**

- ¿`db:seed-users` tiene que poder correr contra producción para crear la primera cuenta real?

**Notas**

- **CA-1**: `wipe-db.ts` carga el mismo archivo de entorno que la app (`envFileFor`; antes leía un `.env` que no
  existe) y pide la URL a `wipeTargetUrl`, que pasa por la guarda de BUG-3. Tests `regression BUG-10` en
  `wipe-target.test.ts`. Evidencia: con `APP_ENV=production` y con un host remoto falso sale con código 1 y
  "Script destructivo bloqueado…", sin conectarse. Sigue en la lista legacy (usa `pg` y SQL de esquema).
- **CA-2**: los pasos de `reset-full` viven en `reset-steps.ts` (borrar → migrar → datos), con su test.
  Evidencia: `npx dotenv -e .env.test -- npm run db:reset-full` corrió los 3 pasos contra `db-test` y no creó
  migraciones.
- **CA-3**: `usersToCreate` (`seed-missing-users.ts`) devuelve sólo los usuarios iniciales que faltan, con tests y
  un fuzz. `seed-users.ts` se reescribió con las reglas duras y salió de `eslint-legacy.json` (132 → 131).
  Evidencia contra `db-test`: la primera corrida creó `admin` y `vendedor`; después se le cambió el rol al `admin`
  y la segunda corrida no lo tocó ("no se modificó ninguno").
- **Pregunta abierta, sin cambios**: `db:seed-users` no tiene guarda de producción, porque no borra ni pisa nada.
  Si se corre contra producción y falta `admin`, lo crea con la contraseña `admin`: el dev decide si eso se quiere.

### T-11 · El catálogo público se regenera sólo cuando cambia

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-25 |
| Tamaño       | S         |
| Depende de   | —         |
| Plan         | —         |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como dueño quiero que el catálogo público no se regenere cada 30 segundos, de forma que no se gasten
ISR Writes de Vercel cuando no cambió nada.

**Criterios de aceptación**

- [x] **CA-1** · `/home` no exporta `revalidate`; las lecturas del catálogo se cachean con una etiqueta, sin vencimiento por tiempo · Estimación: 20 min · Completado: 2026-10-25 11:09

- [x] **CA-2** · Toda mutación que cambia lo que muestra el catálogo (alta, edición, borrado, visibilidad, fotos, venta y anulación) invalida la etiqueta con un único helper; un test unit verifica que cada action lo llama · Estimación: 20 min · Completado: 2026-10-25 11:09

- [x] **CA-3** · `next build` lista `/home` sin "Revalidate 30s"; `tests/landing.spec.ts` deja de esperar 30 s y ve el cambio al instante · Estimación: 15 min · Completado: 2026-10-25 11:09

- [x] **CA-4** · `docs/architecture.md` (Vista general y Catálogo público) y ADR "Revalidación a demanda del catálogo" · Estimación: 10 min · Completado: 2026-10-25 11:09

**Notas**

- El mecanismo (etiqueta con `revalidateTag`/`updateTag`, `unstable_cache` o `'use cache'`) se decide en el plan
  del ítem con la skill `next-cache-components`.
- El arreglo llega a producción en el cierre del sprint (T-13). Si el dev lo quiere antes, se integra como
  `hotfix/` desde `main` ([`docs/git.md`](docs/git.md)).
- T-12 conecta la invalidación con Alta de productos y Stock, cuando el catálogo pase al modelo nuevo.

**Cierre** (2026-10-25)

- **Decisión del plan** ([ADR 0004](docs/adr/0004-revalidacion-a-demanda-del-catalogo.md)): en vez de etiqueta +
  `unstable_cache`, `revalidatePath('/home')`. Hay una sola página cacheada, así que no hace falta envolver las
  lecturas. CA-1 y CA-2 se cumplen con la ruta en lugar de la etiqueta.
- **CA-1**: `/home` sin `revalidate`. Next la prerenderiza en el build y no vence por tiempo. `/product/[id]` ya era
  dinámica.
- **CA-2**:
  - `src/lib/catalog-cache.ts` (`revalidateCatalog` y `afterCatalogChange`) tiene su test unit.
  - Las actions heredadas usan la base directo, así que la verificación es de integración:
    `src/test/catalog-revalidation-*.int.test.ts` cubre las 13 mutaciones (productos, visibilidad, merma, fotos,
    categorías, venta y anulación). También verifica que una mutación rechazada no invalida.
  - Antes del cambio, los 4 tests fallaron.
  - `src/test/setup/next-cache.setup.ts` simula `next/cache` en unit, integración y mutación, como ya se hacía con
    `next/headers`.
- **CA-3**: `next build` lista `/home` como `○` sin columna de revalidación (antes, `30s 1y`).
  - `landing.spec.ts` se reescribió: el producto nace oculto, se muestra y se oculta desde Productos, y el catálogo
    lo refleja en menos de 10 s (antes se esperaban hasta 90 s).
  - Un producto insertado directo en la base no aparece en el catálogo hasta la próxima mutación.
  - Evidencia: `npm run test:e2e -- tests/landing.spec.ts` contra `db-test`, 3 de 3 en verde (2,3 min, con el
    setup de login).
- **CA-4**: ADR 0004, `docs/architecture.md` (Vista general y Catálogo público) y `tests/readme.md`.

### US-1 · La app con la marca Empanadería Isabela

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-25 |
| Tamaño       | M         |
| Depende de   | —         |
| Plan         | —         |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como dueño quiero que el sistema muestre la marca de mi empanadería, de forma que no queden nombres ni
textos de la casa de celulares.

**Criterios de aceptación**

- [x] **CA-1** · El logo ([`logo-empanaderia.jpeg`](docs/wireframes-ventas-gestor/logo-empanaderia.jpeg)) aparece en el sidebar, el login, el ícono de la pestaña y el comprobante; la metadata dice "Empanadería Isabela", con la descripción en español · Estimación: 30 min · Completado: 2026-10-25 11:38

- [x] **CA-2** · La paleta de la marca (negro, ámbar y crema) queda como tokens en `globals.css` y reemplaza a los `indigo-*` del panel y del login, en claro y oscuro, sin violaciones de contraste de axe en el login y el panel · Estimación: 45 min · Completado: 2026-10-25 11:38

- [x] **CA-3** · El catálogo público queda sin textos de Apple, accesorios ni garantía, y `contact.config.ts` sin el teléfono ni el Instagram del cliente anterior · Estimación: 20 min · Completado: 2026-10-25 11:38

- [x] **CA-4** · Tests de componente del sidebar y del login, con el nombre y el logo · Estimación: 15 min · Completado: 2026-10-25 11:38

**Detalle**

- Hoy dicen "ArgenStock": `app/layout.tsx`, `(main)/layout.tsx`, `home/page.tsx`, `message-generator.ts` y
  `sales-print-view.tsx`. Los textos de Apple están en `home/page.tsx`, `product/[id]/page.tsx`,
  `product-info.tsx`, `home/components/product-card.tsx` y `catalog-grid.tsx`.
- Los textos de "equipo", "modelo" y "lote" de Productos, Categorías y el POS no se tocan acá: esas pantallas las
  reemplazan US-3 a US-7 y T-12. El test que garantiza cero referencias es T-12 CA-5.

**Preguntas abiertas**

- (Cliente) ¿Cuáles son el WhatsApp y el Instagram del local? Mientras tanto, los botones de contacto del catálogo
  no muestran datos del cliente anterior.

**Notas**

- El repo es público: el nombre y el logo del cliente quedan publicados.

**Cierre** (2026-10-25)

- **CA-1**:
  - `BrandLogo` (`src/components/brand/`) con el nombre de `src/config/brand.ts`, en el sidebar, el login y el
    catálogo.
  - El comprobante dice "EMPANADERÍA ISABELA".
  - El ícono de la pestaña es `src/app/icon.png` (más `apple-icon.png`) y el logo,
    `public/brand/logo-isabela.png` (256 px), generados del jpeg con `sharp`. Se borraron los `icon.svg` viejos.
  - La metadata raíz y la del catálogo están en español y con la marca.
  - El logo va en PNG porque `proxy.ts` sólo deja pasar sin sesión `.png`, `.svg` y similares, no `.webp`.
- **CA-2**: tokens `brand-50…950` (ámbar del logo), `ink` y `cream` en `globals.css`.
  - Los `indigo-*` de los 45 archivos de `src/` pasaron a `brand-*`, con un reemplazo mecánico; los colores de
    impresión también.
  - El catálogo y el login usan fondo `cream`.
  - **Desvío**: no hay axe en el repo y no se sumó una dependencia. `src/test/brand-contrast.test.ts` aplica la
    fórmula de contraste WCAG a los 7 pares que usa la UI (botones, menú activo y textos en claro y en oscuro),
    todos ≥ 4,5:1.
- **CA-3**:
  - El catálogo y la ficha de producto quedan sin Apple, accesorios ni garantía. También se cambiaron los
    placeholders de celulares de Proveedores, Categorías, Productos y Mermas.
  - `contact.config.ts` queda sin el teléfono ni el Instagram del cliente anterior, y los botones de contacto no se
    muestran sin datos (`contact.config.test.ts`).
  - Siguen los datos de demo del seed viejo: los reemplaza US-3 y la guarda de texto llega con T-12 CA-5.
- **CA-4**: tests de componente de `BrandLogo`, del login (`login-page.test.tsx`) y del layout del panel
  (`main-layout.test.tsx`).
- **E2E**: los Page Objects buscaban los campos por los placeholders viejos; se actualizaron. `npm run test:e2e` en verde (79 tests).

### US-2 · Menú por rol y sidebar más angosto

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-25 |
| Tamaño       | S         |
| Depende de   | —         |
| Plan         | —         |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como admin o vendedor quiero ver sólo las secciones de mi rol, en el orden del local y con un menú más
angosto, de forma que el área de trabajo sea más grande.

**Criterios de aceptación**

- [x] **CA-1** · El menú y `proxy.ts` salen de una sola lista (ruta, nombre y roles); un test unit verifica que el vendedor ve exactamente Ventas/Pedidos, Stock y Clientes, y el admin, en orden, Estadísticas, Gastos, Stock, Ventas/Pedidos, Promociones, Clientes, Proveedores, Alta de productos, Tarjetas, Usuarios y Auditoría (las que existan) · Estimación: 30 min · Completado: 2026-10-25 11:55

- [x] **CA-2** · "Dashboard" pasa a llamarse "Estadísticas" en el menú y en el título de la página · Estimación: 10 min · Completado: 2026-10-25 11:55

- [x] **CA-3** · El sidebar de escritorio mide 240 px (antes, 320 px), sin textos cortados · Estimación: 15 min · Completado: 2026-10-25 11:55

- [x] **CA-4** · Después del login, el admin va a Estadísticas y el vendedor a Ventas/Pedidos; un vendedor que entra por URL a una sección ajena va a Ventas/Pedidos; el E2E de navegación por rol se actualiza · Estimación: 20 min · Completado: 2026-10-25 11:55

**Detalle**

- Cada sección nueva entra al menú y a `proxy.ts` con su ítem (Gastos en US-14, Stock en US-4, etc.). Productos y
  Categorías siguen en el menú hasta que los retiran US-4 y T-12.
- Hoy el vendedor entra a Productos, Ventas y Clientes, y aterriza en Productos.

**Decisiones del dev** (2026-10-25)

- El vendedor **no** tiene Auditoría, aunque la lista de `specs.md` la incluya: el dev la corrigió.
- El vendedor aterriza en Ventas/Pedidos (dev, 2026-10-25).

**Cierre** (2026-10-25)

- **CA-1**:
  - `src/config/navigation.ts` tiene las secciones y el **orden por rol**: el admin ve Stock antes que Ventas/Pedidos y
    el vendedor al revés, como en `specs.md`. Expone `navigationFor`, `homeFor` y `canVisit`.
  - La usan el sidebar (`sidebar-nav.tsx`, extraído del layout heredado) y `proxy.ts`. `proxy.ts` se reescribió con
    las reglas duras y salió de `eslint-legacy.json` (131 → 130).
  - Tests: `navigation.test.ts` (orden por rol y rutas permitidas), `sidebar-nav.test.tsx` y `proxy.test.ts`, que
    arma pedidos reales con la cookie de sesión.
  - Productos y Categorías siguen en el menú hasta US-4 y T-12.
- **CA-2**: "Dashboard" → "Estadísticas" en el menú y en el título de la pantalla. "Ventas" → "Ventas/Pedidos".
- **CA-3**: sidebar de escritorio `xl:w-[240px]` (antes `xl:w-80`, 320 px en rem: con la fuente base de 17 px, `w-60` daba 255 px) y drawer mobile de 240 px. Se borró el
  selector de impresión viejo (`.lg:w-80`) de `globals.css`. El E2E mide 240 px.
- **CA-4**:
  - El login lleva a `homeFor(rol)`: el admin a Estadísticas y el vendedor a Ventas/Pedidos, igual que `proxy.ts`
    con sesión en `/login`.
  - El vendedor que pide `/`, `/usuarios` o `/logs` va a `/ventas`.
  - E2E nuevo `tests/navegacion.spec.ts`.
- Los íconos de lucide de celulares (`MonitorSmartphone`) se reemplazaron.
- **E2E**: `npm run test:e2e` en verde (81 tests, con `navegacion.spec.ts`).

### US-3 · Alta de productos: gustos y bebidas con precio por presentación

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-25 |
| Tamaño       | L         |
| Depende de   | US-2      |
| Plan         | —         |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como admin quiero dar de alta los gustos de cada comida y las bebidas de Coca-Cola y Pepsi, con su
costo y su precio para cada presentación, de forma que el POS y las estadísticas trabajen con lo que vende el local.

**Criterios de aceptación**

- [x] **CA-1** · Schema nuevo, en paralelo al heredado: gusto o bebida con grupo, nombre, costo unitario, stock (admite medias), activo y `version`, más sus precios por presentación sólo en Sanguches, Pizzas y bebidas; Postgres garantiza `unique(grupo, nombre)`, precio > 0, costo ≥ 0, stock ≥ 0 y los precios que corresponden a cada grupo (tests de tipos e integración) · Estimación: 1 h · Completado: 2026-10-25 12:30

- [x] **CA-2** · El admin crea un gusto o bebida; nombre vacío o de más de 60 caracteres, un precio faltante, de más o ≤ 0 según el grupo → `VALIDATION`; nombre repetido en el grupo → `DUPLICATE`; un test de contrato por fila · Estimación: 45 min · Completado: 2026-10-25 12:30

- [x] **CA-3** · Edita nombre, costo y precios con `version` (`STALE_VERSION`), desactiva y reactiva; borrar uno con ventas → `HAS_RELATIONS` · Estimación: 45 min · Completado: 2026-10-25 12:30

- [x] **CA-4** · El vendedor recibe `FORBIDDEN` y sin sesión `UNAUTHENTICATED`; `/alta-de-productos` es sólo del admin (menú y `proxy.ts`) · Estimación: 20 min · Completado: 2026-10-25 12:30

- [x] **CA-5** · Pantalla agrupada por grupo, con búsqueda y estados de carga, vacío y error, con tests de componente · Estimación: 45 min · Completado: 2026-10-25 12:30

- [x] **CA-6** · Auditoría de cada alta, edición y baja; `docs/features/<f>/README.md` con la tabla de errores; ADR "Grupos y presentaciones fijos, precio del grupo o por gusto"; seed con los gustos reales de `specs.md` y bebidas de demo; mutación ≥ 70 · Estimación: 25 min · Completado: 2026-10-25 12:30

- [x] **CA-7** · El admin edita los precios del grupo de Empanadas (1, 3, 6 y 12 u) y de Ciabattas (unidad), con `version` y auditoría; mientras un grupo no tiene precio cargado, sus gustos no se pueden vender · Estimación: 45 min · Completado: 2026-10-25 12:30

**Detalle**

| Grupo | Presentaciones | Precio | Stock |
| --- | --- | --- | --- |
| Empanadas | 1, 3, 6 y 12 u | Del grupo: todos los gustos igual | Unidades |
| Sanguches (de miga) | 1, 3, 6 y 12 u | Por gusto (Primavera ≠ Jamón y queso) | Unidades |
| Pizzas | Entera (se vende de 1 o 2 sabores) | Por gusto | Pizzas; admite medias |
| Ciabattas | Unidad | Del grupo: todos los gustos igual | Unidades |
| Coca-Cola | Unidad (cada bebida: Coca-Cola 1,5 L, Sprite 500 ml…) | Por bebida | Unidades |
| Pepsi | Unidad | Por bebida | Unidades |

- Los grupos y las presentaciones son fijos en el código: cada grupo tiene reglas propias en el POS.
- Nombres de tablas, feature y ruta: propuestas que se confirman en el plan del ítem. Se copia el molde de
  `provider`.
- El costo del gusto lo actualiza "Ingresar stock" (US-4); acá se carga el inicial.
- Las fotos y la visibilidad en el catálogo público pasan al modelo nuevo en T-12.

**Cierre** (2026-10-25)

- **Modelo** ([ADR 0005](docs/adr/0005-grupos-fijos-y-precio-del-grupo-o-por-gusto.md),
  [README del feature](docs/features/menu/README.md)):
  - Feature nuevo `src/features/menu/`, con el molde de `provider`.
  - Grupos y presentaciones fijos en `domain/menu-groups.ts`.
  - Empanadas y Ciabattas usan el precio del grupo (`menu_group_prices`); Sanguches, Pizzas y bebidas, el precio
    por gusto (columnas de `menu_items`).
- **CA-1**:
  - Migración `0006_menu-items` con `menu_items` y `menu_group_prices`, en `src/lib/db/menu-schema.ts`.
  - `CHECK` de costo ≥ 0, stock ≥ 0 y en medias (sólo Pizzas con medias), y de los precios que corresponden a cada
    grupo, más `unique(menu_group, name)`.
  - Las reglas se probaron contra `db-test` con el seed y con la suite de comportamiento del repositorio, que corre
    contra el fake y contra Drizzle.
  - `menu-schema.ts` puede usar `sql` sólo para los `check()` (`eslint/layers.mjs`) y quedó fuera de la cobertura,
    como `schema.ts`.
- **CA-2 y CA-3**: un test de contrato por fila de la tabla de errores (`UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION`,
  `DUPLICATE`, `STALE_VERSION`, `NOT_FOUND` y `HAS_RELATIONS`), más un fuzz.
  - El caso de borrar con movimientos contra Drizzle queda salteado hasta que US-4 cree la primera tabla que
    referencia a `menu_items`. Contra el fake sí corre.
- **CA-4**: `/alta-de-productos` sólo para el admin, en el menú (después de Proveedores) y en `proxy.ts`.
- **CA-5**: pantalla con las tarjetas de precios de Empanadas y Ciabattas, búsqueda, filtro por grupo, "Ver
  inactivos", tabla y tarjetas.
  - Carga con esqueleto y mensaje de grupo vacío.
  - El formulario muestra sólo los precios del grupo elegido.
  - Tests de componente del panel, los campos, la tarjeta de precios, la grilla y el hook.
- **CA-6**:
  - Auditoría con `entity` `MENU_ITEM` y `MENU_GROUP_PRICES`.
  - Seed (`db:seed`) con los gustos de `specs.md`: 15 de empanadas, 6 pizzas, 2 sanguches y 4 ciabattas, más 8
    bebidas de demo.
  - Mutación: 93,51 en total y 91,76 en `menu`.
- **CA-7**: precios del grupo con `version` (0 = primera carga). Sin precio, la tarjeta avisa "Sin precio:
  todavía no se puede vender".
- `formatMoney` (`src/lib/format-money.ts`) muestra los importes en formato argentino.
- `invalidateAllCaches` suma el store del menú, con su test.
- **Costos**: `fetchMenuItems` le manda el costo en `null` al vendedor (contrato `regression`: el vendedor no recibe
  el costo). Así queda hasta que el cliente responda si el vendedor ve costos (pregunta 2).
- **E2E**: `npm run test:e2e` en verde (81 tests); la prueba de humo abre `/alta-de-productos` con el seed nuevo.

### US-4 · Stock: grilla, ingresar stock y mermas

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-25 |
| Tamaño       | L         |
| Depende de   | US-3      |
| Plan         | —         |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como admin o vendedor quiero ver el stock de cada gusto y bebida y registrar lo que entra, de forma que
el POS sólo ofrezca lo que hay.

**Criterios de aceptación**

- [x] **CA-1** · `/stock` muestra la grilla de los gustos y bebidas activos, agrupados por grupo, con stock y precio de venta; costo y proveedor sólo los ve el admin; estados de carga, vacío y error · Estimación: 45 min · Completado: 2026-10-25 12:58

- [x] **CA-2** · "Ingresar stock" pide gusto, cantidad (entera > 0), costo unitario (≥ 0, actualiza el costo del gusto) y proveedor opcional; suma de forma atómica sin pisar una venta simultánea (test de integración) y queda en un historial de sólo inserción · Estimación: 1 h · Completado: 2026-10-25 12:58

- [x] **CA-3** · Historial de ingresos por gusto: fecha en hora de Argentina, cantidad, costo, proveedor y usuario · Estimación: 30 min · Completado: 2026-10-25 12:58

- [x] **CA-4** · Registrar una merma (sólo admin) pide cantidad ≤ stock y motivo, descuenta el stock y guarda el costo unitario del momento · Estimación: 30 min · Completado: 2026-10-25 12:58

- [x] **CA-5** · Errores por fila con su test de contrato: cantidad ≤ 0 → `VALIDATION`; gusto inexistente → `NOT_FOUND`; merma mayor que el stock → `INSUFFICIENT_STOCK` (código nuevo del catálogo) · Estimación: 30 min · Completado: 2026-10-25 12:58

- [x] **CA-6** · "Stock" reemplaza a "Productos" en el menú de los dos roles; se retiran el panel viejo de `/productos` y su E2E; `docs/features/<f>/README.md` · Estimación: 15 min · Completado: 2026-10-25 12:58

**Detalle**

- Hoy "Ingresar Stock" crea un producto nuevo (un lote) con su proveedor y sus precios. Con el modelo nuevo suma
  unidades a un gusto existente.

**Preguntas abiertas**

- (Cliente, junto con la de BUG-8) ¿El vendedor puede ingresar stock? ¿Ve costos y proveedores? Mientras no
  responda, se mantiene lo de hoy: el vendedor ingresa stock y no ve costos ni proveedores.

**Cierre** (2026-10-25) · [README del feature](docs/features/stock/README.md)

- **CA-1**: `/stock` para los dos roles, con la grilla de gustos y bebidas activos.
  - Búsqueda y filtro por grupo; stock con "Sin stock" en rojo y precio. El costo, sólo para el admin.
  - El vendedor recibe el costo en `null` desde `fetchMenuItems` (ver US-3).
- **CA-2**: tabla `stock_entries` (migración `0007`), de sólo inserción.
  - El ingreso bloquea el gusto con `SELECT … FOR UPDATE` (sin `sql` plano), suma, actualiza el costo y sube la
    `version`, todo en la misma transacción que el historial y la auditoría.
  - `stock.service.int.test.ts`: 5 ingresos y 2 mermas simultáneos dejan exactamente 10 + 10 − 2.
- **CA-3**: historial de los últimos 50 ingresos por gusto, con fecha en hora de Argentina, cantidad, costo,
  proveedor y usuario. Para el vendedor van sin costo ni proveedor.
- **CA-4**: `stock_losses` guarda el costo del momento. Sólo las pizzas admiten media unidad.
- **CA-5**: código nuevo `INSUFFICIENT_STOCK` ("No hay stock suficiente de <gusto>."), además de `VALIDATION`,
  `NOT_FOUND`, `FORBIDDEN` y `UNAUTHENTICATED`, cada uno con su test de contrato.
- **CA-6**: "Stock" reemplaza a "Productos" en el menú de los dos roles; el vendedor ya no puede entrar a
  `/productos`. **Desvío**:
  - El panel viejo de `/productos` y sus E2E siguen, sólo por URL para el admin, y los borra T-12 (su CA-2 ya lo
    incluía).
  - Hasta T-12, el POS viejo vende los productos viejos y `landing.spec.ts` usa ese panel para mostrar y ocultar
    productos del catálogo.
- **Hallazgo corregido**: `db:seed` no borraba los movimientos de stock antes de los gustos y fallaba con stock
  cargado. `clearMenu` ahora los borra primero.
- Con `stock_entries` ya existe una referencia real a `menu_items`, así que el caso "no deja borrar con
  movimientos" de US-3 corre también contra Drizzle.
- El campo de formulario genérico pasó a `src/components/ui/form-field.tsx` y `priceSummary` al dominio de `menu`.
- Mutación 92,57 en total (96,10 en `stock`). `npm run test:e2e` en verde (83 tests, con `tests/stock.spec.ts`).

### US-5 · Ventas: tablero por comida y pedido actual

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-25 |
| Tamaño       | L         |
| Depende de   | US-4      |
| Plan         | —         |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como vendedor quiero armar el pedido tocando una presentación y un gusto en el tablero de cada comida,
de forma que cargar una venta me lleve pocos clics.

**Criterios de aceptación**

- [x] **CA-1** · "Nueva venta" muestra el tablero del wireframe: una subdivisión por grupo (Empanadas, Pizzas, Sanguches, Ciabattas, Coca-Cola y Pepsi), cada una con su ícono, el contador "N en pedido" y un botón por presentación · Estimación: 1 h · Completado: 2026-10-25 13:18

- [x] **CA-2** · Empanadas y Sanguches: tocar 1, 3, 6 o 12 despliega los gustos, y cada uno tiene "Agregar uno" (+1 de ese gusto) y "Completar" (llena lo que falta); la línea se cobra al precio de la presentación (en Empanadas, el del grupo; en Sanguches, la parte proporcional del precio de cada gusto, redondeada a 2 decimales) · Estimación: 1 h · Completado: 2026-10-25 13:18

- [x] **CA-3** · Pizzas: "1 sabor" pide un gusto; "2 sabores" pide dos gustos distintos, cobra el más caro (mozzarella $10 + J&Q $5 = $10) y consume ½ de cada uno · Estimación: 45 min · Completado: 2026-10-25 13:18

- [x] **CA-4** · Ciabattas: se elige 1 sabor y suma 1 unidad, al precio del grupo; Coca-Cola y Pepsi despliegan con un clic las bebidas de esa marca con stock y suman 1 u · Estimación: 30 min · Completado: 2026-10-25 13:18

- [x] **CA-5** · "Pedido actual" muestra comida, cantidad, unidades e importe, con quitar línea, vaciar y total; una línea incompleta muestra "faltan N" y deshabilita Cobrar; no se ofrece un gusto sin stock suficiente, contando lo que ya está en el pedido · Estimación: 45 min · Completado: 2026-10-25 13:18

- [x] **CA-6** · Campo "Comprador" opcional, de hasta 60 caracteres; vacío se muestra "Sin nombre" · Estimación: 10 min · Completado: 2026-10-25 13:18

- [x] **CA-7** · Las reglas del pedido son funciones puras del `domain` con tests unit y fuzz (mitad y mitad = el más caro, unidades por presentación, stock disponible), más tests de componente del tablero · Estimación: 30 min · Completado: 2026-10-25 13:18

**Detalle**

- Wireframes: [`venta_vista_general.png`](docs/wireframes-ventas-gestor/venta_vista_general.png) y
  [`venta_vista_panel_desplegable_gustos.png`](docs/wireframes-ventas-gestor/venta_vista_panel_desplegable_gustos.png).
  Las presentaciones del wireframe se reemplazan por las decididas por el dev (Pizzas: 1 o 2 sabores; Sanguches: 1,
  3, 6 y 12 u). El botón "Combo + bebida" del wireframe no entra: lo cubren las promos (US-9).
- Regla del cliente: en una presentación de más de 1 unidad, el gusto elegido se aplica a toda la cantidad.
- Este ítem no cobra ni guarda nada: lo hace US-6. La subdivisión Promos llega con US-9.

**Decisiones del dev** (2026-10-25)

- Surtidas con "Agregar uno" y "Completar" (AGREGADO de `specs.md`): ½ docena → +1 carne, +1 carne y completar
  con pollo = 2 carne + 4 pollo.
- Precio proporcional de una surtida: Σ (unidades del gusto ÷ unidades de la presentación × precio de esa
  presentación del gusto). En Empanadas da siempre el precio del grupo.
- La pizza mitad y mitad cuesta ½ del costo de cada gusto (ejemplo: $2.000 + $1.500 = $3.500).

**Cierre** (2026-10-25) · [README del feature](docs/features/order/README.md)

- **CA-1**: `/ventas/nueva` muestra el tablero del wireframe.
  - Una subdivisión por grupo con ícono, "N en pedido" y un botón por presentación, con el precio del grupo o
    "desde $X".
  - Avisa si el grupo no tiene gustos o le falta el precio del grupo.
  - **Desvío**: en US-5 se entra desde "Tablero de ventas", en la lista de Ventas. "Nueva Venta" sigue abriendo el
    POS viejo hasta que US-6 lo reemplace, porque el cobro llega en US-6.
- **CA-2**: Empanadas y Sanguches con "Agregar uno" y "Completar" (AGREGADO de `specs.md`).
  - Las surtidas se arman dentro de la misma presentación.
  - Precio: el del grupo en Empanadas y el proporcional por gusto en Sanguches.
- **CA-3**: pizza de 1 sabor, o de 2 sabores distintos al precio del más caro, consumiendo ½ de cada uno.
- **CA-4**: Ciabattas y bebidas de Coca-Cola y Pepsi de a una unidad.
- **CA-5**:
  - El pedido actual muestra comida, cantidad, unidades, importe y total; se puede quitar una línea o vaciar.
  - Las líneas iguales se suman.
  - Una línea a medio armar muestra "faltan N" (o "falta el segundo sabor") y bloquea Cobrar.
  - La lista de gustos descuenta del stock lo que ya está en el pedido.
- **CA-6**: comprador opcional, de hasta 60 caracteres, con "Sin nombre" de placeholder.
- **CA-7**: reglas puras en `order/domain` con unit y fuzz, store con tests y componentes con tests.
  - E2E `tests/tablero-ventas.spec.ts`: ½ docena surtida ($6.500) + pizza Muzza/Napolitana ($12.000) = $18.500,
    con el seed real.
- Mutación 91,48 en total (89,49 en `order`).
- `npm run test:e2e` en verde (85 passed).

### US-6 · Ventas: cobrar con 4 medios de pago y precios del servidor

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-25 |
| Tamaño       | L         |
| Depende de   | US-5      |
| Plan         | —         |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como vendedor quiero cobrar el pedido en efectivo, transferencia, débito o crédito, de forma que la
venta quede registrada con su comprador y descuente el stock.

**Criterios de aceptación**

- [x] **CA-1** · Medios de pago Efectivo, Transferencia, Débito y Crédito (enum y migración); se mantiene el máximo de 2 pagos con medios distintos · Estimación: 30 min · Completado: 2026-10-25 15:13

- [x] **CA-2** · El servidor recalcula precios (incluido el proporcional de las surtidas), costos y total desde la base: un valor adulterado desde el navegador se ignora (test de contrato); si los pagos no suman el total o hay una línea incompleta → `VALIDATION` · Estimación: 1 h · Completado: 2026-10-25 15:13

- [x] **CA-3** · La venta guarda vendedor, fecha y hora en UTC, comprador (o vacío), las líneas con lo cobrado y lo que consume de cada gusto con su costo congelado (mitad y mitad: ½ del costo de cada uno) · Estimación: 45 min · Completado: 2026-10-25 15:13

- [x] **CA-4** · Descuenta el stock de forma atómica; si un gusto no alcanza → `INSUFFICIENT_STOCK` con el nombre del gusto y no se registra nada (test de integración con dos ventas simultáneas) · Estimación: 45 min · Completado: 2026-10-25 15:13

- [x] **CA-5** · Se mantienen los descuentos actuales (porcentaje y monto) sobre el total · Estimación: 20 min · Completado: 2026-10-25 15:13

- [x] **CA-6** · Auditoría, `docs/features/<f>/README.md` y E2E del flujo crítico: armar el pedido, cobrar y ver el stock descontado · Estimación: 30 min · Completado: 2026-10-25 15:13

**Detalle**

- Hoy `createSale` guarda los precios, costos, totales y pagos que manda el navegador, y sólo la UI controla que los
  pagos sumen el total. CA-2 lo corrige para el POS nuevo.
- La venta deja de exigir un cliente de Clientes ("Mostrador"): el comprador es un nombre libre y opcional.
- En Crédito sólo se registra el medio. La tarjeta, las cuotas y el recargo llegan con US-11.

**Cierre** (2026-10-25) · [README del feature](docs/features/order/README.md)

- **CA-1**:
  - El enum `payment_type` suma `debito` y `credito` (migración `0008_sales-lines-and-payments`).
  - El modal de cobro ofrece Efectivo, Transferencia, Débito y Crédito, hasta 2 y distintos. Con dos medios, el
    segundo se lleva el resto.
- **CA-2**:
  - El navegador manda sólo el pedido, el comprador, el descuento y los pagos: `checkoutSchema` es `strictObject` y
    rechaza precios, costos o total.
  - El servidor recalcula los precios desde la base con las mismas funciones del tablero (`unitLinePrice`,
    `linePrice`, incluido el proporcional de las surtidas).
  - Pagos que no suman, una línea incompleta, un gusto de otro grupo o dado de baja, y un grupo sin precio →
    `VALIDATION`.
  - Tests de contrato en `checkout.contract.test.ts`, con fuzz.
- **CA-3**:
  - `sales` suma `buyer_name`; la venta ya no exige un cliente.
  - Tablas nuevas `sale_lines` (lo cobrado por línea y la descripción de sus gustos) y `sale_line_items` (lo que
    consume de cada gusto con el costo congelado; la mitad y mitad guarda 0,5 de cada uno).
- **CA-4**:
  - Se bloquean los gustos con `FOR UPDATE`, de a uno y ordenados por id.
  - Se controla todo el stock antes de descontar, y se guarda por `id` y `version`.
  - Si un gusto no alcanza → `INSUFFICIENT_STOCK` con su nombre, y no se registra nada.
  - Test de integración con dos cobros simultáneos de la última unidad: uno gana y el otro recibe el error.
- **CA-5**: primero el porcentaje y después el monto, en la pantalla y en el servidor (`applyDiscount`).
- **CA-6**:
  - Auditoría `CREAR` / `SALE`.
  - README del feature con la tabla de errores.
  - E2E `tests/cobro.spec.ts`: ½ docena surtida + pizza mitad y mitad ($20.500), cobro con efectivo y débito, y el
    stock descontado en `/stock` (46, 44, 3,5 y 3,5).
- **Desvío temporal, hasta US-7**: las ventas nuevas aparecen en el historial viejo de `/ventas` sin el detalle de
  las líneas, y anularlas desde ahí no repone el stock nuevo. US-7 reemplaza ese historial.
- Al terminar un cobro, o si falla, el tablero vuelve a leer precios y stock.

### US-7 · Ventas: historial, comprobante y anulación

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | En revisión |
| Dueño        | Ignacio Tomas |
| Inicio       | 2026-10-25 |
| Tamaño       | M         |
| Depende de   | US-6      |
| Plan         | —         |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como admin o vendedor quiero ver las ventas registradas e imprimir su comprobante, y como admin anular
una venta, de forma que los errores de carga se corrijan y el stock vuelva.

**Criterios de aceptación**

- [x] **CA-1** · Ventas/Pedidos muestra el historial con toda la información de la grilla actual (fecha y hora de Argentina, comprador o "Sin nombre", vendedor, medios de pago, descuento e importe), con filtro por fechas y búsqueda. El botón "Nueva Venta" del POS viejo se reemplaza por **"Nuevo pedido"**, que abre el tablero del wireframe · Estimación: 45 min · Completado: 2026-10-25 15:47

- [x] **CA-2** · Comprobante imprimible con la marca y las líneas del pedido (gustos y pizzas mitad y mitad) · Estimación: 30 min · Completado: 2026-10-25 15:47

- [x] **CA-3** · Anular (sólo admin) repone el stock exacto, también las medias pizzas, y una venta no se puede anular dos veces · Estimación: 45 min · Completado: 2026-10-25 15:47

- [x] **CA-4** · Contrato: el vendedor que anula → `FORBIDDEN`; una venta inexistente → `NOT_FOUND`; README y E2E de anulación actualizados · Estimación: 30 min · Completado: 2026-10-25 15:47

**Cierre** (2026-10-25) · [README del feature](docs/features/order/README.md)

- **CA-1**:
  - Ventas/Pedidos (`/ventas`) es el historial nuevo, con:
    - fecha y hora de Argentina;
    - comprador ("Sin nombre" si no hay) y vendedor;
    - el pedido, los medios de pago, el descuento y el total;
    - búsqueda por comprador o vendedor y filtro por días de Argentina.
  - "Nuevo pedido" abre el tablero y reemplaza a "Nueva Venta" y al link provisorio "Tablero de ventas".
  - Muestra sólo las ventas del modelo nuevo.
- **CA-2**: comprobante imprimible con:
  - la marca, comprador y vendedor;
  - cada línea con su presentación y sus gustos (también la mitad y mitad);
  - subtotal, descuentos, total y cada pago.
- **CA-3**: anular (sólo admin):
  - bloquea la venta y repone el stock exacto desde lo que guardó el cobro (la mitad y mitad devuelve ½ de cada gusto);
  - borra la venta y audita `ELIMINAR` / `SALE`.
  - Integración: dos anulaciones simultáneas → una anula y la otra recibe `NOT_FOUND`, sin reponer dos veces.
- **CA-4**:
  - Contrato: el vendedor que anula → `FORBIDDEN`; una venta inexistente → `NOT_FOUND`; un id inválido →
    `VALIDATION`; fuzz.
  - E2E `tests/historial-ventas.spec.ts`: "Nuevo pedido", cobro, la venta en la grilla, el comprobante y la
    anulación con el stock repuesto en `/stock`.
- Migración `0009_sale-lines-position`: las líneas guardan su orden para el comprobante.
- **Retiro del POS viejo**:
  - Se borraron el feature `sale` completo, `sales-panel.tsx`, la grilla y la tarjeta de ventas viejas, y el store de
    ventas.
  - También salieron los `TEST_IDS` de ventas, `ventas.spec.ts`, `VentasPage.ts`, el escenario B de
    `concurrencia.spec.ts` y `catalog-revalidation-sales.int.test.ts`.
  - `eslint-legacy.json` bajó de 130 a 116 archivos.
  - La regresión de BUG-6 (sin `password_hash`) ahora cubre el historial nuevo.

### US-15 · Ventas: colores y emojis de cada grupo

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | S         |
| Depende de   | US-5      |
| Plan         | —         |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como vendedor quiero que cada grupo del tablero tenga su color y su emoji, de forma que lo encuentre de
un vistazo.

**Criterios de aceptación**

- [ ] **CA-1** · Cada subdivisión del tablero se rellena con el color de su grupo, en un tono suave: Empanadas naranja, Pizzas amarillo suave, Ciabattas marrón claro (tostado), Sanguches verde suave, Coca-Cola rojo y Pepsi azul. Funciona en modo claro y oscuro, y el texto cumple contraste WCAG AA (test) · Estimación: 30 min · Completado: —

- [ ] **CA-2** · El ícono de cada grupo pasa a un emoji Unicode, en lugar de la librería de íconos: 🥟 Empanadas, 🍕 Pizzas, 🥖 Ciabattas, 🥪 Sanguches, 🥤 Coca-Cola y 🥤 Pepsi · Estimación: 15 min · Completado: —

- [ ] **CA-3** · Colores y emojis se definen en un solo lugar, para que el KPI de dinero por comida (US-12) use los mismos; tests de componente y E2E del tablero en verde · Estimación: 15 min · Completado: —

**Detalle**

- Pedido del dev en "Consideraciones del primer sprint" de `specs.md`, para el tablero de Ventas y para el KPI de
  dinero por comida de Estadísticas.

### T-12 · Retirar el modelo heredado de la casa de celulares

| Campo        | Valor      |
| ------------ | ---------- |
| Estado       | Pendiente  |
| Dueño        | —          |
| Inicio       | —          |
| Tamaño       | L          |
| Depende de   | US-7, T-11 |
| Plan         | —          |
| Merge        | —          |
| Horas reales | —          |

**Historia**: Como dev quiero borrar las tablas, pantallas y datos del modelo viejo, de forma que quede un solo
modelo y nada de código muerto.

**Criterios de aceptación**

- [ ] **CA-1** · Una migración elimina `devices`, el `products` viejo y `sale_items`; las fotos (y las mermas, si quedaran) apuntan al modelo nuevo · Estimación: 45 min · Completado: —

- [ ] **CA-2** · Se borran la pantalla Categorías, el feature `device`, el POS viejo y el panel viejo de productos; `eslint-legacy.json` se achica · Estimación: 45 min · Completado: —

- [ ] **CA-3** · Las estadísticas actuales calculan con el modelo nuevo, con los mismos totales sobre datos sembrados · Estimación: 30 min · Completado: —

- [ ] **CA-4** · El catálogo público muestra los gustos y bebidas visibles del modelo nuevo, y Alta de productos y Stock invalidan su caché (T-11) · Estimación: 45 min · Completado: —

- [ ] **CA-5** · `db:seed`, el stress test y el seed del E2E sólo tienen datos de la empanadería; un test falla si aparecen "ArgenStock", "iPhone", "Apple", "accesorio", "celular" o "equipo" como texto en `src/` · Estimación: 30 min · Completado: —

- [ ] **CA-6** · `npm run verify` y `npm run test:e2e` en verde · Estimación: 15 min · Completado: —

**Notas**

- Producción sólo tiene datos de demo (dev, 2026-10-25): el modelo viejo se borra sin migrar datos. Los usuarios se
  conservan.

### T-13 · Cierre del Sprint 1

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | S         |
| Depende de   | todos     |
| Plan         | —         |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como dev quiero la documentación al día y el sprint integrado en `main`, de forma que el cliente vea
lo construido y el próximo agente arranque con un contexto verdadero.

**Criterios de aceptación**

- [ ] **CA-1** · `README.md` (módulos y rutas), `docs/architecture.md` (Vista general y Datos) y `docs/initial_prompt.md` al día · Estimación: 30 min · Completado: —

- [ ] **CA-2** · `npm run verify` en verde sobre `develop`; con el OK del dev, merge local `develop → main` ("chore(release): sprint 1") con el tag `sprint-1` · Estimación: 30 min · Completado: —

**Notas**

- Producción: ya hay una base real en Supabase ("Consideraciones del primer sprint" de `specs.md`). La app ya la
  soporta (`APP_ENV=production`, `DATABASE_URL` en `.env.prod`, con SSL). Cargar la clave y correr las migraciones
  contra esa base lo hace el dev; el agente nunca lee `.env.prod` ni corre nada con `APP_ENV=production`.

------------------------------------------------------------------------------------------------------------------------

## Sprint 2 · Promociones, tarjetas, estadísticas y gastos

------------------------------------------------------------------------------------------------------------------------

**Objetivo**: vender promociones y en cuotas con recargo, ver las estadísticas del día que pidió el cliente y anotar
los gastos.

**Plan del sprint**: [`docs/plans/sprint-2.md`](docs/plans/sprint-2.md), **en borrador**: se revisa al cerrar el
Sprint 1. El orden pone primero lo que cambia la venta (promos y tarjetas) y después las estadísticas que la leen.

### Resumen del Sprint 2

| #   | ID                                                                               | Título                                                      | Estado    | Depende de  | Estimación      |
| --- | -------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------- | ----------- | --------------- |
| 0   | [US-8](#us-8--promociones-armar-promos-con-precio-de-rebaja)                     | Promociones: armar promos con precio de rebaja              | Pendiente | T-13        | 2 h 45 min      |
| 1   | [US-9](#us-9--ventas-subdivisión-promos)                                         | Ventas: subdivisión Promos                                  | Pendiente | US-8        | 3 h             |
| 2   | [US-10](#us-10--tarjetas-tarjetas-aceptadas-y-planes-de-cuotas-con-recargo)      | Tarjetas: tarjetas aceptadas y planes de cuotas con recargo | Pendiente | T-13        | 2 h             |
| 3   | [US-11](#us-11--ventas-cobrar-con-crédito-en-cuotas)                             | Ventas: cobrar con crédito en cuotas                        | Pendiente | US-10       | 2 h             |
| 4   | [US-12](#us-12--estadísticas-del-día-dinero-por-comida-ganancia-y-ventas)        | Estadísticas del día: dinero por comida, ganancia y ventas  | Pendiente | US-9, US-11 | 2 h 30 min      |
| 5   | [US-13](#us-13--estadísticas-cuadros-de-vendedores-y-de-ventas)                  | Estadísticas: cuadros de vendedores y de ventas             | Pendiente | US-12       | 2 h             |
| 6   | [US-14](#us-14--gastos-anotador-de-facturas)                                     | Gastos: anotador de facturas                                | Pendiente | T-13        | 2 h             |
| 7   | [BUG-11](#bug-11--la-subida-de-fotos-no-valida-antes-de-subir)                   | La subida de fotos no valida antes de subir                 | Pendiente | BUG-1       | 55 min          |
| 8   | [T-14](#t-14--cierre-del-sprint-2)                                               | Cierre del Sprint 2                                         | Pendiente | todos       | 1 h             |
|     |                                                                                  | **Total del sprint**                                        |           |             | **18 h 10 min** |

### US-8 · Promociones: armar promos con precio de rebaja

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | M         |
| Depende de   | T-13      |
| Plan         | —         |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como admin quiero armar promociones que combinen productos distintos con un precio rebajado, de forma
que el vendedor las ofrezca desde Ventas.

**Criterios de aceptación**

- [ ] **CA-1** · Una promo tiene nombre único (hasta 60 caracteres) y uno o más componentes de grupo + presentación + cantidad (por ejemplo, 12 empanadas + 1 Coca-Cola); los gustos y la bebida se eligen al vender · Estimación: 45 min · Completado: —

- [ ] **CA-2** · Al armarla se ve la lista de componentes con el precio de referencia de cada uno y el total sin rebaja, y el admin escribe a mano el precio de la promo (> 0) · Estimación: 45 min · Completado: —

- [ ] **CA-3** · Al guardarla queda activa y disponible en Ventas; se edita con `version` y se desactiva · Estimación: 30 min · Completado: —

- [ ] **CA-4** · Errores por fila con su test de contrato (sin componentes, precio ≤ 0, nombre duplicado, `STALE_VERSION`, vendedor → `FORBIDDEN`); "Promociones" en el menú sólo del admin; README · Estimación: 45 min · Completado: —

**Detalle**

- `specs.md`: "Finalmente, una vez agregada, esta va seleccionada". Se interpreta como que la promo guardada queda
  activa y disponible en Ventas; se confirma con el dev en `start-task`.

**Preguntas abiertas**

- (Cliente) ¿Qué precio de referencia se muestra para un componente cuyo gusto se elige al vender? La propuesta es
  el rango mínimo–máximo de esa presentación.
- (Cliente) ¿Las promos tienen vigencia (fechas o días de la semana)?

### US-9 · Ventas: subdivisión Promos

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | M         |
| Depende de   | US-8      |
| Plan         | —         |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como vendedor quiero elegir una promo, completar sus gustos y sumarla al pedido, de forma que se cobre
el precio rebajado.

**Criterios de aceptación**

- [ ] **CA-1** · La subdivisión Promos despliega con un clic las promos activas con su precio; elegir una pide los gustos o las bebidas de cada componente, sólo entre los que tienen stock · Estimación: 1 h · Completado: —

- [ ] **CA-2** · La promo se suma al pedido como una línea con su precio, y se pueden agregar varias, iguales o distintas · Estimación: 30 min · Completado: —

- [ ] **CA-3** · Al cobrar, el servidor valida la promo (activa, componentes completos) y recalcula su precio; descuenta el stock de cada componente con su costo congelado · Estimación: 1 h · Completado: —

- [ ] **CA-4** · Errores con su test de contrato (promo inactiva, componentes incompletos, stock insuficiente) y E2E de una venta con promo · Estimación: 30 min · Completado: —

### US-10 · Tarjetas: tarjetas aceptadas y planes de cuotas con recargo

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | M         |
| Depende de   | T-13      |
| Plan         | —         |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como admin quiero dar de alta las tarjetas que acepta el local con sus cuotas y el recargo de cada
plan, de forma que el vendedor cobre en cuotas con el importe correcto.

**Criterios de aceptación**

- [ ] **CA-1** · Una tarjeta tiene nombre único (hasta 40 caracteres) y uno o más planes de 1, 3, 6 o 12 cuotas, cada uno con un recargo de 0 a 100 % con 2 decimales; las restricciones van en el schema · Estimación: 45 min · Completado: —

- [ ] **CA-2** · Alta, edición con `version` y desactivación, con errores por fila y su test de contrato; "Tarjetas" en el menú sólo del admin · Estimación: 1 h · Completado: —

- [ ] **CA-3** · Auditoría de cada cambio y README · Estimación: 15 min · Completado: —

### US-11 · Ventas: cobrar con crédito en cuotas

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | M         |
| Depende de   | US-10     |
| Plan         | —         |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como vendedor quiero elegir la tarjeta y las cuotas al cobrar con crédito, de forma que se aplique el
recargo del plan.

**Criterios de aceptación**

- [ ] **CA-1** · Al elegir Crédito se elige una tarjeta activa y uno de sus planes; el pago suma el recargo y el importe final se ve antes de confirmar · Estimación: 45 min · Completado: —

- [ ] **CA-2** · El servidor recalcula el recargo desde la tarjeta (ignora el del navegador) y guarda tarjeta, cuotas, porcentaje y monto del recargo · Estimación: 45 min · Completado: —

- [ ] **CA-3** · Una tarjeta o un plan inexistente o inactivo da error con su test de contrato; el comprobante y el historial muestran la tarjeta y las cuotas · Estimación: 30 min · Completado: —

**Preguntas abiertas**

- (Cliente) ¿El recargo cuenta como ingreso y como ganancia en Estadísticas?
- (Cliente) ¿El pago con Débito también pide elegir la tarjeta?

### US-12 · Estadísticas del día: dinero por comida, ganancia y ventas

| Campo        | Valor       |
| ------------ | ----------- |
| Estado       | Pendiente   |
| Dueño        | —           |
| Inicio       | —           |
| Tamaño       | M           |
| Depende de   | US-9, US-11 |
| Plan         | —           |
| Merge        | —           |
| Horas reales | —           |

**Historia**: Como admin quiero ver cuánto generó cada comida y bebida, la ganancia en limpio y la cantidad de ventas
del día, de forma que sepa cómo cerró la jornada.

**Criterios de aceptación**

- [ ] **CA-1** · Estadísticas abre con el día de hoy en hora de Argentina y un calendario para elegir otro día; los límites del día se calculan en `America/Argentina/Buenos_Aires` · Estimación: 45 min · Completado: —

- [ ] **CA-2** · KPI de dinero generado por Empanadas, Pizzas, Ciabattas, Sándwiches de miga, Coca-Cola y Pepsi, cada cuadro relleno con el color de su grupo (US-15) · Estimación: 45 min · Completado: —

- [ ] **CA-3** · KPI de ganancia en limpio = ventas − costo congelado de lo vendido − mermas (ejemplo del cliente: comprada a $10 y vendida a $30 → $20) · Estimación: 30 min · Completado: —

- [ ] **CA-4** · KPI de ventas registradas; estados de carga, día sin ventas y error; tests sobre datos sembrados · Estimación: 30 min · Completado: —

**Detalle**

- Hoy Estadísticas (ex Dashboard) arranca con todo el historial y arma el día con la hora del servidor (brecha de
  fechas de `docs/architecture.md`). CA-1 lo corrige.

**Preguntas abiertas**

- (Cliente) ¿Cómo se reparte el precio de una promo en los KPI por comida? La propuesta es en proporción a los
  precios de lista de sus componentes.
- (Cliente) ¿Se conservan los KPI de hoy que no nombró (efectivo y transferencia, valor del stock, mermas,
  unidades)? Mientras no responda, quedan debajo de los nuevos.

### US-13 · Estadísticas: cuadros de vendedores y de ventas

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | M         |
| Depende de   | US-12     |
| Plan         | —         |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como admin quiero ver debajo de las estadísticas el rendimiento de cada vendedor por turno y la lista
de ventas del día, de forma que sepa quién vendió cuánto y cuándo.

**Criterios de aceptación**

- [ ] **CA-1** · Cuadro de vendedores: vendedor, turno (mañana o tarde según la hora de corte, en hora de Argentina), número de ventas e importe · Estimación: 1 h · Completado: —

- [ ] **CA-2** · Cuadro de ventas: comprador ("Sin nombre" si no hay), hora en Argentina e importe, ordenado por hora · Estimación: 45 min · Completado: —

- [ ] **CA-3** · Tests unit de la regla del turno con valores frontera (justo antes y justo después del corte) · Estimación: 15 min · Completado: —

**Preguntas abiertas**

- (Cliente, **bloquea CA-1 y CA-3**) ¿A qué hora termina el turno mañana y empieza el turno tarde?

### US-14 · Gastos: anotador de facturas

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | M         |
| Depende de   | T-13      |
| Plan         | —         |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como admin quiero anotar las facturas de gastos con su número, título y monto, de forma que tenga un
registro aparte de lo que se gasta.

**Criterios de aceptación**

- [ ] **CA-1** · Alta de un gasto con número de factura (texto de hasta 30 caracteres), título (hasta 100) y monto (> 0, con 2 decimales); la fecha de carga es automática · Estimación: 45 min · Completado: —

- [ ] **CA-2** · Lista ordenada por fecha con búsqueda; editar con `version` y borrar · Estimación: 45 min · Completado: —

- [ ] **CA-3** · Un test demuestra que los gastos no cambian Estadísticas; sólo el admin (menú y `proxy.ts`); errores por fila con su test de contrato; auditoría y README · Estimación: 30 min · Completado: —

**Preguntas abiertas**

- (Cliente) ¿Se adjunta una foto de la factura?
- (Cliente) ¿El número de factura es único?
- (Cliente) ¿Hace falta la fecha de la factura, además de la de carga?

### BUG-11 · La subida de fotos no valida antes de subir

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | S         |
| Depende de   | BUG-1     |
| Plan         | —         |
| Merge        | —         |
| Horas reales | —         |

**Actual**:
- `uploadProductPhoto` sube a Cloudinary antes de comprobar que el producto existe. Si después falla el insert, la
  imagen queda huérfana en Cloudinary.
- No limita el tamaño ni el tipo del archivo, y Cloudinary acepta también URLs.
- Subir y borrar fotos no quedan en la auditoría.

**Esperado**: se valida el producto, el tipo y el tamaño antes de subir; si falla el insert, se borra la imagen;
subir y borrar quedan auditados.

**Criterios de aceptación**

- [ ] **CA-1** · Se rechazan un producto inexistente, un tipo no permitido y un archivo demasiado grande, sin llamar a Cloudinary (test de contrato con un fake) · Estimación: 25 min · Completado: —

- [ ] **CA-2** · Si falla el insert, la imagen se borra de Cloudinary · Estimación: 15 min · Completado: —

- [ ] **CA-3** · Subir y borrar una foto registran auditoría · Estimación: 15 min · Completado: —

**Preguntas abiertas**

- ¿Qué tamaño máximo y qué formatos se aceptan?

### T-14 · Cierre del Sprint 2

| Campo        | Valor     |
| ------------ | --------- |
| Estado       | Pendiente |
| Dueño        | —         |
| Inicio       | —         |
| Tamaño       | S         |
| Depende de   | todos     |
| Plan         | —         |
| Merge        | —         |
| Horas reales | —         |

**Historia**: Como dev quiero la documentación al día y el sprint integrado en `main`, de forma que el cliente vea
lo construido y el próximo agente arranque con un contexto verdadero.

**Criterios de aceptación**

- [ ] **CA-1** · `README.md`, `docs/architecture.md` y `docs/initial_prompt.md` al día · Estimación: 30 min · Completado: —

- [ ] **CA-2** · `npm run verify` en verde sobre `develop`; con el OK del dev, merge local `develop → main` ("chore(release): sprint 2") con el tag `sprint-2` · Estimación: 30 min · Completado: —

# AGENTS.md — reglas para agentes de IA (y humanos)

Fuente **canónica** de reglas del repo. `CLAUDE.md` (Claude Code). Si una regla cambia, se cambia **acá** y en el doc detallado que corresponda.

## Contexto

Sistema de gestión de stock de comida para la empanadería de mi cliente. El backlog vigente está en [`BACKLOG.md`](BACKLOG.md) y los
requerimientos del cliente, textuales, en [`docs/requerimientos/specs.md`](docs/requerimientos/specs.md). Idioma: **docs, commits y UI en español; código en inglés**.

## Antes de tocar código (obligatorio)

1. Leé [`docs/workflow.md`](docs/workflow.md) y seguilo paso a paso (skill `start-task`).
2. Identificá el ítem de `BACKLOG.md`. Si no existe, **no se programa**: se agrega primero.
3. Hacé las **preguntas de descubrimiento** al dev (lista en `docs/workflow.md` §2). No asumas reglas de negocio:
   si algo no está en la US ni en `docs/features/`, se pregunta.
4. Escribí el plan en `docs/plans/<ID>-<slug>.md` (plantilla `docs/templates/plan.md`) y esperá aprobación.

## Reglas duras (el lint/CI las hace cumplir)

| Regla | Detalle |
|---|---|
| Tope de líneas | **100 líneas físicas por archivo de código** (`.ts/.tsx/.js/.mjs/.css`, tests incluidos). Funciones ≤ 40 líneas, ≤ 3 parámetros (usar objeto). No aplica a `.md`/JSON/YAML. |
| Comentarios | **Cero**. El código se explica solo. Única excepción: en español y sólo cuando el código no puede expresar el *por qué*. |
| Tipado | Sin `any`, sin `!` (non-null), sin `as` salvo en fronteras ya validadas. Tipos de retorno explícitos en exports. Ausencia = `T \| null` explícito. |
| Capas | `ui → actions → service → repository → db`. Nunca saltear ni invertir. Sólo el repositorio toca Drizzle. Detalle en `docs/architecture.md`. |
| SQL | **Prohibido SQL plano** (`sql\`\``, `pg` directo). Siempre el query builder de Drizzle. `sql` sólo en `check()` del schema. |
| Tipos compartidos | Viven **sólo** en `src/features/<f>/domain` (schemas Zod + tipos inferidos). El código de cliente nunca importa `repository`, `services` ni `@/lib/db`. |
| Restricciones | Toda regla de datos que Postgres pueda garantizar va en el schema Drizzle (`notNull`, `varchar(n)`, `unique`, `check`, FKs con `onDelete`). |
| Concurrencia | Toda tabla mutable usa `version` (concurrencia optimista). Update/delete filtran por `id` **y** `version`; 0 filas ⇒ `STALE_VERSION`. |
| Errores | Toda acción inválida ⇒ `AppError(code)` del catálogo (`src/lib/errors`) con mensaje claro en español. Nunca `throw 'texto'` ni un error crudo al cliente: las Server Actions devuelven `ActionResult`. |
| Seguridad | Toda Server Action verifica sesión y rol en el servidor, salvo las lecturas públicas del catálogo, que se listan explícitamente. Toda página nueva se registra en `src/proxy.ts`. Toda entrada se valida con Zod `strictObject`. Toda respuesta se valida contra su `RowSchema`. |
| Fechas | Se guardan y viajan en UTC (ISO 8601). Se muestran en `America/Argentina/Buenos_Aires` con `formatDateTime`. |
| Secretos | Jamás se commitea un `.env` real (hook + CI lo bloquean). Variables nuevas ⇒ `.env.example`. |

## Comandos

Los scripts `test:*`, `typecheck` y `verify` y el servicio `db-test` todavía no existen: ver `docs/testing.md`.

```bash
npm run test:watch       # mientras desarrollás
npm run lint && npm run typecheck
npm run test:coverage    # unit + contrato + fuzz + cobertura (lo corre pre-push)
npm run test:int         # integración de repositorios (requiere `docker compose up -d db-test`)
npm run test:e2e         # Playwright en Chromium
npm run verify           # TODO: lint, tipos, cobertura, integración, mutación y build. Obligatorio antes de integrar a develop.
```

## Definition of Done (resumen — completo en `docs/definition-of-done.md`)

- [ ] Tests nuevos: unit + contrato (caja negra) + fuzz + integración si tocó repositorio/schema.
- [ ] Cada acción inválida tiene su error, su mensaje y su test (tabla en `docs/features/<f>/README.md`).
- [ ] `npm run verify` verde (cobertura ≥ 90/85, mutación ≥ 70).
- [ ] Docs del feature, ADR si hubo decisión, `.env.example` y seed actualizados si aplica.
- [ ] `docs/initial_prompt.md` adaptado si fue un avance significativo (criterios en `docs/how-to-document.md`).
- [ ] `BACKLOG.md` actualizado: estado, fecha y hora de cierre de cada criterio, y horas reales del ítem.
- [ ] Commits Conventional Commits en español. ANTES de commitear, mostrarle al dev una **lista breve y en
      lenguaje simple** (para alguien que no sabe nada técnico) de todo lo esencial que entra en el commit. Esa
      lista es lo que el dev aprueba; sin su OK no se commitea ni se pushea.
- [ ] **Sin PR** (regla general): cada ítem va en su rama y se integra con `git merge --squash` a `develop` (un
      commit por ítem), con el OK del dev, push y borrado de la rama. Detalle en `docs/git.md`.

## Mapa de documentación

`docs/initial_prompt.md` (contexto completo para arrancar) · `docs/architecture.md` · `docs/workflow.md` ·
`docs/git.md` · `docs/testing.md` ·
`docs/definition-of-done.md` · `docs/conventions/` · `docs/features/` · `docs/adr/` · `docs/how-to-document.md`

## Skills del repo

Viven en `.agents/skills/` y, copiadas e idénticas, en `.claude/skills/` (Claude Code). Las dos carpetas se
versionan (`docs/workflow.md` §8).
Propias: `start-task`, `finish-task`. De terceros (las de `skills-lock.json` y otras copiadas a mano): TDD,
Next.js (best practices, cache components, upgrade), React y composición, Drizzle, Postgres, Tailwind,
TypeScript avanzado, Node.js, Playwright, accesibilidad, SEO, diseño de frontend, code review, refactor,
revisión de seguridad y Conventional Commits. Cómo agregarlas o actualizarlas: `docs/workflow.md` §8.

Si una skill o `.agents/rules/` contradice este archivo, **gana este archivo**. Por ejemplo, `conventional-commit`
pide commits en inglés: acá van en español.
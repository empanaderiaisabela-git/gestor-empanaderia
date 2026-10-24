# Flujo de trabajo

Cómo se encara **cualquier** tarea, sea con Claude Code o a mano. El flujo es el mismo
para todos; las skills `start-task` y `finish-task` lo automatizan.

```
Requerimiento → Backlog → Descubrimiento → Plan aprobado → Rama → TDD → Gates → Docs → Merge → Backlog
```

## 0. Entrada de requerimientos

1. El dev pega lo que pide el cliente, **textual**, en
   [`docs/requerimientos/specs.md`](requerimientos/specs.md). Lo pegado no se edita.
2. Se interpreta y se hacen las preguntas de descubrimiento (§2) que hagan falta para entenderlo.
3. Con las respuestas se crean uno o más ítems `US-N` en [`BACKLOG.md`](../BACKLOG.md), con historia y
   criterios de aceptación medibles, cada uno con su estimación (ver "Cómo se estima" en `BACKLOG.md`). Lo que el dev no pueda responder sin el cliente va a "Preguntas abiertas".

## 1. Tomar un ítem del backlog

1. Abrí [`BACKLOG.md`](../BACKLOG.md) y elegí un ítem `Pendiente` del sprint actual cuyas dependencias estén
   `Hecho`.
2. Pasalo a `En progreso`, poné tu nombre como dueño y la fecha de inicio. Commit `docs(backlog): …`.
3. Si la tarea no está en el backlog, **se agrega primero** (con ID, descripción y criterios). No se programa nada
   que no esté registrado.

## 2. Descubrimiento: preguntas obligatorias

Antes de planificar, el agente le hace al dev (y el dev se hace) estas preguntas. Lo que no tenga respuesta en
la US, en `docs/features/` o en `docs/requerimientos/specs.md` **se pregunta, no se inventa**.

**Actores y permisos**
- ¿Qué rol ejecuta la acción (administrador o vendedor)? ¿Qué pasa si la intenta otro rol?
- ¿Hay restricción de pertenencia?

**Datos**
- ¿Qué datos entran? Para cada campo: tipo, obligatorio/opcional, largo, formato, rango, unicidad.
- ¿Qué datos salen y quién puede verlos? ¿Hay campos que no deben filtrarse?
- ¿Qué restricciones puede garantizar la base (unique, check, FK)? ¿Qué pasa al borrar algo referenciado?

**Comportamiento**
- ¿Cuál es el camino feliz paso a paso? ¿Qué se ve en pantalla en cada paso?
- ¿Qué acciones inválidas existen? Para cada una: código de error y mensaje al usuario.
- ¿Puede haber dos personas editando lo mismo? (⇒ concurrencia optimista con `version`).
- Estados de UI: ¿qué se muestra mientras carga, si está vacío y si falla?
- ¿Hay fechas? 

**Aceptación y dependencias**
- ¿Cuáles son los criterios de aceptación **medibles** (no "rápido", sino "en menos de 1 s con 500 filas")?
- ¿Depende de otra US o habilitador? ¿Rompe algo existente?

## 3. Plan

1. Copiá [`docs/templates/plan.md`](templates/plan.md) a `docs/plans/<ID>-<slug>.md` (p. ej.
   `docs/plans/US-3-categorias-de-productos.md`).
2. Completá: objetivo, respuestas del descubrimiento, cambios por capa (domain → repository → service → actions →
   ui), tabla de errores,
   tests que se van a escribir, riesgos.
3. El dev aprueba el plan **antes** de escribir código. Si el agente es quien planifica, se detiene y espera.

## 4. Rama

Desde `develop` actualizado: `git switch develop && git pull && git switch -c feat/us-01-XXX-XXX`.
Nombres y reglas en [`git.md`](git.md).

## 5. Implementación con TDD (orden recomendado)

1. **Contratos** en `src/features/<feature>/domain/` (schemas Zod de entrada y de fila) + tests (válidos,
   inválidos con mensaje exacto, fuzz).
2. **Errores** nuevos en el catálogo (`src/lib/errors/`).
3. **Schema** en `src/lib/db/schema.ts` con todas las restricciones + test de tipos (`*.test-d.ts`) +
   `npm run db:generate -- --name <descripcion>`.
4. **Repositorio** (interfaz + implementación Drizzle + fake en memoria en `testing/`) + test de integración.
5. **Service** con tests unitarios usando el fake (reglas, permisos, versión).
6. **Server Actions** con tests de contrato (caja negra) y fuzz.
7. **UI**: `store/` → `ui/hooks/` → `ui/components/` del feature y la página en `src/app/`, con tests de
   componente; E2E si el flujo es crítico.

Ciclo por comportamiento: test que falla → código mínimo → refactor. Detalle en [`testing.md`](testing.md).

## 6. Gates

| Momento | Qué correr | Automático |
|---|---|---|
| Mientras programás | `npm run test:watch` | — |
| `git commit` | bloqueo de `.env`, ESLint (incluye tope de 100 líneas en **todos** los archivos), typecheck | lefthook |
| Mensaje de commit | commitlint (Conventional Commits) | lefthook |
| `git push` | unit + contrato + fuzz + cobertura | lefthook |
| Antes de abrir el PR | `npm run verify` (todo + integración + mutación + build) | manual, **obligatorio** |
| PR / push a `develop` o `main` | lo mismo que `npm run verify` + E2E, en jobs paralelos | GitHub Actions |

Nunca `--no-verify`. Si un gate falla, se arregla la causa.

> Todavía no están instalados lefthook ni commitlint, no están los scripts de test y no hay workflow de CI (sólo
> `keep-alive.yml`). Detalle de los scripts en [`testing.md`](testing.md#cuándo-se-corre-cada-cosa).

## 7. Cierre (skill `finish-task`)

1. Recorré la [Definition of Done](definition-of-done.md) completa.
2. Actualizá `docs/features/<feature>/README.md` (comportamiento vigente + tabla de errores) y, si hubo una
   decisión de arquitectura, un ADR.
3. `BACKLOG.md`: fecha y hora de cierre de cada criterio, horas reales del ítem, estado `En revisión` y link al
   PR.
4. Abrí el PR a `develop` con la plantilla completa. El dev lo revisa; cuando lo aprueba y se mergea, el ítem pasa
   a `Hecho`.

## 8. Skills

- Viven en `.agents/skills/` (OpenCode, Antigravity) y `.claude/skills/` (Claude Code). Ambas carpetas se
  versionan y deben ser **idénticas** (`npm run skills:check` lo verifica en CI).
- Las de terceros están registradas en `skills-lock.json`. Para agregar una:
  `npx skills add <owner/repo> -s <skill> -a claude-code -a opencode -a antigravity --copy -y`, luego
  `npm run skills:check` y commit `chore(skills): …`. Sólo fuentes oficiales o de mantenedores reconocidos.
- Para restaurarlas o actualizarlas: `npx skills experimental_install` / `npx skills update -p`.
- Las propias (`start-task`, `finish-task`) se editan en `.agents/skills/` y se copian con `npm run skills:sync`.

> `skills:sync` reemplaza `.claude/skills/` por una copia exacta de `.agents/skills/`, borrando lo que sobre. La
> fuente es siempre `.agents/skills/`: lo que se edite directo en `.claude/skills/` se pierde en el próximo sync.
> Pendiente: no hay workflow de CI, así que hoy nadie corre `skills:check` automáticamente.
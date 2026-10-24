# Plan: T-1 — Backlog, specs y base inicial del repo

- **Ítem del backlog**: T-1
- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-23 · **Estado**: Aprobado
- **Rama**: ninguna. Es el arranque del repo, directo en `main`, porque todavía no existe `develop`.

## Objetivo

Dejar el repo en condiciones de seguir `docs/workflow.md`: con backlog, documentación sin contradicciones y Git
con `main` y `develop` en `origin`. Es el primer ítem del Sprint 0 y habilita todos los demás.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente (US, dev, cliente) |
|---|---|---|
| ¿Qué rol ejecuta la acción? | El dev; no hay cambios de comportamiento de la app | dev |
| ¿Qué campos entran/salen y con qué reglas? | No aplica: sólo docs y Git | — |
| ¿Hay concurrencia? | No | — |
| ¿Qué se muestra en carga / vacío / error? | No aplica | — |
| ¿Dónde viven los requerimientos del cliente? | `docs/requerimientos/specs.md` (se unifican las referencias a `docs/specs/`) | dev (por defecto) |
| ¿Tope de líneas estricto o con margen? | Estricto: 100 líneas físicas | dev |

**Preguntas resueltas** (dev, 2026-10-23): el `JWT_SECRET` por defecto se quita antes del commit (fix de BUG-2
adelantado, con el test pendiente de T-2). El contacto queda como está, porque por ahora sólo se despliega el
gestor. `eslint-error.log` se borra y se ignora `*.log`. El commit espera la revisión del dev.

## Cambios por capa

| Capa | Archivos a crear/modificar | Responsabilidad |
|---|---|---|
| Backlog | `BACKLOG.md` | Convenciones, Sprint 0 (T-1 a T-7, BUG-1 a BUG-3) y Sprint 1 |
| Docs | `AGENTS.md`, `docs/workflow.md`, `docs/how-to-document.md`, `docs/initial_prompt.md` | Ruta única de specs; entrada de requerimientos (§0); estado del repo |
| Reglas y skills | `.agents/rules/coding-standards.md`, `.agents/skills/code-refactoring/SKILL.md`, `.agents/skills/start-task/SKILL.md` | Alinear con `AGENTS.md`; después, `npm run skills:sync` |
| ADR | `docs/adr/README.md` | Índice vacío |
| Seguridad | `src/lib/auth/jwt.ts`, `.gitignore`, `eslint-error.log` (borrado) | Sin secreto en el código; logs fuera del repo |
| Git | Commit inicial en `main`, push y `develop` | Base versionada |

## Restricciones de base de datos

No aplica.

## Errores

No aplica: no hay cambios de comportamiento.

## Tests

| Tipo | Casos |
|---|---|
| Unit, contrato, fuzz, integración, componente, E2E | No aplica: el ítem no cambia código de producción |
| Verificación | `npm run skills:check` en verde; `grep` sin referencias a `docs/specs/`; `git show --stat` sin `.env`; `git ls-remote` muestra `main` y `develop` |

## Riesgos y decisiones

- **El repo es público.** Todo lo que entre en el primer commit queda publicado y en el historial. Ver "Preguntas
  abiertas".
- `eslint-error.log` es un log del proyecto anterior (rutas de otra máquina). Se propone no versionarlo.

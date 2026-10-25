# Plan: T-3 — Gates: ESLint con reglas duras, hooks y CI

- **Ítem del backlog**: T-3
- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-24 · **Estado**: Aprobado (plan del sprint)
- **Rama**: `feat/t-3-gates`

## Objetivo

Que las reglas duras de `AGENTS.md` se hagan cumplir solas en el código nuevo, sin obligar a reescribir el código
heredado de una vez.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Cómo se marca la única excepción a "cero comentarios"? | El comentario empieza con `Por qué:` | plan del sprint |
| ¿Qué pasa con el código heredado? | `eslint-legacy.json` le apaga sólo las reglas nuevas; la lista sólo se achica | US |
| ¿Dónde corre el CI? | En cada push a `develop` y `main` (no hay PR) | dev |
| ¿Tests y `max-lines-per-function`? | Los tests quedan exentos (los `describe` son estructura); el resto de las reglas aplica | decisión técnica, ADR 0003 |

## Cambios

| Área | Archivos | Responsabilidad |
|---|---|---|
| ESLint | `eslint.config.mjs`, `eslint/hard-rules.mjs`, `eslint/layers.mjs`, `eslint/rules/no-comments.mjs` | Reglas duras, capas por carpeta y regla local de comentarios |
| Legacy | `eslint-legacy.json`, `scripts/legacy-check.mjs` | Inventario de archivos heredados; falla si la lista crece |
| CSS | `scripts/line-limit.mjs` | Tope de 100 líneas en `.css` (ESLint no los analiza) |
| Hooks | `lefthook.yml`, `scripts/block-env.mjs`, `commitlint.config.mjs` | pre-commit, commit-msg y pre-push |
| CI | `.github/workflows/ci.yml` | quality, unit, integration y build |
| Fix | `src/features/product/ui/components/product-photos-manager.tsx` | `loadPhotos` declarada antes del `useEffect` |
| Docs | ADR 0003, `AGENTS.md`, `architecture.md`, `workflow.md`, `git.md`, `initial_prompt.md`, `coding-standards.md` | Reflejar los gates |

## Tests

| Tipo | Casos |
|---|---|
| Unit | `src/test/eslint-rules.test.ts`: cada regla rechaza un fragmento de código nuevo; se permiten `Por qué:`, `as const`, `domain → @/lib/db/schema`, `service → @/lib/db/transaction` y un `describe` largo; un archivo legacy no recibe las reglas nuevas |
| Demostración (CA-6) | Un mensaje de commit inválido, un `.env` en el stage y un archivo nuevo de 101 líneas son rechazados por los hooks |
| CI | Primera corrida en verde en GitHub Actions |

## Riesgos y decisiones

- 143 archivos heredados en la lista legacy al activar las reglas.
- ADR 0003.

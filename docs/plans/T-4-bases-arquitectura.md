# Plan: T-4 — Bases de la arquitectura objetivo

- **Ítem del backlog**: T-4
- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-24 · **Estado**: Aprobado (plan del sprint)
- **Rama**: `feat/t-4-bases-arquitectura`

## Objetivo

Las piezas transversales que necesita cualquier feature migrado o nuevo: errores con código, `ActionResult` con
`code`, transacción, marca `server-only`, fechas en hora de Buenos Aires y helpers para testear actions con sesión.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Qué textos usa el catálogo? | Los que ya ve el usuario: los de `MESSAGES` y los que lanzaba `verifyAuthOrAdmin`/`verifyToken` | US (CA-1) |
| ¿`code` obligatorio en `ActionResult`? | Opcional, para no romper los ~40 retornos heredados; el código nuevo usa `fail`/`toActionFailure` | plan del sprint |
| ¿Cómo convive `server-only` con `tsx` y Playwright? | Con `--conditions=react-server` en los scripts y el E2E; en Vitest, un alias | verificado en esta rama |
| ¿Cómo se simula la sesión? | Setup global que simula `next/headers` con un cookie store en memoria; `asUser` firma el JWT y espía `getUserById` | plan del sprint |

## Cambios

| Área | Archivos | Responsabilidad |
|---|---|---|
| Errores | `src/lib/errors/{codes,app-error,legacy-errors,index}.ts` (reemplaza a `src/lib/errors.ts`) | Catálogo, `AppError`, errores heredados |
| Resultado | `src/lib/action-result.ts`, `src/lib/db-errors.ts` | `code` opcional, `fail`, `databaseErrorCode`, `toActionFailure` |
| Auth | `src/lib/auth/utils.ts`, `src/lib/auth/jwt.ts` | Lanzan `AppError` con los mismos textos |
| DB | `src/lib/db/transaction.ts`, `src/lib/db/index.ts` | `withTransaction`; `import 'server-only'` |
| Fechas | `src/lib/format-date-time.ts` | Hora de Buenos Aires |
| Scripts | `package.json`, `reset-full.ts` | `--conditions=react-server` |
| Tests | `src/test/{as-user,cookie-jar}.ts`, `src/test/setup/*`, `vitest.config.mts` | Sesión simulada; la base bloqueada en unit |

## Tests

| Tipo | Casos |
|---|---|
| Unit | Texto exacto por código; `AppError`; errores heredados; `fail`; `databaseErrorCode`; `toActionFailure` sin filtrar errores desconocidos; `formatDateTime` (UTC → Buenos Aires, fecha inválida) |
| Unit (CA-4) | `asUser` contra `verifyAuthOrAdmin`: sin sesión, admin, vendedor, vendedor contra admin, usuario desactivado, token inválido |
| Integración | `withTransaction` confirma y deshace |
| Verificación | `db:seed` contra `db-test` con la marca `server-only`; sin la condición falla; `next build` en verde |

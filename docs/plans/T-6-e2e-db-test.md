# Plan: T-6 — E2E sobre `db-test`

- **Ítem del backlog**: T-6
- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-24 · **Estado**: Aprobado (plan del sprint)
- **Rama**: `feat/t-6-e2e-db-test`

## Objetivo

Que el E2E corra siempre contra la base descartable `db-test` y nunca toque los datos de desarrollo, con una app
levantada por el propio Playwright.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿`next start` o `next dev`? | Primero se probó `next dev`: en esta PC, con 4 workers, los tests se cortaban por tiempo mientras compilaba en frío (fallaban 3 y después 7 tests distintos). Se pasó a `next build` + `next start`, que es estable y se parece a producción. El spec de landing espera la revalidación de ISR (30 s) recargando | corridas del E2E |
| ¿Dónde compila? | En `.next-e2e` (`NEXT_DIST_DIR`), que se borra en cada corrida: no pisa el `.next` del dev ni hereda una caché corrupta (BUG-4 y BUG-6) | plan del sprint |
| ¿Qué datos usa? | Migraciones y `db:seed` en cada arranque; cada spec inyecta sus datos efímeros | exploración |
| ¿Cómo se evita tocar la base de desarrollo? | `playwright.config.ts` y `scripts/e2e-prepare.ts` abortan si `LOCAL_DATABASE_URL` no es la de `db-test` | plan del sprint |

## Cambios

| Área | Archivos | Responsabilidad |
|---|---|---|
| Config | `playwright.config.ts` (reescrito, sale de la lista legacy) | Guarda, puerto 3100, `webServer`, reintentos 0/1, firefox y webkit sólo en el CI de `main` |
| Servidor | `scripts/e2e-prepare.ts`, script `e2e:server`, `next.config.ts` (`distDir`) | Guarda, limpieza, migraciones, seed, `next build` y `next start` |
| Landing | `tests/landing.spec.ts`, `tests/pages/LandingPage.ts` | Esperar la revalidación de ISR en vez de un cambio inmediato |
| Setup | `tests/auth.setup.ts`; se borra `tests/db.setup.ts` | Login con URL relativa y precompilación de las pantallas |
| Page Objects | `tests/pages/ProductosPage.ts` | Esperar la condición en vez de `waitForTimeout` al cambiar la visibilidad |
| Scripts | `test:e2e`, `test:e2e:all` | Cargan `.env.test` y la condición `react-server` |
| CI | `.github/workflows/ci.yml` | Job `e2e` con `db-test` como servicio |
| Docs | `tests/readme.md`, `testing.md`, `initial_prompt.md` | Cómo se corre |

## Tests

| Tipo | Casos |
|---|---|
| E2E | La suite completa en Chromium contra `db-test` |
| Verificación | Conteos por tabla de la base de desarrollo, iguales antes y después; `npx playwright test` sin `.env.test` aborta |

## Riesgos y decisiones

- El build tarda 1 o 2 minutos por corrida, pero los tests corren rápido y sin cortes por tiempo. El timeout de
  `expect` quedó en 15 s.
- Los Page Objects siguen escribiendo directo en la base (ahora `db-test`); siguen en la lista legacy.

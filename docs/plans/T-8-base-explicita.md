# Plan: T-8 — La base de producción se elige con `APP_ENV`

- **Ítem del backlog**: T-8
- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-24 · **Estado**: Aprobado (plan del sprint)
- **Rama**: `feat/t-8-base-explicita`

## Objetivo

Que la base de producción se use sólo cuando se pide explícitamente con `APP_ENV=production`. Así ni `next build`,
ni `next start`, ni los tests ni los scripts le pegan a Supabase por accidente. Habilita el build en el CI (T-3) y el
E2E con `next start` (T-6).

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Con qué variable se elige la base? | `APP_ENV=production`; `NODE_ENV` deja de decidir | dev (plan del sprint) |
| ¿Y si falta `LOCAL_DATABASE_URL`? | Error claro, sin el default silencioso al 5433 | plan del sprint |
| Roles, UI, concurrencia | No aplica | — |

## Cambios

| Área | Archivos | Responsabilidad |
|---|---|---|
| Config pura | `src/lib/db/database-config.ts` | `envFileFor(env)` y `resolveDatabaseConfig(env)` |
| Conexión | `src/lib/db/index.ts`, `drizzle.config.ts` | Usar la config pura; desaparecen los `!` |
| Guarda de tests | `src/test/test-database-url.ts`, `src/test/integration.global-setup.ts` | Rechazar también `APP_ENV=production` |
| Docs | ADR 0002, `architecture.md`, `initial_prompt.md`, `testing.md`, `.env.example`, `README.md` | Comandos de producción con `APP_ENV=production` |

## Errores

| Situación | Mensaje |
|---|---|
| Falta `LOCAL_DATABASE_URL` | Falta la variable de entorno LOCAL_DATABASE_URL. |
| `APP_ENV=production` sin `DATABASE_URL` | Falta la variable de entorno DATABASE_URL. |
| `APP_ENV` desconocido | APP_ENV inválido: "<valor>". Valores posibles: production, development, test o vacío. |
| Integración con `APP_ENV=production` | Los tests de integración no corren con APP_ENV=production. |

## Tests

| Tipo | Casos |
|---|---|
| Unit | Tabla de `envFileFor`; config local y de producción; `NODE_ENV=production` sin `APP_ENV` usa la base local; variables faltantes; `APP_ENV` desconocido |
| Unit | La guarda rechaza `APP_ENV=production` |
| Verificación | `npm run build` con un `DATABASE_URL` falso termina bien y prerenderiza `/home` contra la base local |

## Riesgos y decisiones

- El hosting de producción (a definir) tiene que definir `APP_ENV=production`. ADR 0002.

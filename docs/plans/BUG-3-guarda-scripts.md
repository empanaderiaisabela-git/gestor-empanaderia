# Plan: BUG-3 — Scripts de base que borran todo sin protección

- **Ítem del backlog**: BUG-3
- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-24 · **Estado**: Aprobado (plan del sprint)
- **Rama**: `fix/bug-3-guarda-scripts`

## Objetivo

Que `db:seed`, `db:reset-data` y `db:reset-full` se nieguen a correr contra producción o contra cualquier base que no
sea local, antes de borrar nada.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Qué cuenta como producción? | `APP_ENV=production` (T-8) | plan del sprint |
| ¿Qué bases se pueden borrar? | Sólo con host `localhost` o `127.0.0.1` (desarrollo y `db-test`) | US |
| ¿Y `wipe-db`, el `db:generate` de `reset-full` y `seed-users`? | Quedan para BUG-10 (Sprint 1). `reset-full` igual se protege entero porque la guarda corre antes del paso 1 | dev |

## Cambios

| Área | Archivos | Responsabilidad |
|---|---|---|
| Guarda | `src/lib/db/scripts/assert-safe-to-wipe.ts` | Rechaza `APP_ENV=production`, una URL inválida y un host no local; usa `resolveDatabaseConfig` (T-8) para validar la URL que realmente se va a usar |
| Scripts | `setup-initial-data.ts`, `reset-full.ts` | Llamar a la guarda antes de borrar. `reset-full` lee el `.env` en una copia, para no cambiar el entorno de sus pasos |

## Errores

| Situación | Mensaje |
|---|---|
| `APP_ENV=production` | Script destructivo bloqueado: APP_ENV=production apunta a la base de producción. |
| Host no local | Script destructivo bloqueado: la base no es local (<host>). |
| URL inválida | Script destructivo bloqueado: la URL de la base no es válida. |

## Tests

| Tipo | Casos |
|---|---|
| Unit | `regression BUG-3`: producción y host remoto bloqueados; desarrollo y `db-test` permitidos; URL inválida o ausente |
| Verificación | `db:seed`, `db:reset-data` y `db:reset-full` con `APP_ENV=production` y con un host remoto salen con código 1 sin llegar a borrar; `db:seed` contra `db-test` funciona |

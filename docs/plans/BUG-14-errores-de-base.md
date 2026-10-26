# Plan: BUG-14 — Cualquier error de la base se muestra como "datos desactualizados"

- **Ítem del backlog**: BUG-14
- **Autor**: Agente · **Fecha**: 2026-10-26 · **Estado**: Aprobado (plan nocturno del Sprint 2, autorizado por el dev)
- **Rama**: `fix/bug-14-errores-de-base`

## Objetivo

Hoy `databaseErrorCode` (`src/lib/db-errors.ts`) traduce cualquier `Failed query` de Drizzle a `STALE_VERSION`. Por eso
una tabla que no existe, la base caída o un `CHECK` que falla se muestran como "Los datos en el servidor han
cambiado. Por favor, sincroniza la lista…", y sincronizar no arregla nada. Al dev le pasó al guardar un precio con la
base local sin migrar.

## Cambio

- `STALE_VERSION` sale sólo de una versión vieja de verdad: `AppError('STALE_VERSION')` de los services o el
  `ConcurrencyError` heredado.
- Un dato que Postgres rechaza por formato o por una restricción (`23502` `NOT NULL`, `23514` `CHECK`, `22P02`
  formato inválido, `22001` texto largo, `22003` número fuera de rango) es `VALIDATION`: "Los datos proporcionados no
  son válidos." (la nota del ítem pedía revisarlo).
- Cualquier otro `Failed query` es `UNEXPECTED`: "Ocurrió un error inesperado…". El detalle queda en el log del
  servidor (`console.error`) y nunca llega al navegador, tampoco por `handleDatabaseError` del código heredado.

## Tests

`db-errors.test.ts`:
- tabla con un `42P01` (tabla inexistente), un error de conexión, un `CHECK` y un `NOT NULL`;
- el `ConcurrencyError` y el `AppError` siguen dando `STALE_VERSION`;
- `toActionFailure` no filtra el SQL.

Los contratos de proveedores, menú, stock, promos, tarjetas y gastos siguen en verde: su `STALE_VERSION` sale del
service.

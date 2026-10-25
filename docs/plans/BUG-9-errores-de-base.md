# Plan: BUG-9 — Errores de base de datos mal traducidos

- **Ítem del backlog**: BUG-9
- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-24 · **Estado**: Aprobado (plan del sprint)
- **Rama**: `fix/bug-9-errores-de-base`

## Objetivo

Que cada error real de Postgres le muestre al usuario su mensaje, y no el de concurrencia.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Por qué se ve "concurrencia"? | Drizzle 0.45 envuelve el error en `DrizzleQueryError` (mensaje `Failed query: …`) y deja el original en `.cause`; `handleDatabaseError` no lo leía y caía en la rama `failed query` | exploración |
| ¿Cómo se distinguen los dos 23503? | Por el `detail` de Postgres: `is still referenced` (borrado) contra `is not present` (inserción) | plan del sprint |
| ¿Cambia algún comportamiento visible? | Sí, a propósito: crear un producto cuyo proveedor se acaba de borrar ahora muestra "Una de las entidades relacionadas ya no existe…" (escenario C del E2E) | exploración |

## Cambios

| Área | Archivos | Responsabilidad |
|---|---|---|
| lib | `src/lib/db-errors.ts` | Leer código, detalle y mensaje en el error, `originalError` y `cause`; nunca lanzar; sale de la lista legacy |
| E2E | `tests/concurrencia.spec.ts` (escenario C) | Esperar `RELATION_NOT_FOUND` |
| Cobertura | `vitest.config.mts` | Excluir `src/config/` (textos), como dice `testing.md` |

## Tests

| Tipo | Casos |
|---|---|
| Unit | Tabla: 23505 y 23503 directos, en `cause` y en `originalError`; `Failed query` sin código; `ConcurrencyError`; `DuplicateEntityError`; mensaje propio; algo que no es un error |
| Fuzz | Con cualquier entrada nunca lanza y devuelve un mensaje (antes lanzaba con `null`) |
| Integración | `regression BUG-9` contra `db-test`: duplicado, referencia inexistente y borrado de algo referenciado, con errores reales de Drizzle |
| E2E | Escenario C, a confirmar en T-6 sobre `db-test` |

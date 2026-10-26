# Plan: US-14 — Gastos: anotador de facturas

- **Ítem del backlog**: US-14
- **Autor**: Agente · **Fecha**: 2026-10-26 · **Estado**: Aprobado (plan nocturno del Sprint 2, autorizado por el dev)
- **Rama**: `feat/us-14-gastos`

## Objetivo

Un anotador aislado de las facturas de gastos del local, con su número, título, monto y fecha. No afecta Estadísticas.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Qué datos? | Número de factura, título, monto y fecha de la factura; la fecha de carga es automática | Cliente, 2026-10-25 |
| ¿Número único? | Sí: no se repite, sin distinguir mayúsculas | Cliente, 2026-10-25 |
| ¿Foto? | No | Cliente, 2026-10-25 |
| ¿Afecta Estadísticas? | No | Decisiones del dev |
| ¿Quién? | Sólo el admin (menú, después de Estadísticas, como en `specs.md`; `proxy.ts`) | `specs.md` |
| ¿Se borra? | Sí, con su versión (es un anotador; no hay nada que dependa de un gasto) | Agente |

## Cambios por capa

| Capa | Archivos | Responsabilidad |
|---|---|---|
| schema + migración | `src/lib/db/expense-schema.ts`, migración 0016 | `expenses`: número `varchar(30)` único, título `varchar(100)`, monto `CHECK > 0`, fecha de la factura (`date`), usuario que la cargó, `version` y timestamps |
| domain | `features/expense/domain/expense.schema.ts` | Alta, edición y borrado con Zod; fila validada |
| repository, testing | `expense.repository.ts`, `expense-unit-of-work.ts`, fake y suite de comportamiento | Lista por fecha de la factura (la más nueva primero) |
| service | `expense.service.ts` | Número único, `STALE_VERSION`, auditoría `EXPENSE` |
| actions | `create-`, `update-`, `delete-expense`, `fetch-expenses` | Todo sólo admin |
| ui y página | `expenses-panel.tsx`, `expense-form-modal.tsx`, `src/app/(main)/gastos/` | Grilla con búsqueda por número o título, formulario y borrado |

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Sin sesión | `UNAUTHENTICATED` | No autorizado (Token faltante) | `expense-errors.contract.test.ts` |
| Un vendedor carga, edita, borra o lista | `FORBIDDEN` | Solo los administradores pueden realizar esta acción | ídem |
| Número vacío o de más de 30, título vacío o de más de 100, monto ≤ 0 o con más de 2 decimales, fecha inválida | `VALIDATION` | Los datos proporcionados no son válidos. | ídem y `expense.schema.test.ts` |
| Número de factura repetido | `DUPLICATE` | Ya existe un registro con esos datos… | ídem |
| Editar o borrar con una versión vieja | `STALE_VERSION` | Los datos en el servidor han cambiado… | ídem |

## Tests

Unit (schema con fuzz, service con el fake), contrato, integración (suite de comportamiento, `CHECK`, y que un gasto
no cambia las Estadísticas de la jornada), componentes y E2E (`tests/gastos.spec.ts`).

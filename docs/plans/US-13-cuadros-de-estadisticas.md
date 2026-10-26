# Plan: US-13 — Estadísticas: cuadros de vendedores y de ventas

- **Ítem del backlog**: US-13
- **Autor**: Agente · **Fecha**: 2026-10-26 · **Estado**: Aprobado (plan nocturno del Sprint 2, autorizado por el dev)
- **Rama**: `feat/us-13-cuadros-de-estadisticas`

## Objetivo

Debajo de los KPI de la jornada (US-12), dos cuadros:
- **Vendedores**: vendedor, turno, número de ventas e importe;
- **Ventas**: comprador, hora e importe de cada venta, ordenadas por hora.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Turnos? | Mañana de 7:00 a 16:59 y tarde de 17:00 a 6:59, en hora de Argentina. El local abre de 11 a 16 y de 19 a 1 | Cliente, 2026-10-25 |
| ¿Una venta de la 0:30? | Tarde de la jornada que empezó a las 7 (US-12) | Dev, 2026-10-25 |
| ¿Importe? | Lo que pagó el cliente, recargo incluido (D-3) | Agente |
| ¿Comprador sin nombre? | "Sin nombre" | US-7 |
| ¿Dónde? | "Abajo del todo" de Estadísticas | `specs.md` línea 57 |

## Cambios por capa

| Capa | Archivos | Responsabilidad |
|---|---|---|
| domain | `stats/domain/shift.ts`, `stats.schema.ts` | `shiftOf` (función pura con fronteras) y las filas de los cuadros |
| service | `compute-workday-stats.ts`, `workday-tables.ts` | Agrupar por vendedor y turno; listar las ventas por hora |
| ui | `vendors-table.tsx`, `sales-table.tsx`, `stats-panel.tsx` | Los dos cuadros al final de la pantalla, con su estado vacío |
| lib | `format-date-time.ts` | `argentinaTime` (HH:MM en hora de Argentina) |

## Tests

Unit de `shiftOf` en 6:59, 7:00, 16:59, 17:00 y 0:30 (CA-3); armado de los cuadros; integración sobre los datos
sembrados; componentes; y el E2E de Estadísticas extendido.

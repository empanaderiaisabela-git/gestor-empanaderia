# Plan: US-12 — Estadísticas de la jornada: dinero por comida, ganancia y ventas

- **Ítem del backlog**: US-12
- **Autor**: Agente · **Fecha**: 2026-10-26 · **Estado**: Aprobado (plan nocturno del Sprint 2, autorizado por el dev)
- **Rama**: `feat/us-12-estadisticas-del-dia`

## Objetivo

Estadísticas abre con la jornada de hoy y muestra lo que pidió el cliente:
- cuánto generó cada comida y bebida, cada cuadro con el color de su grupo, y un cuadro aparte para las promos;
- la ganancia en limpio;
- la cantidad de ventas;
- lo facturado por cada uno de los 4 medios de pago.

Se quitan los KPI heredados que el cliente no nombró.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Qué es "el día"? | La jornada del local: de 7:00 a 6:59 del día siguiente, en hora de Argentina. Una venta de la 0:30 cuenta para la jornada que empezó a las 7 | Dev, 2026-10-25 |
| ¿Promos en los KPI por comida? | Cuadro aparte "Promos" | Dev, 2026-10-25 |
| ¿Descuentos en los KPI por comida? | Se reparten entre las comidas en proporción a lo que pesa cada una en la venta | Dev, 2026-10-25 |
| ¿Ganancia en limpio? | Lo facturado (con el recargo de las cuotas) − costo para el local congelado de lo vendido (también lo que usó cada promo) − mermas de la jornada | Cliente y dev |
| ¿Medios de pago? | Lo facturado por Efectivo, Transferencia, Débito y Crédito, cada uno en su cuadro; el crédito suma su recargo | Cliente, 2026-10-25 |
| ¿KPI heredados? | Se quitan: valor del stock, unidades, pérdidas, órdenes procesadas, mejores vendedores | Cliente, 2026-10-25 |
| ¿Quién la ve? | Sólo el admin (BUG-12) | Backlog |

## Cambios por capa

| Capa | Archivos | Responsabilidad |
|---|---|---|
| domain | `stats/domain/workday.ts`, `stats.schema.ts` | Jornada de una fecha y fecha de una jornada (funciones puras, con tests de frontera); tipos del resumen y de los KPI |
| repository | `stats.repository.ts` | Ventas de la jornada con sus líneas, lo consumido y los pagos (con recargo); mermas de la jornada. Lectura consistente y secuencial (BUG-5), sin `password_hash` (BUG-7) |
| service | `compute-workday-stats.ts`, `workday-stats.service.ts` | Cálculo puro de los KPI |
| actions | `fetch-workday-stats.ts` | Sólo admin; valida la jornada con Zod |
| ui y página | `stats/ui/*`, `src/app/(main)/page.tsx` | Selector de jornada, cuadros con el color de cada grupo, estados de carga, jornada sin ventas y error. La página vieja sale de `eslint-legacy.json` |

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Sin sesión | `UNAUTHENTICATED` | No autorizado (Token faltante) | `workday-stats.contract.test.ts` |
| Un vendedor pide las estadísticas | `FORBIDDEN` | Solo los administradores pueden realizar esta acción | ídem (regresión BUG-12) |
| Jornada inválida | `VALIDATION` | Los datos proporcionados no son válidos. | ídem |
| Falla de la base | `UNEXPECTED` | Ocurrió un error inesperado… | ídem |

## Tests

Unit (jornada con fronteras 6:59:59 y 7:00, después de medianoche; cálculo de cada KPI con descuento, promo, recargo
y mermas), contrato por la action, integración sobre datos sembrados (ventas antes, dentro y después de la jornada),
componentes (cuadros, estados) y E2E (una venta del día aparece en Estadísticas).

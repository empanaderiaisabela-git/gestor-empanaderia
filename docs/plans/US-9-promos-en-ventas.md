# Plan: US-9 — Ventas: subdivisión Promos

- **Ítem del backlog**: US-9
- **Autor**: Agente · **Fecha**: 2026-10-26 · **Estado**: Aprobado (plan nocturno del Sprint 2, autorizado por el dev)
- **Rama**: `feat/us-9-promos-en-ventas`

## Objetivo

El vendedor elige una promo en el tablero, completa los gustos de cada producto y la suma al pedido. Se cobra el precio
de venta de la promo, que recalcula el servidor, y se descuenta el stock de cada gusto con su costo congelado.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Dónde se elige? | Una subdivisión "Promos" en el tablero; con un clic muestra las promos activas | `specs.md` línea 22 |
| ¿Cómo se eligen los gustos? | Por cada producto de la promo, con la misma lista de gustos del tablero, sólo entre los que tienen stock | US-9 CA-1 |
| ¿Varias promos? | Sí, iguales o distintas; cada clic suma una promo al pedido | `specs.md` línea 22, US-9 CA-2 |
| ¿Qué precio se cobra? | El precio de venta de la promo guardado en la base, nunca el del navegador | US-9 CA-3, US-6 |
| ¿Y el descuento de la venta? | Se aplica sobre el total, promos incluidas (decisión provisoria D-2) | Agente |
| ¿Cómo se ve en el historial? | Una línea "Promo" con el nombre y los gustos elegidos | Agente (sigue el formato de US-7) |

## Cambios por capa

| Capa | Archivos | Responsabilidad |
|---|---|---|
| schema + migración | `order-schema.ts`, migración 0013 | `sale_lines.promotion_id` (FK sin cascada: una promo vendida no se borra, D-1); grupo y presentación pasan a opcionales; un `CHECK` exige o una línea común o una de promo |
| domain | `order/domain/promo-line.ts`, `checkout.schema.ts` | Línea de promo: expandir los productos en partes, completar gustos, describir; schema de cobro con `promos` |
| repository | `checkout-unit-of-work.ts`, `sale-writer.repository.ts`, `sale-history.repository.ts` | La promo se lee en la transacción del cobro; la línea se guarda con `promotion_id`; el historial la trae |
| service | `checkout-promos.ts`, `checkout.service.ts` | Valida promo activa y partes completas del grupo correcto, cobra su precio, suma su uso al stock |
| store y ui | `order.store.ts`, `promo-card.tsx`, `flavor-picker.tsx`, `current-order.tsx`, `promo-line-row.tsx`, `use-checkout.ts` | Subdivisión Promos, elegir gustos por producto, la promo en el pedido, el total y el cobro |
| historial | `order-describe.ts`, `sale-receipt.tsx`, `sale-history-columns.tsx` | La línea de promo dice "Promo" y su descripción |

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Promo inexistente o desactivada | `NOT_FOUND` | El/la promoción seleccionado ya no existe. | `checkout-promos.test.ts`, `checkout.contract.test.ts` |
| Partes que no coinciden con la promo, gustos incompletos o de otro grupo | `VALIDATION` | Los datos proporcionados no son válidos. | ídem |
| Un gusto de la promo sin stock suficiente | `INSUFFICIENT_STOCK` | No hay stock suficiente de <gusto>. | ídem |
| Borrar una promo que ya se vendió | `HAS_RELATIONS` | No se puede completar la operación porque existen registros relacionados. | `promotion-errors.contract.test.ts` |

## Tests

| Tipo | Casos |
|---|---|
| Unit: dominio | Expandir productos, completar partes, describir, schema de cobro con promos (y fuzz) |
| Unit: service | Venta con promo y línea común, precio del servidor, stock, errores |
| Contrato | Camino feliz y errores por la Server Action de cobro |
| Integración | Cobro con promo contra Postgres (línea con `promotion_id`, costo congelado); no deja borrar la promo vendida |
| Componente | Subdivisión Promos, lista de gustos de cada producto, promo en el pedido |
| E2E | `tests/promo-venta.spec.ts`: el admin arma una promo y la vende desde el tablero; el historial la muestra |

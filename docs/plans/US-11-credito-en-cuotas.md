# Plan: US-11 — Ventas: cobrar con crédito en cuotas

- **Ítem del backlog**: US-11
- **Autor**: Agente · **Fecha**: 2026-10-26 · **Estado**: Aprobado (plan nocturno del Sprint 2, autorizado por el dev)
- **Rama**: `feat/us-11-credito-en-cuotas`

## Objetivo

Al cobrar con crédito, el vendedor elige la tarjeta y el plan de cuotas. El servidor calcula el recargo con el % del
plan guardado y lo suma a lo que paga el cliente. El comprobante y el historial muestran la tarjeta, las cuotas y el
recargo.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Sobre qué se cobra el recargo? | Sólo sobre la parte pagada con crédito. Ej.: $10.000 con $4.000 en efectivo y $6.000 en crédito al 10 % ⇒ $600 de recargo, total $10.600 | Dev, 2026-10-25 |
| ¿El débito pide tarjeta? | No | Cliente, 2026-10-25 |
| ¿El recargo es ganancia? | Sí (lo usa US-12) | Cliente, 2026-10-25 |
| ¿Qué importe tiene la venta? | Lo que pagó el cliente, recargo incluido (decisión provisoria D-3) | Agente |
| ¿Tarjeta o plan inexistente o inactivo? | Error con su test | US-11 CA-3 |

## Cambios por capa

| Capa | Archivos | Responsabilidad |
|---|---|---|
| schema + migración | `schema.ts` (`sale_payments`), migración 0015 | `card_id` (FK sin cascada: una tarjeta usada no se borra), `installments`, `surcharge_pct` y `surcharge_amount`; un `CHECK` exige los cuatro juntos y sólo en crédito (los créditos viejos, sin tarjeta, siguen siendo válidos) |
| domain | `checkout.schema.ts`, `order-validation.ts` | El pago con crédito lleva `cardId` e `installments`; los demás medios no |
| service | `checkout-payments.ts`, `checkout.service.ts` | Lee la tarjeta y el plan en la transacción, calcula el recargo y suma al total |
| repository | `checkout-unit-of-work.ts`, `sale-writer.repository.ts`, `sale-history.repository.ts` | Guarda y lee los datos de la tarjeta de cada pago |
| ui | `checkout-form.ts`, `payment-picker.tsx`, `credit-fields.tsx`, `checkout-modal.tsx`, `sale-receipt.tsx`, `sale-history-columns.tsx` | Elegir tarjeta y cuotas, ver el recargo y el total antes de confirmar; mostrarlos en el comprobante y el historial |

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Crédito sin tarjeta o sin cuotas, o tarjeta en otro medio | `VALIDATION` | Los datos proporcionados no son válidos. | `checkout.schema.test.ts`, `checkout.contract.test.ts` |
| Tarjeta inexistente o desactivada | `NOT_FOUND` | El/la tarjeta seleccionado ya no existe. | `checkout-payments.test.ts` |
| Plan de cuotas que la tarjeta no tiene | `NOT_FOUND` | El/la plan de cuotas seleccionado ya no existe. | `checkout-payments.test.ts` |
| Borrar una tarjeta ya usada en un cobro | `HAS_RELATIONS` | No se puede completar la operación porque existen registros relacionados. | `card-errors.contract.test.ts` |

## Tests

Unit (schema, recargo, formulario de cobro), service con el fake (recargo sólo sobre el crédito, errores),
contrato por la action de cobro, integración (pago guardado con su tarjeta; no se borra una tarjeta usada),
componentes (selector de tarjeta y cuotas en el modal) y E2E (`tests/credito-cuotas.spec.ts`).

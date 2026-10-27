# Plan: BUG-20 — El recargo de cuotas se cuenta como plata del local

- **Ítem del backlog**: BUG-20
- **Autor**: Claude Code · **Fecha**: 2026-10-27 · **Estado**: Aprobado por el dev (2026-10-27, en el plan de la
  corrida nocturna del Sprint 3)
- **Rama**: `fix/bug-20-recargo-de-la-tarjeta`
- **Nivel de tests**: 3 · profundo (dinero y cambios entre capas)

## Objetivo

La decisión provisoria D-3 del Sprint 2 sumaba el recargo de las cuotas al total de la venta. El dev respondió
(2026-10-27) que el recargo lo cobra la emisora de la tarjeta: el local ve sólo el precio original.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Qué total guarda una venta con crédito en cuotas? | El precio original: $4.000 en efectivo + $6.000 con Visa al 10 % = $10.000 | dev, 2026-10-27 |
| ¿Se migran las ventas viejas? | No: no hay ventas en producción | dev, 2026-10-27 |
| ¿Se sigue guardando el recargo? | Sí, como dato del pago (`surcharge_pct`, `surcharge_amount`); no suma en ningún total | agente (sin cambio de base) |
| ¿Se muestra el recargo al cobrar o en el comprobante? | No, el local ve sólo el precio original (decisión provisoria D-5 del Sprint 3) | agente |

## Cambios por capa

| Capa | Archivos | Cambio |
|---|---|---|
| service | `order/services/checkout.service.ts`, `checkout-payments.ts` | El total es el de los productos con descuento; sale `surchargeOf` |
| service | `stats/services/compute-workday-stats.ts` | Lo facturado, la ganancia, las comidas y el crédito no suman el recargo |
| domain | `order/domain/payment-describe.ts` | Salen `chargedAmount` y `surchargeTotal` |
| ui | `checkout-form.ts`, `checkout-modal.tsx`, `payment-picker.tsx`, `credit-fields.tsx` | El cobro confirma el precio original y no muestra "Recargo de cuotas" |
| ui | `sale-receipt.tsx`, `sale-history-columns.tsx` | Cada pago por su monto, sin el recargo |

La base no cambia.

## Errores

Sin cambios.

## Tests

| Tipo | Casos |
|---|---|
| Unit | `checkout-payments.test.ts` (total $10.000 con el recargo guardado en el pago; % guardado), `compute-workday-stats.test.ts`, `checkout-form.test.ts` |
| Componente | `checkout-modal.test.tsx`: confirma $15.500 y no muestra el recargo |
| Integración | `checkout.service.int.test.ts`: `sales.total` = 2500.00 con `surcharge_amount` = 250.00 |
| E2E | `tests/credito-cuotas.spec.ts`: confirma y registra $3.000 |

## Riesgos y decisiones

- Las ventas de desarrollo hechas antes guardan el total con recargo. No se migran (dev: no hay producción).

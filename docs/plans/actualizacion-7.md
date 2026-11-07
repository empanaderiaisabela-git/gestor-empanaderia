# Plan maestro: Actualización 7 · Venta con pago pendiente

- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-11-07 · **Estado**: aprobado por el dev (2026-11-07)
- **Ítems**: US-68, US-69 y T-29 (`BACKLOG.md`, sección "Actualización 7").

## Contexto

Hay clientes que cierran el pedido pero tardan 30 o 40 minutos en decir cómo pagan, y la comanda tiene que salir igual.
Hasta ahora el cobro exigía un medio de pago. El cambio: el medio de pago es opcional, la venta se registra (descuenta
stock y se puede imprimir la comanda) y después se completa el pago desde Ventas/Pedidos.

## Decisiones del dev (2026-11-07)

| # | Tema | Decisión |
|---|---|---|
| D-1 | Estadísticas | La venta pendiente no cuenta en nada hasta que se completa. El stock sí se descuenta al venderla. |
| D-2 | Jornada | Completada, cuenta en la jornada de la venta, no en la del cobro. Sin migración. |
| D-3 | Descuento | Se puede cargar al vender y también poner o cambiar al completar. |
| D-4 | Quién completa | Admin y vendedor. |
| D-5 | Cobro | El medio de pago es opcional y arranca **sin ninguno elegido**: sin medio, "Confirmar sin pago" registra la venta pendiente. |
| D-6 | Autonomía | Todo hasta `main` con el tag `actualizacion-7`, sin frenar. |

**Pendiente = la venta no tiene pagos** (`sale_payments` vacío). No hay migración.

## US-68 · Vender sin medio de pago

- `checkout.schema.ts`: `payments` admite 0 medios (`paymentsSchema`, hasta 2 y distintos).
- `checkout.service.ts`: sin pagos no exige que cubran el total; el total se calcula igual. `insertPayments` no escribe nada con la lista vacía.
- `checkout-form.ts`: arranca sin medio (`methods: []`) y sin error; el botón dice "Confirmar sin pago".
- Estadísticas (`compute-workday-stats.ts`): se saltean las ventas sin pagos, también en los cuadros de vendedores y de ventas.
- Comanda: `METODO PAGO: PENDIENTE`. Historial: chip "Pendiente" en Pago. Comprobante: "Pago pendiente".
- Los E2E que cobraban con el Efectivo preseleccionado ahora lo eligen.

## US-69 · Completar el pago desde Ventas/Pedidos

- Ícono "Completar pago" (billetera) en Acciones, sólo en las ventas sin pagos; lo ven el admin y el vendedor.
- Modal con descuento y medios de pago (los mismos componentes del cobro); el total es la comida con el descuento más el envío.
- `completeSalePaymentAction`: bloquea la venta (`FOR UPDATE`); si ya tiene pagos, `STALE_VERSION`. Recalcula el
  total, valida que los pagos lo cubran, aplica el recargo de la tarjeta como en el cobro, guarda total, descuentos y
  pagos, y lo audita.

## Errores (US-69)

| Acción inválida | code |
|---|---|
| Completar una venta que ya tiene pagos | `STALE_VERSION` |
| Venta inexistente o anulada | `NOT_FOUND` |
| Pagos que no cubren, sin medios, descuento mayor que la comida | `VALIDATION` |
| Tarjeta o plan inexistente | `NOT_FOUND` |
| Sin sesión | `UNAUTHENTICATED` |

## Decisiones tomadas durante la implementación

(Se completan a medida que aparecen.)

## Resumen para el dev

(La lista simple de cada commit.)

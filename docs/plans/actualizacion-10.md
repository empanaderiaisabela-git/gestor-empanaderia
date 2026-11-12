# Plan: Actualización 10 · BUG-33 — El mismo cobro se registra dos veces

- **Autor**: Agente · **Fecha**: 2026-11-12 · **Estado**: Aprobado (dev, 2026-11-12: "comienza a arreglar")
- **Ítem**: BUG-33 (nuevo), sección nueva **Actualización 10 · Ventas duplicadas** en `BACKLOG.md`.
- **Rama**: `fix/bug-33-ventas-duplicadas` desde `develop`.
- **Nivel de tests**: 3. Toca schema, repositorio, service y la UI del cobro. Cierra con `npm run verify`.
- **Fuera del commit**: el cambio sin commitear de `src/features/menu/ui/menu-item-fields.tsx` no es de este ítem.

## Contexto

El cliente reporta ventas anotadas dos veces. La consulta en Supabase (últimos 30 días) encontró 7 pares iguales
(mismo vendedor, comprador, total y pedido):

| Par | Segundos entre una y otra | Mismo cliente |
|---|---|---|
| 221/222 | 16,5 | No |
| 214/215 | 25,1 | No |
| 137/138 | 10,1 | Sí |
| 134/135 | 24,9 | Sí |
| 118/119 | 25,3 | No |
| 98/99 | 7,0 | No |
| 80/81 | 15,0 | No |

- Ningún par está a menos de 2 s: no es un doble clic ni un reintento automático de la red.
- No hay ventas en el medio, y el pedido de 15 empanadas se repite a los 7 s: el carrito no se volvió a armar, se
  volvió a confirmar.
- En 5 pares el segundo cobro **creó otra vez el cliente**: el navegador nunca se enteró de que el primero había salido.

Causa:

1. El servidor guarda cualquier pedido que le llega: no tiene forma de reconocer que un cobro ya lo recibió.
2. Si la llamada falla después de guardar (red inestable, demora del servidor), `confirm` (`ui/use-checkout.ts`) y
   `submit` (`ui/checkout-modal.tsx`) no tienen `try/finally`: no aparece "Venta registrada" y el carrito sigue lleno.
   El vendedor confirma otra vez.

No se pudo saber si el vendedor vio un error o el botón trabado (lo dirían los logs de Vercel de esos horarios). El
arreglo cubre las dos cosas.

## Decisiones provisorias del agente

| # | Pregunta | Situación | Qué elegí | Qué cambia si el dev responde otra cosa |
|---|---|---|---|---|
| P-1 | Si llega un cobro repetido, ¿qué ve el vendedor? | Confirma una Coca de $2.500, se corta la red, reintenta: la venta ya estaba. | El mismo aviso de siempre, "Venta registrada por $2.500", y el carrito se vacía. | Un aviso distinto ("Esta venta ya estaba registrada") es un mensaje más en la action. |
| P-2 | ¿Qué dice la pantalla si falla la red? | La computadora del local pierde la conexión, o el servidor tarda, al confirmar. | "No se pudo confirmar. Reintentá." (corto, `ui-texts-minimal`). | Sólo el texto. |
| P-3 | ¿Qué pasa con las 7 ventas repetidas que ya existen? | Ej.: 214 y 215, Jessica Huaquilaf, $10.000. | Las anula el cliente desde Ventas/Pedidos (la segunda de cada par), que devuelve el stock. El código no las toca. Los clientes duplicados quedan. | Un script de limpieza sería un ítem aparte. |
| P-4 | Una pestaña vieja (abierta antes del deploy) cobra sin clave. | El vendedor no recargó desde ayer. | `VALIDATION` con "Recargá la página": la clave es obligatoria. | Con la clave opcional, esa pestaña cobraría sin protección. |

## Cambios por capa

| Capa | Archivo | Cambio |
|---|---|---|
| domain | `domain/checkout.schema.ts` | `checkoutKey: z.uuid('Recargá la página')`, obligatorio. |
| db | `src/lib/db/schema.ts` | `sales.checkout_key uuid` nullable con `unique('sales_checkout_key_unique')`. Migración 0034, sólo aditiva. |
| repository | `repository/sale-writer.repository.ts` | `NewSale.checkoutKey`; `findByCheckoutKey(key): Promise<CheckoutResult \| null>`. |
| service | `services/checkout.service.ts` | Después de `lockFlavors`, si la clave ya tiene venta, la devuelve. El lock serializa dos cobros simultáneos del mismo carrito: el segundo espera, ve el commit del primero y no guarda nada. Si igual chocaran, la restricción única da `DUPLICATE`. |
| store | `store/order.store.ts` | `checkoutKey: crypto.randomUUID()`; `clear()` genera otra. |
| ui | `ui/use-checkout.ts` | Manda la clave; si la llamada tira, devuelve "No se pudo confirmar. Reintentá.". |
| ui | `ui/checkout-modal.tsx` | `setPending(false)` en `finally`. |

## Errores

| Acción inválida | code | Mensaje |
|---|---|---|
| Sin clave o con una que no es uuid | `VALIDATION` | Los datos proporcionados no son válidos. |
| Dos cobros simultáneos con la misma clave que no se serializaron | `DUPLICATE` | ya existente |
| La llamada falla en el navegador | — | No se pudo confirmar. Reintentá. |

## Tests

- Domain: la clave es obligatoria y uuid.
- Service (fake): la misma clave dos veces deja una venta, el mismo `saleId`, un solo descuento de stock y un solo
  cliente. Regresión `regression BUG-33`.
- Contrato: sin clave, `VALIDATION`.
- Integración: dos cobros reales con la misma clave, en serie y simultáneos, dejan una venta, un cliente y el stock
  descontado una vez.
- Store: `clear()` cambia la clave.
- Componente: si `checkoutAction` tira, aparece el aviso, el carrito queda y el botón vuelve a habilitarse.

## Verificación

1. `npm run lint && npm run typecheck`, `npm run test:coverage`.
2. `docker compose up -d --wait db-test` y `npm run test:int`.
3. `npm run db:migrate` en la base local.
4. `npm run verify`.
5. Antes del commit, la lista simple para el dev.

# Plan maestro: Sprint 2 · Promociones, tarjetas, estadísticas y gastos

- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-25 · **Estado**: revisado en T-15
  (2026-10-25) con las respuestas del cliente.
- **Ítem que lo produce**: T-10. Las decisiones del dev, la trazabilidad con `specs.md` y las preguntas para el
  cliente están en [`sprint-1.md`](sprint-1.md).

## Contexto

Con el Sprint 1 cerrado, el local ya vende con su modelo real:

- gustos y bebidas, con precio por presentación;
- stock por gusto;
- el POS del wireframe y 4 medios de pago.

Este sprint completa lo que pidió el cliente:

- promociones;
- cobro en cuotas con recargo;
- las estadísticas del día, con sus KPI y sus dos cuadros;
- el anotador de gastos.

El orden pone primero lo que **cambia la venta** (promos y tarjetas) y después las estadísticas, que la leen.

## Orden de ejecución

| # | Ítem | Depende de | Rama |
|---|---|---|---|
| 0 | T-15 Respuestas del cliente en el backlog | T-13 | `docs/t-15-respuestas-del-cliente` |
| 1 | US-8 Promociones | T-13 | `feat/us-8-promociones` |
| 2 | US-9 Subdivisión Promos en Ventas | US-8 | `feat/us-9-promos-en-ventas` |
| 3 | US-10 Tarjetas y planes de cuotas | T-13 | `feat/us-10-tarjetas` |
| 4 | US-11 Crédito en cuotas | US-10 | `feat/us-11-credito-en-cuotas` |
| 5 | US-12 Estadísticas del día | US-9, US-11 | `feat/us-12-estadisticas-del-dia` |
| 6 | US-13 Cuadros de vendedores y de ventas | US-12 | `feat/us-13-cuadros-de-estadisticas` |
| 7 | US-14 Gastos | T-13 | `feat/us-14-gastos` |
| 8 | BUG-11 Fotos sin validar antes de subir | BUG-1 | `fix/bug-11-validar-fotos` |
| 9 | BUG-13 Costo para el local y precio de venta (en revisión) | US-3, US-4 | `fix/bug-13-costo-y-precio-de-venta` |
| 10 | BUG-14 Errores de base que mandan a sincronizar | BUG-9 | `fix/bug-14-errores-de-base` |
| 11 | T-14 Cierre del Sprint 2 | todos | `docs/t-14-cierre-sprint-2` |

US-14, BUG-11 y BUG-14 no dependen de los demás: se pueden adelantar si un ítem queda bloqueado.

---

## 0 · T-15 Respuestas del cliente en el backlog (S, 30 min)

- Lleva al backlog y a este plan las respuestas que el dev anotó en `specs.md` (líneas 163 a 190). Ver la
  [trazabilidad](#trazabilidad-respuestas-del-cliente--ítems).

## 1 · US-8 Promociones (M, 2 h 20 min)

- **Schema** (propuesta):
  - `promotions`: nombre único `varchar(60)`, `price numeric(10,2) CHECK > 0`, `is_active` y `version`.
  - `promotion_components`: `promotion_id` (con `onDelete cascade`), `group`, presentación y `quantity CHECK > 0`.
  - La presentación tiene que ser válida para su grupo: se valida con la constante de dominio de US-3.
- **Precio**: el admin lo escribe a mano. No se muestra precio de referencia ni hay vigencia: la promo sigue activa
  hasta que el admin la desactiva (cliente).
- **"Una vez agregada, va seleccionada"** (`specs.md`): la promo guardada queda activa y aparece en Ventas. Se
  confirma en `start-task`.
- **Pantalla** `/promociones`, sólo para el admin, con su entrada en el menú y en `proxy.ts`.

## 2 · US-9 Subdivisión Promos en Ventas (M, 3 h)

- **POS**: la subdivisión Promos despliega las promos activas. Al elegir una, un `FlavorPicker` por componente
  (reutiliza el de US-5) completa los gustos.
- **Línea de tipo promo**: lo cobrado es el precio de la promo, y lo consumido son los gustos de cada componente, con
  su costo congelado.
- **Servidor**: la action de cobro (US-6) acepta líneas de promo. El service valida la promo (activa, componentes
  completos, gustos del grupo correcto) y recalcula su precio.
- **Errores**: promo inactiva o inexistente (`NOT_FOUND`), componentes incompletos (`VALIDATION`) y
  `INSUFFICIENT_STOCK`.

## 3 · US-10 Tarjetas y planes de cuotas (M, 2 h)

- **Schema** (propuesta):
  - `cards`: nombre único `varchar(40)`, `is_active` y `version`.
  - `card_plans`: `card_id` (con `onDelete cascade`), `installments CHECK IN (1, 3, 6, 12)` y
    `surcharge_pct numeric(5,2) CHECK BETWEEN 0 AND 100`, con `unique(card_id, installments)`.
- **Pantalla** `/tarjetas`, sólo para el admin.

## 4 · US-11 Crédito en cuotas (M, 2 h)

- `sale_payments` suma tarjeta, cuotas, % y monto del recargo, nulos salvo en Crédito. Un `CHECK` exige los cuatro
  cuando el medio es `credito`.
- El servidor recalcula el recargo desde `card_plans`.
- **Respuestas del cliente**: el recargo cuenta como ganancia (US-12) y el Débito no pide tarjeta.

## 5 · US-12 Estadísticas del día (M, 3 h)

- **Rango**: la jornada del local en `America/Argentina/Buenos_Aires`, de 7:00 a 6:59 del día siguiente, que por
  defecto es la de hoy (dev). Se calcula con una función pura de dominio y tests de frontera (6:59:59 y 7:00
  locales, en UTC).
  - Cierra la brecha de fechas de `architecture.md` para Estadísticas.
  - El selector reemplaza a `DateRangePicker`: un día, y opcionalmente un rango.
- **KPI**:
  - Dinero por grupo, sumando las líneas por grupo, y un cuadro aparte "Promos" (dev).
  - Ganancia en limpio = ventas (con el recargo de las cuotas) − costo para el local congelado (también el de
    los componentes de cada promo) − mermas de la jornada (cliente).
  - Cantidad de ventas.
  - Lo facturado por cada uno de los 4 medios de pago (cliente).
- **KPI heredados que el cliente no nombró** (valor del stock, unidades, pérdidas, órdenes): se quitan (cliente).
- `stats` ya está en la arquitectura objetivo (BUG-5): se extienden su repositorio, su service puro y sus tests.

## 6 · US-13 Cuadros de vendedores y de ventas (M, 2 h)

- **Turno**: función pura `shiftOf(fechaUtc)` en hora de Argentina: mañana de 7:00 a 16:59 y tarde de 17:00 a
  6:59 (cliente). Las horas viven en una constante del dominio; si el cliente pide editarlas desde la UI, es un
  ítem nuevo.
- Los cuadros se arman en el service de `stats` con los datos del día que ya trae US-12.

## 7 · US-14 Gastos (M, 2 h)

- **Schema** (propuesta): `expenses` con `invoice_number varchar(30)` único, `title varchar(100)`,
  `amount numeric(10,2) CHECK > 0`, `invoice_date date`, `user_id`, `version` y timestamps.
- **Pantalla** `/gastos`, sólo para el admin.
- **No afecta Estadísticas**: un test lo demuestra.
- **Respuestas del cliente**: sin foto, número de factura único y fecha de la factura.

## 8 · BUG-11 Fotos sin validar antes de subir (S, 55 min)

- Sin cambios respecto de lo cargado. Pasó del Sprint 1 al 2 porque las fotos son del catálogo público, que hoy no
  es prioridad. Después de T-12, las fotos apuntan al modelo nuevo.

## 9 · BUG-13 Costo para el local y precio de venta (S, 45 min)

- En revisión: integrado en `develop` (2b2877a). Campos, columnas y títulos dicen "Costo para el local" y "Precio de
  venta".

## 10 · BUG-14 Errores de base que mandan a sincronizar (S, 35 min)

- Un `Failed query` sin código conocido pasa a `UNEXPECTED`; `STALE_VERSION` queda sólo para una versión vieja de
  verdad.

## 11 · T-14 Cierre del Sprint 2 (S, 1 h)

- Docs al día, `npm run verify` y, con el OK del dev, merge local `develop → main` ("chore(release): sprint 2") con
  el tag `sprint-2`.

## Trazabilidad: respuestas del cliente → ítems

Respuestas anotadas por el dev en `specs.md`, sección "preguntas que claude code me hizo" (2026-10-25).

| Línea de `specs.md` | Respuesta | Ítem |
|---|---|---|
| 165-166 | Turno mañana desde las 7 y tarde desde las 17 (el local abre de 11 a 16 y de 19 a 1) | US-13 CA-1 y CA-3 |
| 168-169 | El vendedor carga stock. Sobre costos y proveedores, el dev decide que no los ve | US-4 (sin cambios) |
| 172-173 | WhatsApp e Instagram: no hacen falta por ahora | US-1 (pregunta cerrada) |
| 175-176 | "Lo mismo para todos": el dev decide que la surtida de sanguches sigue proporcional | US-6 (sin cambios) |
| 178-179 | Promos sin precio de referencia ni vigencia; ganancia = precio de la promo − costo de lo usado | US-8 CA-2 y CA-3, US-12 CA-2 y CA-3 |
| 181-182 | El recargo cuenta como ganancia; el débito no pide tarjeta | US-11 CA-1, US-12 CA-3 |
| 185-186 | Gastos con fecha de la factura y número único, sin foto | US-14 CA-1 a CA-3 |
| 189-190 | Se quitan los KPI que no nombró; lo facturado va por cada uno de los 4 medios de pago | US-12 CA-5 |
| — | El día de Estadísticas es la jornada de 7:00 a 6:59 (dev) | US-12 CA-1 |

## Riesgos

- **Las respuestas del cliente** ya están en los ítems (T-15). Si al tomar un ítem aparece una duda nueva, se
  pregunta en `start-task`.
- **US-9 y US-11 tocan el cobro de US-6**: tienen que mantener verde su suite de contrato y su E2E.

## Decisiones provisorias del agente

El dev dejó el Sprint 2 corriendo de noche (2026-10-25) y autorizó decidir las dudas nuevas con la opción más
prudente. Cada una tiene la pregunta que le habría hecho, la situación con un ejemplo, qué se eligió y qué cambia si
responde otra cosa. También figura en las notas del ítem del backlog.

### D-1 · Borrar una promoción (US-8)

- **Pregunta**: ¿Una promoción se puede borrar para siempre, o sólo desactivar?
- **Situación**: El admin crea "Docena + Coca" con un error de tipeo y nunca la vendió; otra promo, "Pizza + Pepsi", ya se vendió 30 veces. La historia sólo pide desactivarlas.
- **Qué elegí y por qué**: Se puede borrar sólo si nunca se vendió; si ya se vendió, el sistema no deja ("existen registros relacionados") y hay que desactivarla. Así se corrige un error de carga sin romper el historial de ventas ni los comprobantes.
- **Si respondés otra cosa**: Si querés "sólo desactivar", se quitan el botón Eliminar y `deletePromotionAction` (`src/features/promotion/`). Si querés borrar también las vendidas, habría que guardar el nombre de la promo en cada venta (US-9).

### D-2 · Descuento en una venta con promo (US-9)

- **Pregunta**: Si en una venta hay una promo, ¿se le puede hacer además el descuento de la venta (% o $), o la promo ya es el descuento y no se rebaja más?
- **Situación**: Un cliente lleva la promo "Media + Coca" a $9.000 y una Coca suelta a $2.500 (total $11.500). El vendedor le hace un 10 % de descuento.
- **Qué elegí y por qué**: El descuento se aplica sobre el total de la venta, promos incluidas: $11.500 − 10 % = $10.350. Es como funcionaba el descuento antes de las promos, no frena una venta y no toca datos guardados.
- **Si respondés otra cosa**: Si la promo no admite más descuento, el descuento se calcularía sólo sobre las líneas comunes ($2.500 − 10 % = $2.250, total $11.250): se cambia el cálculo del total en `checkout.service.ts` y en el modal de cobro (`checkout-modal.tsx`).

### D-3 · Importe de una venta con recargo de cuotas (US-11)

- **Pregunta**: En una venta con crédito en cuotas, ¿el total de la venta (el que se ve en Ventas/Pedidos, en el comprobante y en los cuadros de Estadísticas) es lo que pagó el cliente con el recargo, o el precio de los productos sin el recargo?
- **Situación**: Un pedido de $10.000 se paga con $4.000 en efectivo y $6.000 con Visa en 3 cuotas al 10 %. El recargo es $600 y el cliente paga $10.600.
- **Qué elegí y por qué**: El total de la venta es $10.600: lo que realmente cobró el local. El comprobante lo desglosa: subtotal $10.000, recargo de cuotas $600, total $10.600, y el pago con Visa figura por $6.600. El dinero por comida de Estadísticas sigue usando el precio de los productos ($10.000) y el recargo suma a la ganancia y a lo facturado con crédito.
- **Si respondés otra cosa**: Si el total debe ser $10.000, se guarda el total sin el recargo en `checkout.service.ts` y el recargo queda sólo en el pago; el comprobante (`sale-receipt.tsx`) y los cuadros de US-12 y US-13 lo suman aparte.

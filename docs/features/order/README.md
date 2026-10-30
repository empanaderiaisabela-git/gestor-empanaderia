# Feature: pedido (tablero, cobro e historial de ventas)

- **US relacionadas**: US-5 (tablero y pedido actual), US-6 (cobro), US-7 (historial, comprobante y anulación) y
  US-29 (las pizzas y las ciabattas descuentan prepizzas y panes) y US-35 (aviso, orden por precio y buscador en la
  lista de gustos).
- **Código**: `src/features/order/` (domain, store, actions, services, repository, ui, testing). Pantallas en
  `src/app/(main)/ventas/` (Ventas/Pedidos) y `src/app/(main)/ventas/nueva/` (tablero).
- **Datos que usa**: gustos, bebidas, sus precios y stock del feature `menu` (`fetchMenuItems`). Al cobrar escribe en `sales`, `sale_lines`, `sale_line_items`, `sale_payments` y
  `audit_logs`, y descuenta `menu_items.stock` (tablas en `src/lib/db/order-schema.ts` y `schema.ts`).

## Qué hace

El vendedor arma el pedido en un tablero con una subdivisión por grupo (Empanadas, Pizzas, Sanguches, Ciabattas,
Coca-Cola y Pepsi). Cada subdivisión tiene un botón por presentación. Al tocarlo se abre la lista de gustos:

- **Empanadas y Sanguches** (1, 3, 6 y 12): cada gusto tiene **"Agregar uno"** (+1 de ese gusto) y
  **"Completar"** (llena lo que falta con ese gusto). Así se arman las surtidas dentro de la misma presentación.
  A la izquierda, **"Quitar uno"** (rojo) resta una unidad de ese gusto; está apagado si el gusto no tiene unidades
  (US-39). También está en las pizzas de 2 sabores y en todas las filas de las promos.
- **Pizzas**: "1 sabor" pide un gusto; "2 sabores" pide dos gustos distintos (mitad y mitad).
- **Ciabattas y bebidas**: "Agregar" suma una unidad.

La lista queda abierta para seguir cargando hasta tocar "Listo". El "Pedido actual" muestra comida, cantidad,
unidades e importe, el total y los datos del cliente: nombre (obligatorio), teléfono y domicilio, con sugerencias de
Clientes (US-37, ver `docs/features/customer/README.md`). Sin nombre, o con una línea a medio armar ("faltan N"), no
se puede cobrar. Cada renglón común tiene "−" y "+" (US-36): el "+" se apaga si el stock no alcanza (`canAddOne`).

## Reglas de negocio

| Regla | Fuente |
|---|---|
| En una presentación de más de 1 unidad, un gusto con "Completar" se carga para toda la cantidad que falta | `specs.md` (EMPANADAS, SANDWICH y AGREGADO) |
| Surtidas con "Agregar uno" y "Completar" dentro de la misma presentación | `specs.md` (AGREGADO) |
| Precio por gusto en todos los grupos (US-28). Una surtida de Empanadas o de Sanguches: Σ (unidades del gusto ÷ unidades de la presentación × precio de esa presentación del gusto), redondeado a 2 decimales. Con todos los gustos al mismo precio da exactamente el precio de la presentación (7 + 5 a $32.000 la docena = $32.000) | dev, 2026-10-25; D-4 de `sprint-4.md` |
| Cómo se cobra una docena surtida cuando los gustos tengan precios distintos: **pregunta abierta** de US-28 (lo pacta el cliente ese día). Hoy rige la regla proporcional; cambiarla toca sólo `unitLinePrice` | D-4 de `sprint-4.md` |
| Ciabatta: el precio de unidad de su gusto, como una pizza de 1 sabor | US-28 |
| Pizza de 2 sabores: el precio del sabor más caro | `specs.md` y dev |
| Costo de una mitad y mitad: ½ del costo de cada gusto | dev, 2026-10-25; D-1 de `sprint-4.md` |
| Cada pizza (de 1 o 2 sabores) descuenta 1 prepizza y cada ciabatta, 1 pan de ciabatta; también dentro de una promo. El resto de los grupos descuenta de cada gusto | US-29; D-1 y D-11 de `sprint-4.md` |
| No se ofrece un gusto si no alcanza el stock, contando lo que ya está en el pedido | US-5 CA-5 |
| Un gusto de Pizzas o Ciabattas aparece si tiene precio y queda al menos 1 de su base; su stock disponible es el de la base menos lo que ya está en el pedido. Sin bases, la tarjeta del grupo dice "Sin stock de <base>" | US-29 CA-5; D-3 de `sprint-4.md` |
| Una línea incompleta bloquea el cobro, en la pantalla y en el servidor | dev, 2026-10-25 |
| Dos líneas iguales y completas se juntan con cantidad 2 | US-5 |
| Medios de pago: Efectivo, Transferencia, Débito y Crédito; hasta 2 por venta y distintos | `specs.md` y US-6 |
| Descuento: primero el porcentaje y después el monto, como el POS de siempre | US-6 CA-5 |
| En Crédito sólo se registra el medio; tarjeta, cuotas y recargo llegan con US-11 | US-6 |

Las reglas son funciones puras de `domain/`:

- `order-line.ts`: `addFlavor`, `isComplete`, `remaining` y `mergeLine`.
- `order-pricing.ts`: `unitLinePrice`, `linePrice` y `orderTotal`.
- `order-usage.ts`: consumo de stock (`stockUsage`, que lleva a la base lo de Pizzas y Ciabattas; `lineUsage` sigue
  siendo por gusto, para el costo y `sale_line_items`), stock disponible (`availableStock`, con la base) y `lineCost`.
- `order-describe.ts`: textos del pedido.
- `order-validation.ts`: `isValidLine`, `applyDiscount`, `paymentsCover` y los medios de pago.

Corren en el navegador y el servidor las reutiliza al cobrar.

## Cobro (US-6)

"Cobrar" abre un modal con el cliente, el descuento en % y en $, y los 4 medios de pago. Se eligen hasta 2: con
dos, se carga el monto del primero y el segundo se lleva el resto. El navegador manda **sólo** el pedido (grupo,
presentación, gustos con sus unidades y cantidad), el cliente (`buyer`: el cliente elegido o `null`, nombre,
teléfono y domicilio), el descuento y los pagos. Nunca manda precios,
costos ni total: `checkoutSchema` es `strictObject` y rechaza cualquier campo de más.

`checkout.service` hace todo en una transacción:

1. Bloquea los gustos con `SELECT … FOR UPDATE`, de a uno y ordenados por id, para que dos cobros no se traben.
   Después bloquea la base de cada grupo con base que use el pedido (Pizzas y después Ciabattas, `lockBase`).
2. Valida cada línea (`isValidLine`) y que cada gusto esté activo, sea de su grupo y no sea una base.
3. Recalcula los precios con la base, aplica el descuento y controla que los pagos sumen el total.
4. Controla el stock de todos los gustos y recién después lo descuenta, filtrando por `id` y `version`. En Pizzas
   y Ciabattas controla y descuenta la base: una unidad por pizza o ciabatta (`stockUsage`).
5. Vincula al cliente elegido (si se desactivó o se borró, `NOT_FOUND`) o crea uno nuevo, con su log. Guarda la
   venta (vendedor = quien cobra; cliente con el nombre, el teléfono y el domicilio anotados), cada línea con lo cobrado y la descripción de sus
   gustos, lo que consume de cada gusto con el **costo congelado** (mitad y mitad: 0,5 de cada uno) y los pagos.
6. Audita `CREAR` / `SALE`.

Si el cobro sale bien, el pedido se vacía y el tablero vuelve a leer gustos y stock. Si falla, el pedido queda como
estaba, se muestra el motivo y también se recargan precios y stock, porque pueden haber cambiado.

## Crédito en cuotas (US-11)

Al elegir **Crédito** en el modal de cobro aparecen "Tarjeta" (las activas de US-10) y "Cuotas" (los planes de esa
tarjeta, con su recargo). El total a cobrar es el precio original: el recargo lo cobra la emisora de la tarjeta
(dev, 2026-10-27, BUG-20). Débito, efectivo y transferencia no piden tarjeta.

- El recargo se calcula **sólo sobre la parte pagada con crédito** y queda guardado como dato. Ej.: $10.000 con
  $4.000 en efectivo y $6.000 con crédito al 10 % ⇒ el pago guarda un recargo de $600, pero el total de la venta es
  $10.000 y el pago con Visa, $6.000.
- El navegador manda `cardId` e `installments` en el pago con crédito, nunca el % ni el monto del recargo.
  `checkout-payments.ts` lee la tarjeta en la transacción: inexistente o desactivada ⇒ `NOT_FOUND` ("tarjeta"); sin
  ese plan ⇒ `NOT_FOUND` ("plan de cuotas"). Calcula el recargo con el % guardado y lo guarda en el pago
  (`card_id`, `installments`, `surcharge_pct`, `surcharge_amount`).
- Los pagos tienen que cubrir el total de los productos (con descuento), que es el **total de la venta**. El local
  no ve el recargo: lo cobra la emisora de la tarjeta (dev, 2026-10-27, BUG-20; reemplaza la decisión provisoria D-3).
- Un `CHECK` exige que la tarjeta, las cuotas y el recargo vayan juntos y sólo en crédito. Las ventas con crédito
  anteriores a US-11, sin tarjeta, siguen siendo válidas. El `CHECK` compara el medio como texto (`type::text`):
  Postgres no deja usar el valor `credito` del enum en la misma transacción en que se agregó, y una base nueva
  corre todas las migraciones juntas.
- El comprobante muestra cada pago como "Crédito · Visa · 3 cuotas" por su monto, sin el recargo; el historial, la
  misma etiqueta. Una tarjeta ya usada en un cobro no se puede borrar (FK sin cascada).

## Promos en el tablero (US-9)

La subdivisión **Promos** del tablero lista las promos activas (US-8) con su precio de venta. Una promo con un
producto cuyo grupo no tiene gustos activos queda deshabilitada.

- Elegir una promo la suma al pedido y abre la lista de gustos de su primer producto. Cada producto se abre en
  tantas partes como su cantidad: "2 × Coca-Cola · 1 unidad" pide dos bebidas, que pueden ser distintas.
- La lista es la misma del tablero ("Agregar uno", "Completar", sólo gustos con stock), pero dice "En la promo" en
  lugar del precio: se cobra el precio de la promo. El título va en tres renglones: la promo, el producto y "(1 de
  N)". No avanza sola (US-39): "Siguiente" se habilita con el producto completo y en el último dice "Listo" y
  cierra. Para dejarla a medio armar se cierra con la X.
- En el pedido, la promo aparece como "Promo · <nombre>" con sus gustos y su precio. A medio armar muestra
  "faltan gustos · elegir", que retoma donde quedó, y bloquea el cobro. Se pueden sumar varias, iguales o distintas.

Al cobrar, el navegador manda cada promo como `{ promotionId, quantity, parts }`, con los gustos de cada parte y
sin precios. `checkout-promos.ts`, dentro de la misma transacción del cobro:

1. Lee la promo: si no existe o está desactivada, `NOT_FOUND`.
2. Controla que las partes sean exactamente las de sus productos, en orden (`expandComponents`); si no,
   `VALIDATION`.
3. Suma los gustos de las partes al bloqueo, la validación de grupo y el control de stock del resto del pedido.
4. Cobra el precio de la promo guardado en la base, por la cantidad. El descuento de la venta se aplica sobre el
   total, promos incluidas (decisión provisoria D-2).
5. Guarda una línea con `promotion_id`, sin grupo ni presentación, con la descripción "<promo>: <gustos>" y lo
   que consumió de cada gusto con el costo congelado.

Una promo que ya se vendió no se puede borrar: la FK de `sale_lines.promotion_id` no tiene cascada y el borrado
devuelve `HAS_RELATIONS` (decisión provisoria D-1).

## Historial, comprobante y anulación (US-7)

**Ventas/Pedidos** (`/ventas`) es el historial: fecha y hora de Argentina, comprador ("Sin nombre" si no hay),
vendedor, el pedido, los medios de pago, el descuento y el total, con búsqueda por comprador o vendedor y filtro por
fechas (días de Argentina, con `argentinaDay`). **"Nuevo pedido"** abre el tablero; reemplaza al "Nueva Venta" del
POS viejo ("Consideraciones del primer sprint" de `specs.md`).

- **Comprobante**: la marca, comprador y vendedor, el teléfono y el domicilio si los tiene, cada línea con su presentación y sus gustos (también la mitad y
  mitad), el subtotal, los descuentos, el total y cada pago. Se imprime con el navegador.
- **Anular** (sólo admin), en `sale-history.service` y en una transacción:
  1. Bloquea la venta con `SELECT … FOR UPDATE`. Si ya no está, `NOT_FOUND`: una venta no se anula dos veces.
  2. Repone el stock de cada gusto con lo que guardó el cobro (`sale_line_items`). Los gustos se bloquean ordenados
     por id, como en el cobro. Lo de Pizzas y Ciabattas se suma por grupo y vuelve a la base: ½ + ½ = 1 prepizza
     (US-29, D-8). Así anda igual con las ventas cobradas antes del cambio, que guardaron ½ de cada gusto.
  3. Borra los pagos y la venta (las líneas se borran en cascada) y audita `ELIMINAR` / `SALE` con lo que tenía.

El historial muestra sólo las ventas del modelo nuevo (con líneas). Las del POS viejo quedan hasta que T-12 las
borre.

## Errores

| Situación | Código | Mensaje | Test |
|---|---|---|---|
| Sin sesión | `UNAUTHENTICATED` | No autorizado (Token faltante) | `checkout.contract.test.ts` |
| Entrada mal formada o con precios, costos o total | `VALIDATION` | Los datos proporcionados no son válidos. | `checkout.contract.test.ts` |
| Línea incompleta, gusto de otro grupo o dado de baja, gusto sin precio, descuento mayor al total o pagos que no suman | `VALIDATION` | idem | `checkout-errors.test.ts` |
| Un gusto que ya no existe | `NOT_FOUND` | El producto ya no existe. | `checkout-errors.test.ts` |
| Un gusto no alcanza | `INSUFFICIENT_STOCK` | No hay stock suficiente de {gusto}. | `checkout-errors.test.ts` y `checkout.service.int.test.ts` |
| No alcanzan las prepizzas o los panes (US-29) | `INSUFFICIENT_STOCK` | No hay stock suficiente de Prepizza. (o de Pan de ciabatta) | `checkout-bases.test.ts`, `checkout.contract.test.ts` y `sale-history.service.int.test.ts` |
| Vender una base como gusto (US-29, D-2) | `VALIDATION` | Los datos proporcionados no son válidos. | `checkout-bases.test.ts` |
| Falta la base del grupo, al cobrar o al anular (US-29) | `NOT_FOUND` | El producto ya no existe. | `checkout-bases.test.ts` y `sale-history-bases.test.ts` |
| Crédito sin tarjeta o sin cuotas, o tarjeta en otro medio (US-11) | `VALIDATION` | Los datos proporcionados no son válidos. | `checkout.schema.test.ts` |
| Tarjeta inexistente o desactivada (US-11) | `NOT_FOUND` | La tarjeta ya no existe. | `checkout-payments.test.ts` |
| Plan de cuotas que la tarjeta no tiene (US-11) | `NOT_FOUND` | El plan de cuotas ya no existe. | `checkout-payments.test.ts` |
| Promo inexistente o desactivada (US-9) | `NOT_FOUND` | La promoción ya no existe. | `checkout-promos.test.ts`, `checkout.contract.test.ts` |
| Partes de la promo que no coinciden con sus productos, gustos incompletos o de otro grupo (US-9) | `VALIDATION` | Los datos proporcionados no son válidos. | `checkout-promos.test.ts` |
| Otro movimiento cambió el gusto entre el bloqueo y el guardado | `STALE_VERSION` | mensaje de concurrencia | `checkout-errors.test.ts` |
| Anular: el vendedor lo intenta | `FORBIDDEN` | Solo los administradores pueden realizar esta acción | `sale-history.contract.test.ts` |
| Anular: la venta no existe o ya se anuló | `NOT_FOUND` | La venta ya no existe. | `sale-history.contract.test.ts` y `sale-history.service.int.test.ts` |
| Anular: id inválido | `VALIDATION` | Los datos proporcionados no son válidos. | `sale-history.contract.test.ts` |
| Anular: un gusto ya no existe, o cambió en el medio | `NOT_FOUND` / `STALE_VERSION` | idem | `sale-history.service.test.ts` |

En el modal, antes de llegar al servidor (`ui/checkout-form.ts`): "El descuento va de 0 a 100 %", "El descuento no
puede ser negativo", "El descuento no puede dejar el total en $0", "Elegí un medio de pago" y "Los pagos tienen
que sumar el total".

## Roles y permisos

| Acción | admin | vendedor |
|---|---|---|
| Usar el tablero (`/ventas/nueva`) | Sí | Sí |
| Cobrar (`checkoutAction`) | Sí | Sí |
| Ver Ventas/Pedidos y el comprobante (`fetchSaleHistory`) | Sí | Sí |
| Anular una venta (`voidSaleAction`) | Sí | No |

## Pantallas

`src/app/(main)/ventas/page.tsx` → `SaleHistoryPanel` (`use-sale-history.ts`): la grilla y las tarjetas
(`sale-history-columns.tsx`), "Nuevo pedido", el comprobante (`sale-receipt.tsx`) y la confirmación de anulación.

`src/app/(main)/ventas/nueva/page.tsx` → `OrderBoard`:

- `GroupCard` por grupo, rellena con el color de su grupo y con su ícono de lucide (US-20; Empanadas y Ciabattas usan íconos propios de `src/components/icons/`; `src/config/group-theme.ts`
  y `src/app/group-colors.css`, que también usa el KPI de dinero por comida), "N en pedido" y botones de presentación
  con el precio: si todos los gustos valen lo mismo, ese precio; si no, "desde $X" (el más bajo).
  Avisa si el grupo no tiene gustos y deshabilita los botones.
- `FlavorPicker` / `FlavorRow`: gustos con su precio ("Sin precio" no se puede agregar) y stock disponible, y los
  botones según la presentación. Van del más barato al más caro según el precio de la presentación (a igual precio,
  por nombre; sin precio, al final), con un buscador "Buscar gusto" que ignora mayúsculas y acentos
  (`domain/flavor-list.ts`, US-35). Al agregar, un aviso verde (`AddedToast`) baja desde arriba, dice "Se agregó
  <gusto> al pedido" y se desvanece a los 3 s.
- `OrderDrawer` (US-24): un botón flotante abajo a la derecha, con el ícono `Ticket` y un número que cuenta los
  productos (una docena suma 1, una promo suma 1), abre desde la derecha el panel con `CurrentOrder`. Se cierra con
  la X, con Escape o tocando afuera; Cobrar lo cierra y abre el cobro.
- `CurrentOrder` / `OrderTable`: el pedido, con el total, Vaciar y Cobrar (verde, `emerald-700`).
- `CheckoutModal` / `PaymentPicker` (`use-checkout.ts`): el cobro.

Al tablero se entra con "Nuevo pedido", desde Ventas/Pedidos.

## Tests

- Unit y fuzz: `domain/*.test.ts` (la suma de unidades nunca supera la presentación; con precios iguales, la surtida
  cuesta lo mismo que la entera; el schema del cobro nunca lanza), `store/order.store.test.ts` y
  `ui/checkout-form.test.ts` y `ui/sale-history-filter.test.ts`.
- Servicio con el fake: `services/checkout.service.test.ts`, `services/checkout-errors.test.ts`,
  `services/checkout-bases.test.ts` y `services/sale-history-bases.test.ts` (US-29: bases, costo congelado de los
  gustos, promos y ventas viejas) y `services/sale-history.service.test.ts` (el fake del historial lee el mismo
  estado que el del cobro).
- Fuzz de `stockUsage` (nunca da negativo y suma una base por cada pizza o ciabatta): `domain/order-usage.test.ts`.
- Contrato: `actions/checkout.contract.test.ts` (un valor adulterado no cambia lo que se guarda; fuzz) y
  `actions/sale-history.contract.test.ts` (roles, errores y fuzz de la anulación).
- Integración: `services/checkout.service.int.test.ts` (lo guardado en Postgres; dos cobros simultáneos de la última
  unidad; un gusto que no alcanza no deja nada a medias) y `services/sale-history.service.int.test.ts` (líneas en
  orden, la prepizza descontada y devuelta, sin prepizzas `INSUFFICIENT_STOCK`, dos anulaciones simultáneas, ventas
  viejas fuera del historial).
- Componente: `ui/*.test.tsx` (tarjeta de grupo, lista de gustos, pedido actual, tablero, cobro, grilla de ventas,
  comprobante y panel).
- Contraste WCAG AA de los textos sobre el color de cada grupo, en claro y oscuro: `src/test/group-colors-contrast.test.ts`.
- E2E: `tests/tablero-ventas.spec.ts` (también el color real de cada grupo) y `tests/cobro.spec.ts` (armar, cobrar con efectivo y débito, y ver el stock
  descontado en `/stock`) y `tests/historial-ventas.spec.ts` ("Nuevo pedido", la venta en la grilla, el comprobante y
  la anulación que repone el stock) y `tests/prepizzas.spec.ts` (US-29: 2 prepizzas, una mitad y mitad y una Muzza, y
  los gustos de pizza desaparecen de Ventas). Es el único E2E que vende pizzas, porque el contador de prepizzas es
  uno solo y los E2E corren en paralelo.

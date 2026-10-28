# Plan maestro: Sprint 4 · Pedido del cliente tras la demo

- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-28 · **Estado**: aprobado por el dev (2026-10-28),
  con la D-4 corregida después de la aprobación (ver la D-4)
- **Ítem que lo produce**: T-21.

## Contexto

El cliente vio la demo del Sprint 3 y pidió 5 cambios, que el dev dejó textuales en `docs/requerimientos/specs.md`
("Pedido del cliente después de la demo de la sprint 3", líneas 225 a 241):

- Todos los precios en Stock, también los de Empanadas y Ciabattas, para que un gusto pueda tener su propio precio.
- Gastos con el proveedor que emitió la factura.
- Clientes con sólo el nombre obligatorio.
- **Cambio de regla de negocio**: de pizzas y ciabattas no se stockea cada gusto, sino las prepizzas y los panes de
  ciabatta. Los gustos siguen existiendo, con su costo y su precio de venta, pero cada venta descuenta una prepizza o
  un pan.
- Títulos más grandes y letras que se lean mejor.

El Sprint 3 se cerró antes, tal como lo vio el cliente (tag `sprint-3`), así que hay un punto al que volver antes del
cambio de modelo.

## Decisiones del dev (2026-10-28)

| Tema | Decisión |
|---|---|
| Sprint | El Sprint 3 se cierra como está y estos cambios van en un Sprint 4. |
| Costo y precio de los gustos de pizza y ciabatta | Se cargan **en Stock, sin cantidad**. Las prepizzas y los panes tienen su propio formulario, que pide sólo la cantidad. |
| Prepizzas y panes | **Vienen dados de alta con el sistema**: en Stock se elige la base y se carga su cantidad. |
| Proveedor del gasto | **Obligatorio**. |
| Pérdida de una prepizza o un pan | **Sólo baja el contador**: no resta de la ganancia, porque la base no tiene costo. |
| Migración | Los contadores de prepizzas y panes **arrancan en 0**. El stock por gusto de pizza y ciabatta se descarta, y el administrador carga lo que hay. |
| Letras | El cliente vio la demo en modo claro. El pedido es **más contraste en los dos temas**: en claro, letras bien oscuras; en oscuro, blancos bien claros. |
| Autonomía | Igual que en el Sprint 3: cada ítem se commitea, se integra a `develop` y se sube sin esperar el OK del dev, con una lista simple para revisar después. El cierre (merge a `main` y tag `sprint-4`) espera su OK. |
| Subagentes | Permitidos con `delegate-task` (Haiku, Sonnet u Opus; nunca Fable). |
| Cambiar un precio | **Todos los gustos** tienen en Stock un formulario "Costo y precio", sin cantidad. "Ingresar stock" sigue aceptando precios opcionales. Reemplaza la decisión del Sprint 3 "sólo en Ingresar stock". |
| Aplicar a todos | Al cargar el precio de un gusto, una casilla lo copia a **todos los gustos del grupo** (US-28). |
| Bases en Stock | **Fila al tope de su grupo**: "Prepizza" es la primera fila de Pizzas y "Pan de ciabatta", la primera de Ciabattas. |
| Proveedores en Gastos | **Sólo los activos**. Al editar un gasto, también aparece su proveedor aunque esté desactivado. |
| Contraste | **Sólo el panel de gestión**: el catálogo público no se toca. Crecen los títulos de página (`text-3xl` → `text-4xl`) y los de sección (un escalón), y los encabezados de tabla pasan a casi negro en claro y casi blanco en oscuro. |
| Stock para el vendedor (US-31, pedido en el chat) | El vendedor **entra a Stock sólo para mirar**: ve categoría, gusto y cantidad, sin costo ni precio de venta y sin botones. |

## Decisiones provisorias del agente

### D-1 · Qué descuenta una mitad y mitad

- **Pregunta**: una pizza de 2 sabores hoy consume ½ del stock de cada gusto. ¿Qué descuenta ahora?
- **Situación**: el vendedor cobra una mitad Muzzarella y mitad Napolitana. Al local, armar una Muzzarella le cuesta
  $3.000 y una Napolitana $4.000.
- **Elegido**: descuenta 1 prepizza. El costo congelado sigue siendo ½ + ½ ($3.500) y el precio, el del gusto más
  caro, como hoy.
- **Si el dev responde otra cosa**: cambia sólo el costo de la línea en el cobro de US-29.

### D-2 · Dónde viven las prepizzas y los panes

- **Pregunta**: ¿las bases aparecen en Alta de productos o en Ventas?
- **Situación**: el administrador abre Alta de productos para dar de alta un gusto de pizza nuevo.
- **Elegido**: las bases viven sólo en Stock. No se pueden borrar, renombrar ni vender solas. Su ingreso pide cantidad
  y proveedor (opcional, como hoy), sin costo.
- **Si el dev responde otra cosa**: se muestran también en Alta, sólo para lectura. Es un cambio de UI de US-29.

### D-3 · Cuándo Ventas muestra un gusto de pizza o de ciabatta

- **Pregunta**: US-19 esconde los gustos sin stock. Si los gustos de pizza ya no tienen stock, ¿cuándo aparecen?
- **Situación**: quedan 3 prepizzas. Napolitana tiene precio; Fugazzeta se dio de alta ayer y todavía no.
- **Elegido**: un gusto de pizza aparece si queda al menos 1 prepizza y el gusto tiene precio. Napolitana aparece y
  Fugazzeta no. Con los gustos de ciabatta pasa lo mismo, pero con el pan. Los demás grupos siguen con la regla de
  US-19.
- **Si el dev responde otra cosa**: los gustos se muestran siempre y el cobro avisa que no quedan bases. Nivel 2.

### D-4 · Precio por gusto de Empanadas y Ciabattas (corregida)

- **Pregunta**: "Todos los precios van en stock" para que "las empanadas se vendan con precios diferentes por gusto".
  ¿Cómo se cobra una docena con gustos mezclados?
- **Situación**: hoy el local vende la docena al mismo precio, sea cual sea el gusto. El cliente quiere cargar el
  precio de cada gusto por si algún día cambia.
- **Elegido**: Empanadas y Ciabattas pasan a precio por gusto, como Sanguches y Pizzas. La docena surtida se cobra con
  la regla que ya usan los Sanguches: Σ (unidades del gusto ÷ 12 × precio de la docena del gusto). Con todos los
  gustos al mismo precio, da el precio de la docena: 7 de Carne y 5 de Pollo a $30.000 dan $30.000. Es la regla de
  hoy, sin código nuevo. La migración copia el precio de grupo que haya a cada gusto antes de borrar
  `menu_group_prices`, así los precios de hoy no cambian.
- **Corrección**: en el plan aprobado decía que las empanadas "vuelven a tener precio por gusto, como en US-17". No es
  así: en US-17 el precio también era del grupo, y se editaba desde Ingresar stock. El precio por gusto es nuevo.
- **Respuesta del dev (2026-10-28)**: de acuerdo. Hoy todas las docenas valen lo mismo y se cobra el precio de la
  docena. Cómo se cobra una docena surtida cuando los gustos tengan precios distintos lo pacta el cliente ese día: es
  una pregunta abierta de US-28.
- **Si el cliente elige otra regla**: por ejemplo, el precio del gusto más caro, como la mitad y mitad. Cambia sólo
  `unitLinePrice` en `order-pricing.ts`, sin tocar la base ni las pantallas.

### D-5 · Gastos ya cargados sin proveedor

- **Pregunta**: el proveedor es obligatorio, pero los gastos que ya están en la base no tienen. ¿Qué pasa con ellos?
- **Situación**: la factura 0001-123 de la luz se cargó la semana pasada, sin proveedor.
- **Elegido**: la columna queda opcional en la base y Zod la exige al crear y al editar. La grilla muestra "—" en los
  gastos viejos, y al editarlos se pide el proveedor. El selector muestra los proveedores activos y, si el del gasto
  fue dado de baja, también ese.
- **Si el dev responde otra cosa**: se crea un proveedor "Sin proveedor" y la migración se lo asigna a los gastos
  viejos, con la columna `notNull`. Nivel 3.

### D-6 · Qué datos del cliente quedan opcionales

- **Pregunta**: el cliente nombra el teléfono y el DNI. ¿El correo también es opcional?
- **Situación**: el vendedor da de alta a "Juana" sin más datos.
- **Elegido**: sí, porque dice "ni ningún otro dato será necesario". El DNI vacío pasa a `null` y sigue siendo único
  cuando se carga. Hoy se guarda como `''` y es único, así que dos clientes sin DNI chocarían.
- **Si el dev responde otra cosa**: el correo vuelve a ser obligatorio en el Zod de US-26. Nivel 2.

### D-7 · Cómo se sube el contraste

- **Pregunta**: ¿el contraste se sube en un lugar central o componente por componente?
- **Situación**: los colores del texto no salen de un token: son clases `text-zinc-*` sueltas en unos 50 componentes.
  El texto secundario hoy es `text-zinc-500` en claro y `dark:text-zinc-400` en oscuro.
- **Elegido**: el título de página pasa de `text-3xl` a `text-4xl`, y cada gris de texto sube un escalón de contraste
  con un reemplazo mecánico de clases (por ejemplo, `text-zinc-500` → `text-zinc-700` y `dark:text-zinc-400` →
  `dark:text-zinc-200`). El texto secundario queda en ≥ 7:1 en los dos temas.
- **Si el dev responde otra cosa**: se crean tokens de texto en `globals.css` y los componentes pasan a usarlos. Lleva
  más tiempo, pero deja un solo lugar para el próximo ajuste.

### D-8 · Qué devuelve la anulación de una venta con pizza o ciabatta

- **Pregunta**: anular una venta hoy devuelve al stock de cada gusto lo que consumió. ¿Qué devuelve ahora?
- **Situación**: se anula una venta con una mitad Muzzarella y mitad Napolitana. El cobro guardó ½ de cada gusto.
- **Elegido**: devuelve tantas bases como pizzas (o ciabattas) tenía la venta, sumando las unidades guardadas de los
  gustos: ½ + ½ = 1 prepizza. Así anda igual con las ventas cobradas antes del cambio.
- **Si el dev responde otra cosa**: las ventas anteriores al cambio no devuelven nada. Cambia sólo la anulación de
  US-29.

### D-9 · El catálogo público y el stock de las pizzas

- **Pregunta**: el catálogo público marca "sin stock" según el stock de cada gusto. Los gustos de pizza ya no tienen.
- **Situación**: quedan 4 prepizzas y un cliente mira la Napolitana en el catálogo.
- **Elegido**: un gusto de pizza figura con stock si queda al menos 1 prepizza; uno de ciabatta, si queda 1 pan.
- **Si el dev responde otra cosa**: los gustos de pizza y ciabatta figuran siempre con stock. Nivel 1.

### D-10 · Borrar un proveedor que tiene gastos

- **Pregunta**: ¿qué pasa al borrar un proveedor que ya figura en un gasto?
- **Situación**: el administrador borra "Distribuidora Sur", que emitió la factura 0001-456.
- **Elegido**: no se puede: da `HAS_RELATIONS`, igual que hoy un proveedor con ingresos de stock. Se puede
  desactivar.
- **Si el dev responde otra cosa**: el gasto queda sin proveedor (`onDelete: set null`). Nivel 3.

### D-11 · Promos con pizza o ciabatta

- **Pregunta**: una promo que incluye una pizza, ¿qué stock descuenta?
- **Situación**: la promo "2 pizzas + 1 Coca" se vende con una Muzzarella y una Napolitana.
- **Elegido**: lo mismo que la venta suelta: 2 prepizzas y 1 Coca-Cola. El costo congelado es el de cada gusto.
- **Si el dev responde otra cosa**: no hay alternativa razonable; se pregunta de nuevo si aparece un caso.

## Orden de ejecución

| # | Ítem | Depende de | Rama |
|---|---|---|---|
| 0 | T-21 Backlog del Sprint 4 desde el pedido del cliente | T-18 | `docs/t-21-backlog-sprint-4` |
| 1 | US-26 Clientes: sólo el nombre es obligatorio | T-21 | `feat/us-26-cliente-solo-nombre` |
| 2 | US-30 Títulos más grandes y letras con más contraste | T-21 | `feat/us-30-contraste` |
| 3 | US-27 Gastos: el proveedor de la factura | T-21 | `feat/us-27-gasto-con-proveedor` |
| 4 | US-28 Todos los precios en Stock | T-21 | `feat/us-28-precios-por-gusto` |
| 5 | US-29 Prepizzas y panes de ciabatta | US-28 | `feat/us-29-prepizzas-y-panes` |
| 6 | US-31 El vendedor ve el stock, sin costos | US-29 | `feat/us-31-stock-para-vendedor` |
| 7 | T-22 Cierre del Sprint 4 | todos | `docs/t-22-cierre-sprint-4` |

Primero van los dos ítems chicos que no tocan el stock. US-28 va antes de US-29 porque los dos tocan los precios de
Stock, y US-29 parte de los precios por gusto.

---

## 0 · T-21 Backlog del Sprint 4 (S, 30 min)

- Sección del Sprint 4 en `BACKLOG.md` y este plan.
- El pedido del cliente, textual, al final de `specs.md`.

## 1 · US-26 Clientes con sólo el nombre (S, 1 h)

- `src/features/customer/domain/customer.schema.ts`: teléfono, correo y DNI opcionales; si se cargan, se validan como
  hoy.
- `src/lib/db/schema.ts`: `document_number` admite `null`, con migración de `''` a `null`. Postgres permite varios
  `null` en una columna `unique`.
- `customer.repository.ts` está en `eslint-legacy.json` y busca el DNI con `sql`: si se toca, sale de la lista.
- Nivel 3 (schema).

## 2 · US-30 Títulos y contraste (M, 1 h 30 min)

- `src/components/ui/page-header.tsx`: `text-3xl` → `text-4xl`. Los títulos de sección suben un escalón.
- Reemplazo mecánico de las clases de texto gris (D-7) en el panel de gestión, también en los encabezados de tabla.
  El catálogo público (`src/app/home/`, `src/app/product/`) no se toca. Capturas en los dos temas.
- Nivel 1.

## 3 · US-27 Gastos con proveedor (M, 1 h 30 min)

- `src/lib/db/expense-schema.ts`: `provider_id` con FK a `providers`, opcional en la base (D-5).
- Formulario de gastos con un selector de proveedores (el `Combobox` de `src/components/ui/`), obligatorio en Zod.
- Grilla con la columna Proveedor.
- Nivel 3 (schema).

## 4 · US-28 Todos los precios en Stock (M, 3 h)

- Sale de Alta lo que agregó US-23 (`group-price-card`, `save-menu-group-prices`, `menu-group-price.service`), y
  `menu_group_prices` se borra con migración después de copiar sus precios a cada gusto (D-4).
- `isPricedByGroup` deja de existir: Empanadas cobra como Sanguches y Ciabattas como Pizzas (`order-pricing.ts`,
  `flavor-row.tsx`, `group-card.tsx`, `catalog.ts`).
- `menu_items_prices_check` acepta precios por gusto en Empanadas (1, 3, 6 y 12) y Ciabattas (1).
- Cada gusto tiene en Stock "Costo y precio", sin cantidad, con una casilla para copiar el precio a todos los gustos
  del grupo. US-29 lo reusa para los gustos de pizza y ciabatta.
- Nivel 3 (schema y cobro).

## 5 · US-29 Prepizzas y panes de ciabatta (L, 5 h 30 min · plan propio)

- Modelo de las bases, migración, Stock (la base como primera fila de su grupo), cobro, promos, anulación (D-8),
  pérdidas, Ventas (D-3) y catálogo (D-9).
- Archivos clave: `src/lib/db/menu-schema.ts` (los checks de stock entero y medio), `src/lib/db/stock-schema.ts`,
  `src/features/order/domain/order-line.ts`, el cobro y la anulación en `src/features/order/services/`, y
  `src/features/stock/`.
- Nivel 3.

## 6 · US-31 El vendedor ve el stock, sin costos (M, 1 h 30 min)

- `src/config/navigation.ts` y `src/proxy.ts`: "Stock" entra al menú del vendedor.
- Una lectura del stock para el vendedor con su propio `RowSchema` (categoría, gusto y cantidad). El costo y el
  precio no salen del servidor.
- La grilla del vendedor no tiene botones, y las acciones de Stock siguen siendo sólo del administrador.
- Nivel 3 (seguridad).

## 7 · T-22 Cierre del Sprint 4 (S, 1 h)

- `npm run verify` completo y todos los E2E.
- README, `docs/architecture.md` y `docs/initial_prompt.md` al día.
- Con el OK del dev, merge local `develop → main` con el tag `sprint-4`.

## Trazabilidad: `specs.md` → ítems

| Línea de `specs.md` | Pedido | Ítem |
|---|---|---|
| 227 | Todos los precios en Stock; nada de precios en Alta | US-28 |
| 229 | Gastos con el proveedor de la factura | US-27 |
| 231 | Clientes: sólo el nombre es obligatorio | US-26 |
| 233 a 237 | Sólo se stockean prepizzas y panes; cada venta de pizza o ciabatta descuenta uno | US-29 |
| 239 | Las prepizzas y los panes vienen dados de alta con el sistema | US-29 |
| 241 | Títulos más grandes y letras más claras de leer | US-30 |
| — (pedido del dev en el chat) | El vendedor ve el stock, sin costos | US-31 |

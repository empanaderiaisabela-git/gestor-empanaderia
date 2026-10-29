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

### D-12 · Los gustos de pizza y ciabatta en la grilla de Stock

- **Pregunta**: si Prepizza y Pan de ciabatta pasan a ser categorías y Pizzas y Ciabattas salen de "Ingresar stock",
  ¿dónde se cargan el costo y el precio de cada gusto?
- **Situación**: sube la harina y el administrador quiere cambiar el precio de la Napolitana.
- **Elegido**: los gustos siguen en la grilla, con su categoría (Pizzas o Ciabattas) y el stock en "—", sólo con
  "Costo y precio". Así se respeta el pedido del cliente de tener todos los precios en Stock. El vendedor no ve esas
  filas: no tienen stock y él no ve precios.
- **Si el dev responde otra cosa**: los precios de esos gustos vuelven a Alta de productos. Nivel 2.

### D-13 · Rango de Gastos por defecto

- **Pregunta**: "con la fecha del mes", ¿del 1 a hoy o del 1 al último día?
- **Situación**: el 28 de octubre se carga una factura con fecha del 30.
- **Elegido**: del 1 al último día del mes en curso, en hora de Argentina; la factura del 30 se ve. La X limpia el
  filtro y muestra todos los gastos.
- **Si el dev responde otra cosa**: "Hasta" arranca en hoy. Nivel 1.

### D-14 · Rango de Estadísticas

- **Pregunta**: ¿cómo se cuentan los días del rango y hasta dónde puede llegar?
- **Situación**: el administrador elige del 1 al 31 de octubre.
- **Elegido**: se cuentan jornadas, de 7 a 7 como hoy: desde las 7:00 del 1 hasta las 6:59 del 1 de noviembre.
  "Hasta" no puede ser anterior a "Desde", y el rango máximo es de 366 días (`VALIDATION`).
- **Si el dev responde otra cosa**: el tope cambia o se saca. Nivel 2.

### D-15 · Dónde van los arreglos de la revisión

- **Pregunta**: ¿los arreglos de la revisión entran al Sprint 4 o van a un Sprint 5?
- **Situación**: el Sprint 4 todavía no está en `main`, y uno de los arreglos corrige US-29.
- **Elegido**: entran al Sprint 4, antes del merge a `main`, en el mismo modo autónomo.
- **Si el dev responde otra cosa**: se cierra el Sprint 4 sin ellos y pasan al Sprint 5. Nivel 1 (sólo docs).

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
| 7 | BUG-23 Stock: Prepizza y Pan de ciabatta como categorías | US-31 | `fix/bug-23-bases-como-categorias` |
| 8 | BUG-24 La grilla tiembla al arrastrar el scroll hasta el fondo | BUG-23 | `fix/bug-24-scroll-de-la-grilla` |
| 9 | US-33 Gastos: filtro desde y hasta | US-27 | `feat/us-33-gastos-por-fecha` |
| 10 | US-32 Estadísticas: desde y hasta | US-21 | `feat/us-32-estadisticas-por-rango` |
| 11 | T-22 Cierre del Sprint 4 | todos | `docs/t-22-cierre-sprint-4` |

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

## Revisión del dev (2026-10-28)

El dev revisó el Sprint 4 antes del merge a `main` y pidió cuatro arreglos. No hay migraciones nuevas.

- **BUG-23** (S, nivel 2): sólo UI.
  - `src/features/stock/domain/stock-categories.ts` define las categorías de Stock. Prepizza y Pan de ciabatta son
    categorías, y Pizzas y Ciabattas quedan sólo para "Costo y precio" (D-12).
  - En "Ingresar stock", elegir Prepizza o Pan de ciabatta toma la base y oculta "Gusto o bebida".
  - El servidor ya rechaza ingresos y pérdidas de gustos de pizza y ciabatta.
- **BUG-24** (XS, nivel 2): `virtualized-data-table.tsx`.
  - Se reproduce en el navegador arrastrando la barra y midiendo `scrollTop`.
  - Causa probable: `scroll-smooth` en el Scroller y el alto fijo de 64 px, cuando las filas de Stock son más altas.
- **US-33** (S, nivel 2): "Desde" y "Hasta" en Gastos, del lado del cliente, como el historial de ventas. Arranca
  con el mes en curso (D-13).
- **US-32** (M, nivel 3): "Desde" y "Hasta" en Estadísticas.
  - La acción recibe `{ from, to }`, con jornadas de 7 a 7 y un tope de 366 días (D-14).
  - El repositorio ya filtra por rango.

## Segunda revisión del dev (2026-10-29)

- **BUG-25** (S, nivel 2): "Ingresar stock" vuelve a ofrecer Pizzas y Ciabattas, pero sólo para el costo y el precio
  de un gusto, sin cantidad ni proveedor. Guarda con `setStockPricingAction` (US-28), igual que "Costo y precio".
- **US-34** (S, nivel 2): desplegable a la izquierda del filtro de categoría para ordenar por stock o quedarse con lo
  que falta (`src/features/stock/domain/stock-order.ts`, D-16).

### D-16 · Los gustos sin stock propio al ordenar

- **Pregunta**: un gusto de pizza no tiene stock propio (depende de las prepizzas). ¿Dónde va al ordenar por stock y
  cuenta como "sin stock"?
- **Situación**: quedan 0 prepizzas y el administrador elige "Solo sin stock".
- **Elegido**: al ordenar, esos gustos van al final; "Solo sin stock" muestra la Prepizza (que es la que falta) y no
  los gustos, y "Quitar sin stock" los deja.
- **Si el dev responde otra cosa**: los gustos toman el stock de su base al ordenar y filtrar. Nivel 2.

### D-17 · El formulario de precio de una pizza

- **Pregunta**: al elegir Pizzas en "Ingresar stock", ¿qué campos van?
- **Situación**: el administrador sube el precio de la Napolitana.
- **Elegido**: el gusto, "Costo para el local" y "Precio de venta", precargados con los actuales. La casilla "Aplicar
  este precio a todos los gustos" queda sólo en el botón "Costo y precio" de la fila.
- **Si el dev responde otra cosa**: se suma la casilla también acá. Nivel 1.

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
| — (revisión del dev) | Prepizza y Pan de ciabatta como categorías, sin elegir gusto | BUG-23 |
| — (revisión del dev) | La grilla de Stock tiembla al arrastrar el scroll al fondo | BUG-24 |
| — (revisión del dev) | Gastos con desde y hasta, el mes por defecto | US-33 |
| — (revisión del dev) | Estadísticas con desde y hasta, hoy por defecto | US-32 |
| — (segunda revisión) | Precio de pizzas y ciabattas desde "Ingresar stock" | BUG-25 |
| — (segunda revisión) | Ordenar la grilla de Stock por cantidad | US-34 |

---

## Resumen del Sprint 4 (para el dev)

<details>
<summary>Qué se hizo, en lenguaje simple</summary>

El agente hizo el sprint solo el 2026-10-28, con permiso para commitear, integrar a `develop` y hacer push de cada
ítem sin esperar tu OK. Los ítems más grandes (US-27, US-28 y US-29) los escribió un subagente (Sonnet u Opus) y el
agente los revisó. Todo está en `develop`; **no** se pasó nada a `main` ni se puso la etiqueta `sprint-4`: eso espera
tu OK.

| Ítem | Commit | Qué cambió |
|---|---|---|
| T-21 | `416a2f2`, `5b173f6`, `f828314` | El Sprint 4 cargado en el backlog, con este plan y tus respuestas |
| US-26 | `a6f2f57` | Un cliente se guarda con sólo el nombre; teléfono, correo y DNI son opcionales |
| US-30 | `cc1f593` | Títulos más grandes y letras con más contraste, en modo claro y oscuro |
| US-27 | `11052e6` | Cada gasto lleva el proveedor que emitió la factura |
| US-28 | `bb5f3f3` | Todos los precios se cargan en Stock, por gusto; se van las tarjetas de precios de Alta |
| US-29 | `91c21ee` | Pizzas y ciabattas se cuentan en prepizzas y panes; cada venta descuenta uno |
| US-31 | `a7745c6` | El vendedor ve el stock, sin costos |
| BUG-23 | `62b2eb4` | Prepizza y Pan de ciabatta son categorías: se ingresan sin elegir gusto |
| BUG-24 | `8a1d9a6` | La grilla ya no tiembla al llevar la barra de scroll al fondo |
| US-33 | `e457361` | Gastos se filtra entre dos fechas, con el mes en curso por defecto |
| US-32 | `d672fa7` | Estadísticas se ve entre dos fechas, con hoy por defecto |

#### T-21 · 416a2f2
- Tu pedido del cliente quedó guardado tal cual en `specs.md` y pasó a la lista de tareas, con este plan.

#### US-26 · a6f2f57
- Para dar de alta un cliente alcanza con el nombre. Teléfono, correo y DNI se pueden dejar vacíos y, si se cargan,
  se controlan como antes.
- Dos clientes sin DNI no chocan; un DNI repetido sigue dando error.

#### US-30 · cc1f593
- El título de cada página es más grande, y los de las secciones subieron un escalón.
- Los grises del texto del panel se ven más oscuros en modo claro y más claros en modo oscuro; el texto chico se
  lee bien en los dos. El catálogo público y el comprobante no cambian.

#### US-27 · 11052e6
- Al cargar o editar un gasto hay que elegir el proveedor (los activos). La grilla de Gastos muestra una columna
  Proveedor; los gastos viejos dicen "—" hasta que se editen.
- Un proveedor que tiene gastos no se puede borrar; se puede desactivar.

#### US-28 · bb5f3f3
- Alta de productos ya no tiene precios. En Stock, cada gusto (también de Empanadas y Ciabattas) tiene un botón
  "Costo y precio", con una casilla para copiar el precio a todos los gustos del grupo.
- Los precios que ya había se copiaron a cada gusto, así que nada cambia hoy. Si los gustos de una presentación
  valen distinto, Ventas muestra "desde $X".
- La docena surtida de empanadas se cobra como la de sanguches (proporcional). Con todos los gustos al mismo precio
  da el precio de la docena.

#### US-29 · 91c21ee
- En Stock hay dos filas fijas: "Prepizza" (arriba de Pizzas) y "Pan de ciabatta" (arriba de Ciabattas), con su
  contador, "Ingresar stock" (sólo cantidad) y "Registrar pérdida". Los gustos de pizza y ciabatta ya no tienen
  stock, sólo costo y precio.
- Cobrar una pizza (también mitad y mitad) descuenta 1 prepizza; una ciabatta, 1 pan. Sin bases, el cobro avisa cuál
  falta. Anular la venta las devuelve.
- Ventas muestra los gustos de pizza y ciabatta sólo si queda al menos una base.
- Los contadores arrancan en 0: hay que cargar lo que hay.

#### US-31 · a7745c6
- "Stock" aparece en el menú del vendedor. Ve Grupo, Gusto y Cantidad (las bases con su contador), sin botones y sin
  costos: el costo no sale del servidor.
- De paso se arregló la carga de datos de prueba, que se trababa con gastos que ya tienen proveedor.

#### Arreglos de tu revisión (2026-10-28 y 29)

- **BUG-23 · 62b2eb4**: en "Ingresar stock", la categoría ofrece Prepizza y Pan de ciabatta (ya no Pizzas ni
  Ciabattas) y no pide gusto: sólo cantidad y proveedor. En la grilla, la columna "Categoría" dice Prepizza o Pan de
  ciabatta y "Gusto / bebida", "—". Los gustos de pizza y ciabatta siguen ahí sólo para "Costo y precio", y el
  vendedor no los ve.
- **BUG-24 · 8a1d9a6**: la grilla calculaba mal el alto de las filas de Stock (que son más altas por la lista de
  precios) y, al llegar al fondo, el alto total cambiaba y la barra saltaba. Ahora mide cada fila. Vale para todas
  las grillas del panel.
- **US-33 · e457361**: Gastos tiene "Desde" y "Hasta", que arrancan en el 1 y el último día del mes; la X los limpia
  y muestra todo.
- **US-32 · d672fa7**: Estadísticas tiene "Desde" y "Hasta", con la jornada de hoy en las dos. Suma todas las
  jornadas del rango (de 7 a 7), hasta 366 días. Con más de un día, el cuadro de ventas muestra fecha y hora.

### Decisiones provisorias del agente (resumen)

Detalle, ejemplo y qué cambia si respondés otra cosa: [arriba](#decisiones-provisorias-del-agente).

| # | Decisión |
|---|---|
| D-1 | Una mitad y mitad descuenta 1 prepizza; el costo sigue siendo ½ + ½ y el precio, el del gusto más caro |
| D-2 | Las bases viven sólo en Stock; no se borran, no se renombran ni se venden solas |
| D-3 | Un gusto de pizza o ciabatta aparece en Ventas si queda al menos una base y tiene precio |
| D-4 | Empanadas y Ciabattas pasan a precio por gusto; la docena surtida se cobra proporcional (pregunta abierta para el cliente) |
| D-5 | Los gastos viejos quedan sin proveedor y se les pide uno al editarlos |
| D-6 | El correo del cliente también es opcional; un DNI vacío se guarda como "sin DNI" |
| D-7 | El contraste sube con un reemplazo de clases de texto, sin tokens nuevos |
| D-8 | Anular una venta devuelve tantas bases como pizzas o ciabattas tenía, también en las ventas anteriores |
| D-9 | En el catálogo, un gusto de pizza o ciabatta figura con stock si queda una base |
| D-10 | Un proveedor con gastos no se puede borrar |
| D-11 | Una promo con pizza o ciabatta descuenta lo mismo que la venta suelta |
| D-12 | Los gustos de pizza y ciabatta quedan en Stock sólo para "Costo y precio"; el vendedor no los ve |
| D-13 | Gastos arranca del 1 al último día del mes en curso |
| D-14 | Estadísticas cuenta jornadas de 7 a 7, con un máximo de 366 días |
| D-15 | Los arreglos de tu revisión entraron al Sprint 4, antes del merge a `main` |

### Para revisar

- **Migraciones 0018 a 0021** (DNI opcional, proveedor del gasto, precios por gusto, prepizzas y panes). Corrélas en
  la base local con `npm run db:migrate` y en Supabase con el procedimiento de PowerShell. La 0021 deja en 0 el
  stock de los gustos de pizza y ciabatta, y las bases arrancan en 0.
- **Excepción de SQL plano**: los dos tests de migración (`precios-por-gusto.migration.int.test.ts` de la 0020 y
  `prepizzas-y-panes.migration.int.test.ts` de la 0021) corren el archivo `.sql` con el cliente `pg`, porque es la
  única forma de ejecutarlo. Está limitada a esos tests.
- **Archivo de más**: `docs/wireframes-ventas-gestor/mensaje-raro.png` entró por error en el commit de US-28
  (`bb5f3f3`). Decidí si se borra.
- **`.gitignore`**: tiene un cambio sin commitear que el agente no hizo.
- **Etiqueta del filtro de Stock**: el selector se llama "Filtrar Stock" para los lectores de pantalla. "Filtrar por
  categoría" chocaba en los E2E con la etiqueta "Categoría" del formulario.
- Pregunta abierta para el cliente: cómo se cobra una docena surtida cuando los gustos tengan precios distintos (D-4).

</details>

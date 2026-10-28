# Plan maestro: Sprint 3 · Aclaraciones del dev

- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-27 · **Estado**: aprobado por el dev (2026-10-26)
- **Ítem que lo produce**: T-17.

## Contexto

Con el Sprint 2 cerrado, el dev probó el sistema y dejó en `docs/requerimientos/specs.md` la sección "Aclaraciones
para la sprint 3" (líneas 193 a 221). Trae 7 wireframes nuevos en `docs/wireframes-ventas-gestor/`. Pide:

- Alta de productos más simple y legible.
- Costo y precio de venta en Stock.
- Ingresar stock por categoría.
- Estadísticas con la forma del panel de referencia, con íconos de lucide en lugar de emojis.
- Poder quitar de a uno en el pedido de Ventas.

Además, el dev pidió que los tests se corran según el tamaño del cambio: un cartel no puede costar lo mismo que un
cambio de base.

## Decisiones del dev (2026-10-26)

| Tema | Decisión |
|---|---|
| Alta de productos | Pide **sólo grupo y nombre**. El costo y el precio de venta se cargan en Stock. |
| Dónde se cargan en Stock | **Sólo en "Ingresar stock"**: cantidad, costo y precio de venta. Para cambiar un precio hay que ingresar mercadería. |
| Vendedor y Stock | El vendedor **no carga stock ni entra a Stock**. Stock pasa a ser sólo del administrador. |
| Ventas | Un gusto **sin stock no aparece** en el tablero. Si nunca se ingresó, no existe para vender. |
| Textos de la interfaz | Siempre la **mínima aclaración**. Se quitan "Lo que te cuesta hacerlo o comprarlo…" y "Lo que paga el cliente.". |
| KPI de arriba | Filas de 4, 3 y 2: Empanadas, Pizzas, Sanguches y Ciabattas · Coca-Cola, Pepsi y Promos · Ventas registradas y Ganancia. |
| Emojis | Pasan a íconos de lucide **en Estadísticas y en el tablero de Ventas**. Revierte US-15 CA-2. |
| Medios de pago | Fondo de color como en la referencia: Transferencia amarillo, Crédito naranja, Efectivo verde y Débito azul. |
| Franja vacía arriba | Se arregla en el layout compartido, así que mejora todas las páginas. |
| "Total facturado" | Se elimina entero. Es el KPI que decía "Con el recargo de las cuotas.". |
| Tests | Tres niveles según el tamaño del cambio. `npm run verify` completo siempre al cerrar el sprint. |

## Decisiones provisorias del agente

### D-1 · Dónde se cargan los precios de Empanadas y Ciabattas

- **Pregunta**: los precios de Empanadas y Ciabattas son del grupo, no de cada gusto. Hoy se cargan en las tarjetas
  "Precios de venta de …" de Alta de productos. Si Alta pasa a pedir sólo grupo y nombre, ¿dónde se cargan?
- **Situación**: el dev ingresa 24 empanadas de Carne. El precio de la docena vale para Carne, Pollo y todas las
  demás empanadas.
- **Elegido**: las tarjetas salen de Alta. En "Ingresar stock" de un gusto de esos grupos, los campos de precio editan
  el precio del grupo. Si ya hay precio, se pueden dejar vacíos. Así se respeta "sólo en Ingresar stock".
- **Si el dev responde otra cosa**: las tarjetas pueden quedar fijas arriba de la grilla de Stock. Cambia sólo la UI
  de US-17, no la base.
- **Respuesta del dev (2026-10-27)**: el precio único se carga en Alta de productos, en una tarjeta por grupo. Stock no
  lo pide. Lo hace US-23.

### D-2 · Quitar de a uno cuando queda una sola unidad

- **Pregunta**: en el pedido de Ventas, si una línea tiene una sola unidad y se toca "quitar uno", ¿qué pasa?
- **Situación**: el pedido tiene 1 pizza de Muzzarella y el vendedor toca "−".
- **Elegido**: la línea se quita del pedido, igual que con el tacho. Es lo que hace cualquier carrito.
- **Si el dev responde otra cosa**: el "−" queda deshabilitado con una sola unidad. Cambia sólo la UI de US-22.

### D-3 · El "padding doble" de las páginas (BUG-18)

- **Pregunta**: además de la franja de arriba, ¿achico el margen interno de la tarjeta blanca de cada página?
- **Situación**: en Estadísticas, a 1440 px, el contenido empezaba a 96 px del borde de arriba: 64 de la franja vacía
  y 32 del margen del layout. Adentro, la tarjeta blanca tiene su propio margen de 24 px. Ese margen no es un padding
  repetido: separa el contenido del borde de la tarjeta, como en la referencia.
- **Elegido**: se quita sólo la franja. La tarjeta pasa a empezar a 34 px del borde, en todas las páginas, y su
  margen interno queda igual.
- **Si el dev responde otra cosa**: el margen interno se achica en las 12 páginas de `src/app/(main)/` (`p-6` a
  `p-4`). Es un cambio de clases, de nivel 1.

### D-4 · La grilla de Alta deja de mostrar costo y precio (BUG-17 y US-17)

- **Pregunta**: si el costo y el precio de venta se cargan sólo en Ingresar stock, ¿la grilla de Alta de productos
  los sigue mostrando?
- **Situación**: a 1280 px, con el nombre del gusto al 36 % del ancho, las columnas "Costo para el local", "Precio de
  venta" y "Stock" quedan de 87 px y su título se parte en cuatro renglones. La grilla de Stock ya muestra los tres.
- **Elegido**: en US-17, la grilla de Alta muestra grupo, gusto, stock y acciones. El costo y el precio se ven en
  Stock, donde se cargan.
- **Si el dev responde otra cosa**: se vuelven a agregar las dos columnas en `menu-item-columns.tsx` y se angosta el
  gusto. Es un cambio de nivel 1.

### D-5 · El recargo de las cuotas no se muestra al cobrar (BUG-20)

- **Pregunta**: si el recargo de las cuotas lo cobra la tarjeta, ¿el cobro y el comprobante lo siguen mostrando como
  dato para el cliente?
- **Situación**: un pedido de $10.000 se paga con $4.000 en efectivo y $6.000 con Visa en 3 cuotas al 10 %. Antes, el
  cobro decía "Recargo de cuotas: $600" y "Confirmar $10.600", y el comprobante sumaba el recargo.
- **Elegido**: el cobro confirma $10.000 y el comprobante lista "Crédito · Visa · 3 cuotas" por $6.000, sin el
  recargo. El % del plan se sigue viendo al elegir las cuotas, y el recargo queda guardado en el pago por si hace
  falta después. Es lo que pidió el dev: el local ve sólo el precio original.
- **Si el dev responde otra cosa**: se vuelve a mostrar "Recargo de la tarjeta: $600" como dato en
  `credit-fields.tsx` y en `sale-receipt.tsx`, sin sumarlo al total. Es un cambio de nivel 1.

## Orden de ejecución

| # | Ítem | Depende de | Rama |
|---|---|---|---|
| 0 | T-17 Backlog del Sprint 3 desde `specs.md` | — | `docs/t-17-backlog-sprint-3` |
| 1 | T-19 Tests por nivel según el tamaño del cambio | T-17 | `docs/t-19-tests-por-nivel` |
| 2 | BUG-18 Franja vacía arriba de cada página | T-17 | `fix/bug-18-franja-vacia` |
| 3 | BUG-17 El nombre del gusto se corta en Alta de productos | T-17 | `fix/bug-17-nombre-cortado` |
| 4 | US-16 Stock sólo para el administrador | T-17 | `feat/us-16-stock-solo-admin` |
| 5 | US-17 Alta pide grupo y nombre; costo y precio en Ingresar stock | US-16 | `feat/us-17-precios-en-stock` |
| 6 | US-18 Ingresar stock: primero la categoría, después el gusto | US-17 | `feat/us-18-stock-por-categoria` |
| 7 | US-19 Ventas muestra sólo gustos con stock | US-17 | `feat/us-19-ventas-con-stock` |
| 8 | US-22 Ventas: quitar de a uno en el pedido | T-17 | `feat/us-22-quitar-de-a-uno` |
| 9 | US-20 Íconos de lucide por grupo en Ventas y Estadísticas | T-17 | `feat/us-20-iconos-lucide` |
| 10 | US-21 Estadísticas como el panel de referencia | US-20 | `feat/us-21-estadisticas-referencia` |
| 11 | T-18 Cierre del Sprint 3 | todos | `docs/t-18-cierre-sprint-3` |
| 12 | BUG-21 La carga inicial de datos falla si quedaron gastos (apareció en BUG-18) | US-14 | `fix/bug-21-seed-con-gastos` |
| 13 | BUG-20 El recargo de cuotas se cuenta como plata del local (respuesta del dev a D-3 del Sprint 2) | US-11 | `fix/bug-20-recargo-de-la-tarjeta` |

T-19 va primero porque define cuánto se prueba cada ítem que sigue. BUG-17, BUG-18, US-22 y US-20 no dependen de los
demás: se pueden adelantar si un ítem queda bloqueado.

---

## 0 · T-17 Backlog del Sprint 3 (S, 30 min)

- Sección del Sprint 3 en `BACKLOG.md` y este plan.
- `specs.md` y los 7 PNG quedan commiteados tal como los dejó el dev.

## 1 · T-19 Tests por nivel según el tamaño del cambio (S, 30 min)

- `AGENTS.md`, `docs/testing.md`, `docs/definition-of-done.md` y las skills `start-task` y `finish-task` pasan de
  "`npm run verify` antes de integrar cualquier ítem" a tres niveles:

| Nivel | Cuándo | Qué se corre antes de integrar |
|---|---|---|
| 1 · Texto o estilo | Sin lógica: textos, clases, docs | lint, typecheck, `vitest related` de los archivos tocados y los E2E que miran ese texto |
| 2 · Lógica acotada | Una función, un componente, un bug de causa conocida | lo anterior + `test:coverage`; `test:int` si tocó un repositorio |
| 3 · Profundo | Schema, seguridad, cambios entre capas | `npm run verify` completo, con mutación |

- El plan de cada ítem dice su nivel. Ante la duda, el de arriba.
- `npm run verify` completo se corre siempre en el cierre del sprint.
- `AGENTS.md` suma la regla: el diff más chico que resuelva el problema. Por ejemplo, un cartel con "el/la" se arregla
  en la plantilla, no en las 80 llamadas que la usan.
- Los hooks de lefthook no cambian.

## 2 · BUG-18 Franja vacía arriba (S, 30 min)

- `src/app/(main)/layout.tsx:113`: el `header h-16` ocupa alto en todas las pantallas.
  - Desde `xl`, donde el sidebar está fijo, el header no ocupa alto y el botón de tema queda flotando arriba a la
    derecha.
  - En móvil sigue igual, con el botón del menú.
- Se quita el padding doble: `src/app/(main)/page.tsx:9` (`p-6`) está dentro del `p-8` del layout. Se revisan las
  demás páginas por el mismo patrón.
- Nivel de tests 1, más captura de Estadísticas, Stock y Ventas contra `espacio-inecesario-estadisticas.png`.

## 3 · BUG-17 Nombre cortado en Alta (S, 20 min)

- `src/features/menu/ui/menu-item-columns.tsx:54-55`: GRUPO con ancho angosto fijo; GUSTO / BEBIDA sin
  `max-w-[220px]` y con más ancho. La tabla es `table-fixed` (`virtualized-data-table.tsx:56`).
- Nivel 1. "RUCULA Y JAMON CRUDO" se lee entero a 1280 px (`error-visual-1.png`).

## 4 · US-16 Stock sólo para el administrador (S, 45 min)

- `src/config/navigation.ts:23`: sale `stock` del menú del vendedor. Se revisa la protección de `/stock` en
  `src/proxy.ts`.
- Las Server Actions de stock (ingresar, merma y lecturas) exigen el rol admin: vendedor ⇒ `FORBIDDEN`.
- La UI de stock deja de bifurcar por `isAdmin` (`stock-entry-fields.tsx:68`).
- Nivel 3 (seguridad).

## 5 · US-17 Precios y costo en Ingresar stock (L, 3 h · plan propio)

- **Alta**: `menu-item.schema.ts` queda `{ group, name }` para crear y `{ name, version }` para editar. Salen las
  tarjetas de precios del grupo, `COST_HINT` y `SALE_PRICE_HINT`.
- **Base** (`src/lib/db/menu-schema.ts`):
  - `unit_cost` pasa a nullable, con check "nulo o ≥ 0".
  - `menu_items_prices_check` acepta "todos nulos" en Pizzas, Sanguches y bebidas: un gusto recién dado de alta no
    tiene precio.
  - Los datos actuales cumplen: todos tienen costo y precio.
- **Ingresar stock**:
  - En el primer ingreso, costo y precio de venta son obligatorios.
  - Después son opcionales: vacío deja el valor actual, que se muestra como placeholder.
  - Empanadas y Ciabattas editan el precio del grupo (D-1).
  - Stock, costo y precio se guardan en la misma transacción, con `version`.
- La grilla de Stock marca "Sin precio" o "Sin costo" en los gustos que todavía no se ingresaron.
- El catálogo público (`catalog.service.ts:17`) muestra sólo gustos con precio.
- Nivel 3 (schema).

## 6 · US-18 Ingresar stock por categoría (S, 45 min)

- `stock-entry-fields.tsx:18-33,60-63`: el select único con `optgroup` pasa a dos selects.
  - "Categoría", con las etiquetas de `GROUPS`.
  - "Gusto o bebida", sólo con los de esa categoría. Queda deshabilitado hasta elegirla.
  - Cambiar de categoría limpia el gusto elegido.
- La acción sigue recibiendo `menuItemId`.
- Nivel 1 (`error-form-stock.png`).

## 7 · US-19 Ventas sólo con stock (S, 40 min)

- El tablero lista sólo gustos activos con `stock > 0`, según el stock del servidor. Un gusto agotado también
  desaparece: es la consecuencia de la regla del dev.
- El cobro ya rechaza stock insuficiente (`checkout-steps.ts`): no cambia.
- Nivel 2.

## 8 · US-22 Quitar de a uno en el pedido (S, 40 min)

- `src/features/order/ui/order-line-row.tsx`: junto al tacho, un "−" que resta una unidad. Con una sola unidad, quita
  la línea (D-2).
- El cambio vive en el store del pedido (`order.store.ts`), con su test.
- Nivel 2.

## 9 · US-20 Íconos de lucide (M, 2 h · plan propio)

- `lucide-react` pasa de 1.14.0 a ≥ 1.61.0, dentro del rango `^1`. `CanSoda` no existe en 1.14.0.
- `src/config/group-theme.ts`: `emoji` pasa a `icon`.
  - Pizzas `Pizza`, Sanguches `Sandwich`, Coca-Cola y Pepsi `CanSoda`.
  - Empanadas y Ciabattas usan íconos propios. Promos usa `HandCoins`.
- Íconos propios en `src/components/icons/`: se redibujan los PNG del dev al estilo lucide (viewBox 24, sin relleno,
  trazo `currentColor`, grosor 2, puntas redondeadas) con `createLucideIcon`.
- Usos: `group-card.tsx`, `kpi-card.tsx`, `promo-card.tsx` y `workday-kpis.tsx`.
- Nivel 2, más comparación visual con los PNG.

## 10 · US-21 Estadísticas como la referencia (M, 2 h · plan propio)

- Sin la descripción de la jornada ni el título "Dinero generado por comida".
- Comidas arriba, en filas de 4, 3 y 2; debajo, los medios de pago.
- Comidas, Promos, Ventas registradas y Ganancia llevan **borde de color y fondo neutro**:
  - "Ganancia" (antes "Ganancia en limpio") va sin aclaración, con borde verde e ícono `Banknote`;
  - "Ventas registradas" va con borde azul e ícono `Briefcase`.
- Medios de pago con fondo de color, con contraste AA del texto y 3:1 de los bordes.
- "Total facturado" se elimina. El dato `revenue` sigue en el service porque la ganancia lo usa.
- Nivel 2, más captura contra `referencia-de-otro-sistema.png`.

## 11 · T-18 Cierre del Sprint 3 (S, 1 h)

- `npm run verify` completo y todos los E2E.
- README, `docs/architecture.md` y `docs/initial_prompt.md` al día.
- Merge local `develop → main` con el tag `sprint-3`.

## Ajustes de la revisión del dev (2026-10-27)

El dev revisó el sprint antes de pasarlo a `main` y pidió 10 cambios breves, con wireframes en
`docs/wireframes-ventas-gestor/`. Cada ítem va en su rama y su commit; `main` espera el OK del dev.

| Cambio | Pedido | Ítem |
|---|---|---|
| 1 | La columna "Precio de venta" de Stock muestra el precio, no "Igual para todas las Empanadas" | US-23 |
| 2 | El botón naranja de Stock dice "Registrar pérdida" en lugar de "merma" | T-20 |
| 3 | El precio único de Empanadas (unidad, 3, 6 y 12) y Ciabattas (unidad) se elige en Alta; Stock no lo pide | US-23 |
| 4 | El pedido se corta muy rápido en Ventas/Pedidos: correr Desc. a la derecha | T-20 |
| 5 | El "(2 de 4)" del form de la promo | Se descarta: el dev vio que cuenta las comidas de la promo |
| 6 | El botón Cobrar es verde | US-24 |
| 7 | El pedido actual en un carrito que se abre desde la derecha, con ícono de ticket y un contador | US-24 |
| 8 | El título de Estadísticas pasa a "Resumen de la actividad" | T-20 |
| 9 | Subtítulos "Venta por categoría" y "Cantidad de ventas y sus ganancias" | T-20 |
| 10 | Proveedor sin teléfono ni correo obligatorios; etiquetas "Teléfono" y "Correo electrónico" | US-25 |
| 11 | Los precios de la columna de Stock se cortan a mitad de renglón: uno arriba del otro | BUG-22 |

Respuestas del dev a las preguntas:

- **Cambio 3:** una tarjeta por grupo arriba de la grilla de Alta. Es lo que había antes de US-17.
- **Cambio 7:** el contador cuenta productos: una docena suma 1 y una promo suma 1.
- **Cambio 8:** "Resumen de la actividad" reemplaza al título. El menú lateral sigue diciendo "Estadísticas".

### Decisiones provisorias de los ajustes

#### R-1 · Qué muestra la columna "Precio de venta" de Stock para Empanadas

- **Pregunta**: ¿muestra sólo un precio o todos?
- **Situación**: la docena de empanadas está a $32.000 y la unidad a $2.000.
- **Elegido**: todos los precios del grupo, uno por renglón, igual que Sanguches: "1 unidad: $2.000", abajo
  "3 unidades: …" (BUG-22).
- **Si el dev responde otra cosa**: la columna muestra un solo precio. Es un cambio de nivel 1 en `stock-columns.tsx`.

#### R-2 · Hasta dónde llega "pérdida"

- **Pregunta**: ¿cambia sólo el botón o todos los textos de Stock que dicen "merma"?
- **Situación**: el botón abre un diálogo "Registrar merma · Carne suave" y al guardar dice "Merma registrada".
- **Elegido**: todos los textos visibles de Stock dicen "pérdida". El código interno (`loss`, `STOCK_LOSS`) no cambia.
- **Si el dev responde otra cosa**: se vuelve a "merma" en el diálogo y el mensaje. Nivel 1.

#### R-3 · Ingresar stock de un grupo sin precio

- **Pregunta**: si todavía no se cargó el precio de las Empanadas en Alta, ¿se puede ingresar stock de una empanada?
- **Situación**: el dev da de alta "Carne suave" e ingresa 24 antes de cargar el precio del grupo.
- **Elegido**: sí. Ventas ya muestra "Falta cargar el precio del grupo" y no deja venderla hasta que tenga precio.
- **Si el dev responde otra cosa**: Ingresar stock rechaza el ingreso con un error que manda a Alta. Nivel 2.

#### R-4 · El wireframe "mas-espacio-nombre-pedido"

- **Pregunta**: el wireframe no está en la carpeta. ¿De qué tabla es?
- **Situación**: el único lugar con columna de descuento es el historial de Ventas/Pedidos.
- **Elegido**: la columna Pedido del historial. Las columnas cortas tienen ancho fijo y Pedido usa el resto; si no
  entra en una línea, sigue en la siguiente.
- **Si el dev responde otra cosa**: se ajusta la tabla que muestre el wireframe. Nivel 1.

#### R-5 · Dónde va el botón del carrito

- **Pregunta**: ¿dónde va el botón que abre el carrito y qué pasa al cobrar?
- **Situación**: el vendedor suma una docena y quiere ver el pedido.
- **Elegido**: el botón flota abajo a la derecha. "Cobrar" cierra el carrito y abre el cobro.
- **Si el dev responde otra cosa**: el botón pasa al encabezado de Ventas. Nivel 1.

### Ítems de los ajustes

- **T-20 · Textos y estilos (cambios 2, 4, 8 y 9), nivel 1.** "Pérdida" en Stock, anchos de Ventas/Pedidos, título y
  subtítulos de Estadísticas.
- **US-25 · Proveedor (cambio 10), nivel 2.** El schema acepta teléfono y correo vacíos, y un correo cargado se sigue
  validando. La base ya tiene `default('')`, así que no hay migración.
- **US-24 · Carrito (cambios 6 y 7), nivel 2.** `order-drawer.tsx` tiene el botón con `Ticket` y el contador, y el
  panel con transición de CSS, que muestra `CurrentOrder` sin cambios. Cobrar en `bg-emerald-700`, que da 5,5:1 con texto
  blanco. Los 7 E2E de Ventas abren el carrito.
- **US-23 · Precios del grupo en Alta (cambios 1 y 3), nivel 3.** Vuelven la acción, el schema, el `save` del
  servicio y la tarjeta que sacó US-17 (`16b4cd2`), con textos mínimos. Stock deja de pedir y guardar el precio de
  esos grupos, y su columna muestra los precios reales.
- **BUG-22 · Precios de Stock uno por renglón (cambio 11), nivel 1.** La columna "Precio de venta" pasa de un texto
  unido con " · " a una lista con un precio por renglón.

## Trazabilidad: `specs.md` → ítems

| Línea de `specs.md` | Pedido | Ítem |
|---|---|---|
| 197 | Grupo y Gusto / bebida más cerca; el nombre se corta | BUG-17 |
| 199 | La pizza pide el precio en el alta y otra vez en Stock | US-17 (y US-16 por la respuesta del dev) |
| 201 | "Ingresar stock" mezcla todas las categorías | US-18 |
| 203 | Sobra "La jornada del local va de 7:00 a 6:59…" | US-21 |
| 205 | Espacio vacío arriba que obliga a scrollear | BUG-18 |
| 207 | Comidas arriba; ganancia y ventas abajo | US-21 |
| 209 | Sobra "Lo facturado menos el costo…" | US-21 |
| 211 | Se va el KPI "Total facturado" | US-21 |
| 213 | Panel como la referencia; íconos de lucide en lugar de emojis | US-20 y US-21 |
| 215 | "Ganancia", con borde verde e ícono de dinero | US-21 |
| 217 | "Ventas registradas", con borde azul e ícono de ventas | US-21 |
| 219 | Se va "Dinero generado por comida" | US-21 |
| 221 | Quitar de a uno en el pedido de Ventas | US-22 |
| — (pedido en el chat) | Tests según el tamaño del cambio | T-19 |

## Resumen del Sprint 3 (para el dev)

<details>
<summary>Qué se hizo, en lenguaje simple</summary>

El dev dejó el sprint corriendo de noche (2026-10-26 a 2026-10-27) y autorizó commitear, integrar a `develop` y
hacer push de cada ítem sin esperar su OK, con estas listas simples para revisar a la mañana. Todo está en
`develop`; **no** se pasó nada a `main` ni se puso la etiqueta `sprint-3`: eso espera el OK del dev.

| Ítem | Commit | Qué cambió |
|---|---|---|
| T-17 | `3c3cd07` | El Sprint 3 cargado en el backlog, con este plan |
| T-19 | `f41a5fe` | Las pruebas se corren según el tamaño de cada cambio |
| BUG-21 | `df85b45` | La carga de datos de prueba no se traba con gastos viejos (apareció de noche) |
| BUG-18 | `f5f090e` | Sin la franja vacía de arriba |
| BUG-17 | `e3388d8` | El nombre del gusto se lee entero en Alta |
| BUG-20 | `c893d6d` | El recargo de las cuotas es de la tarjeta, no del local |
| US-16 | `6c1cac2` | Stock es sólo del administrador |
| US-17 | `16b4cd2` | Alta pide grupo y nombre; costo y precio en Ingresar stock |
| US-18 | `d137966` | Ingresar stock: primero la categoría, después el gusto |
| US-19 | `d186df7` | Ventas muestra sólo gustos con stock |
| US-22 | `ad3c3e2` | "Quitar uno" en el pedido |
| US-20 | `a7ee8c5` | Íconos de lucide (y la empanada y la ciabatta propias) |
| US-21 | `e1225e6` | Estadísticas como el panel de referencia |
| T-18 | `ea1459f` | Cierre: pruebas completas y docs al día |
| T-20 | `58d39d9` | Ajustes: "Registrar pérdida", pedido completo en Ventas/Pedidos, títulos de Estadísticas |
| US-25 | `e68ea0b` | Ajustes: proveedor sin teléfono ni correo obligatorios |
| US-24 | `5bfa5fb` | Ajustes: el pedido en un carrito desplegable y Cobrar en verde |
| US-23 | `e78bd12` | Ajustes: precio único de Empanadas y Ciabattas en Alta |

#### T-17 · 3c3cd07
- Tus pedidos del Sprint 3 quedaron guardados tal cual (texto e imágenes) y pasaron a la lista de tareas.

#### T-19 · f41a5fe
- Las pruebas automáticas se corren según el tamaño del cambio; al cerrar el sprint se corre todo.

#### BUG-21 · df85b45
- Las pruebas automáticas de pantallas ya no se traban si una corrida anterior dejó gastos cargados.
- Es un arreglo del script que prepara la base de pruebas; la app no cambia.

#### BUG-18 · f5f090e
- Desaparece la franja vacía de arriba de cada página: en compu, el contenido sube unos 60 px y se ve más sin
  scrollear.
- El botón de modo claro/oscuro queda chiquito en la esquina de arriba a la derecha.
- En celular y tablet se ve igual que antes (ahí está el botón del menú).

#### BUG-17 · e3388d8
- En Alta de productos, la columna "Grupo" es angosta y la del gusto más ancha: los nombres largos como "RUCULA Y
  JAMON CRUDO" se leen enteros (si no entran en una línea, pasan a dos).

#### BUG-20 · c893d6d
- El recargo de las cuotas ya no se cuenta como plata del local: una venta de $10.000 con $6.000 en Visa a 3 cuotas
  queda en $10.000, no en $10.600. El recargo lo cobra la tarjeta.
- Al cobrar se confirma el precio original; el comprobante y el historial muestran el pago con Visa por $6.000.
- Estadísticas (facturado, ganancia, crédito y comidas) ya no suman el recargo.
- Quedan anotadas tu respuesta a D-3 y la aprobación de las demás decisiones del Sprint 2.

#### US-16 · 6c1cac2
- Stock queda sólo para el administrador: el vendedor ya no ve "Stock" en el menú y, si intenta entrar, la app lo
  manda a Ventas/Pedidos.
- El vendedor tampoco puede ingresar stock ni ver el historial (antes podía ingresar cantidades).
- Para el administrador, Stock muestra siempre todo: costo, proveedor, mermas e historial.

#### US-17 · 16b4cd2
- Alta de productos ahora pide sólo el grupo y el nombre del gusto o bebida; para editar, sólo el nombre.
- El costo para el local y el precio de venta se cargan al ingresar stock. La primera vez son obligatorios; después,
  si se dejan vacíos, quedan los de antes (el valor actual aparece de guía en el campo).
- Las empanadas y ciabattas tienen un precio por grupo: se carga al ingresar stock de cualquiera de sus gustos, y
  ya no hay tarjetas de precios en Alta.
- La grilla de Alta ya no muestra costo ni precio (se ven en Stock). En Stock, un gusto nuevo dice "Sin precio" y
  "Sin costo" hasta su primer ingreso.
- El catálogo público no muestra gustos sin precio. La base de desarrollo ya está actualizada.

#### US-18 · d137966
- Al ingresar stock se elige primero la categoría (Empanadas, Pizzas…) y después el gusto, que muestra sólo los de
  esa categoría. Ya no hay que recorrer una lista con todo mezclado.

#### US-19 · d186df7
- En Ventas sólo aparecen los gustos que tienen stock. Un gusto recién dado de alta (sin ingreso todavía) o uno que
  se agotó no se muestra, ni en el tablero ni al armar promos.

#### US-22 · ad3c3e2
- En el pedido de Ventas, cada línea tiene un botón "−" (Quitar uno): si cargaste 4 pizzas en vez de 3, tocás "−"
  una vez y quedan 3. Con una sola unidad, el "−" la saca del pedido.

#### US-20 · a7ee8c5
- Chau emojis: cada grupo tiene un ícono de dibujo lineal (lucide) en Ventas y en Estadísticas: pizza, sándwich y
  lata (Coca-Cola y Pepsi); las Promos, una mano con monedas.
- Empanadas y Ciabattas usan íconos propios hechos a partir de tus dibujos: la empanada con su repulgue y la
  ciabatta alargada con los cortes del pan.

#### T-20 · 58d39d9 (ajuste de la revisión)
- El botón naranja de Stock dice "Registrar pérdida", y el diálogo y el mensaje también hablan de pérdida.
- En Ventas/Pedidos el pedido se lee completo: las columnas cortas se achicaron y, si no entra en una línea, sigue
  en la siguiente.
- Estadísticas se titula "Resumen de la actividad" y tiene los subtítulos "Venta por categoría" y "Cantidad de
  ventas y sus ganancias".

#### US-25 · e68ea0b (ajuste de la revisión)
- Un proveedor se guarda sin teléfono ni correo. Si se carga un correo, tiene que estar bien escrito.
- Los campos se llaman "Teléfono" y "Correo electrónico".

#### US-24 · 5bfa5fb (ajuste de la revisión)
- El pedido actual se abre desde la derecha con el botón del ticket, abajo a la derecha. El número del botón cuenta
  lo agregado: una docena suma 1 y una promo suma 1.
- Se cierra con la X, con Escape o tocando afuera. Al tocar Cobrar se cierra y se abre el cobro.
- El botón Cobrar es verde.

#### US-23 · e78bd12 (ajuste de la revisión)
- El precio único de Empanadas (1, 3, 6 y 12) y de Ciabattas (unidad) se carga una sola vez, en las tarjetas de
  arriba de Alta de productos. Reemplaza la decisión D-1.
- Ingresar stock de una empanada o una ciabatta pide sólo el costo y la cantidad.
- La columna "Precio de venta" de Stock muestra los precios de verdad (por ejemplo, "1 docena: $32.000") en lugar de
  "Igual para todas las Empanadas".

#### US-21 · e1225e6
- Estadísticas quedó como el panel de referencia: arriba las comidas (Empanadas, Pizzas, Sanguches, Ciabattas; luego
  Coca-Cola, Pepsi y Promos), después Ventas registradas y Ganancia, y abajo los medios de pago.
- Las comidas, Promos, Ventas y Ganancia tienen el borde pintado (no el fondo). Ganancia, borde verde con ícono de
  billete; Ventas registradas, borde azul con un maletín. Los medios de pago tienen fondo de color.
- Se fueron la frase de la jornada (7:00 a 6:59), "Dinero generado por comida", "Total facturado" y la aclaración
  de la ganancia.

### Decisiones provisorias del agente (resumen)

| D | Decisión | Si el dev responde otra cosa |
|---|---|---|
| D-1 | ~~Los precios de Empanadas y Ciabattas se cargan en Ingresar stock~~. Respondida: van en Alta (US-23) | — |
| D-2 | Con una sola unidad, "Quitar uno" saca la línea | El "−" se deshabilita con una unidad |
| D-3 | El margen interno de la tarjeta de cada página no se tocó (sólo la franja) | Se achica `p-6` a `p-4` en las páginas |
| D-4 | La grilla de Alta no muestra costo ni precio (se ven en Stock) | Se vuelven a agregar las dos columnas |
| D-5 | El cobro y el comprobante no muestran el recargo de la tarjeta | Se muestra como dato, sin sumarlo |
| R-1 | La columna de Stock muestra todos los precios del grupo | Muestra un solo precio |
| R-2 | "Pérdida" en todos los textos de Stock, no sólo en el botón | Vuelve "merma" en el diálogo y el mensaje |
| R-3 | Ingresar stock de una empanada no exige que el grupo tenga precio | Se rechaza con un error que manda a Alta |
| R-4 | El cambio 4 es la columna Pedido del historial de ventas (el wireframe no estaba) | Se ajusta la tabla del wireframe |
| R-5 | El botón del carrito flota abajo a la derecha; Cobrar cierra el carrito | El botón pasa al encabezado de Ventas |

### Para la mañana

- Revisar y, si está todo bien, pasar `develop` a `main` con la etiqueta `sprint-3` (T-18 CA-2).
- El cambio de la skill `delegate-task` ya está en `develop` (`a81d550`). Sigue sin versionar `.claude/launch.json`
  (configuración local para levantar la app en el panel de previsualización).
- Ajustes de la revisión (2026-10-27): T-20, US-25, US-24 y US-23. El cambio 5 ("2 de 4" en la promo) se descartó.
  Al cerrarlos, `npm run verify` y los 65 E2E en verde (uno de Clientes falló una vez y pasó al repetirlo: es BUG-16).
- La tarea programada "Retomar trabajo del Gestor empanadería" quedó desactivada; se puede borrar.
- Entre la 01:25 y las 03:42 el trabajo se pausó por el límite de uso de 5 horas y siguió solo.

</details>

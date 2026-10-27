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

### D-2 · Quitar de a uno cuando queda una sola unidad

- **Pregunta**: en el pedido de Ventas, si una línea tiene una sola unidad y se toca "quitar uno", ¿qué pasa?
- **Situación**: el pedido tiene 1 pizza de Muzzarella y el vendedor toca "−".
- **Elegido**: la línea se quita del pedido, igual que con el tacho. Es lo que hace cualquier carrito.
- **Si el dev responde otra cosa**: el "−" queda deshabilitado con una sola unidad. Cambia sólo la UI de US-22.

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

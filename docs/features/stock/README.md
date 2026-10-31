# Feature: stock (ingresos y mermas)

- **US relacionadas**: US-4 (Stock), US-17 (precios al ingresar), US-28 (todos los precios en Stock, "Costo y
  precio") y US-29 (prepizzas y panes de ciabatta). Sobre el catálogo de `menu` (US-3). Lo descuentan las ventas desde US-6.
- **Código**: `src/features/stock/` (domain, repository, services, actions, ui, testing). Las tablas están en
  `src/lib/db/stock-schema.ts` y la pantalla en `src/app/(main)/stock/`.

## Qué hace

Muestra el stock de cada gusto y bebida activos, agrupados por grupo, y permite:

- **Ingresar stock**: suma unidades a un gusto y carga el costo para el local (por unidad; en la pizza, por pizza
  entera), el precio de venta (US-17) y el proveedor. El costo actualiza el del gusto y alimenta la ganancia.
  Desde US-28 todos los gustos piden sus precios, también Empanadas (1, 3, 6 y 12) y Ciabattas (unidad).
- **Costo y precio** (US-28 CA-5): cambia el costo y los precios de un gusto de cualquier grupo, sin cantidad. Con la
  casilla "Aplicar este precio a todos los gustos de <Grupo>", copia **sólo los precios** (no el costo) a todos los
  demás gustos del grupo, también a los desactivados, en la misma transacción.
- **Registrar una pérdida** (la merma): descuenta stock con un motivo y guarda el costo del momento.
- **Ver el historial de ingresos** de cada gusto.
- **Prepizzas y panes de ciabatta** (US-29): Pizzas y Ciabattas no guardan stock por gusto. Guardan una **base** por
  grupo, "Prepizza" y "Pan de ciabatta" (`menu_items.is_base`), con su contador, "Ingresar stock" y "Registrar
  pérdida". En Stock, cada base es una **categoría** propia (BUG-23, `domain/stock-categories.ts`), con "—" en
  "Gusto / bebida". Los gustos de esos grupos quedan en las categorías Pizzas y Ciabattas, con "—" en Stock y sólo
  "Costo y precio"; el vendedor no los ve.

## Reglas de negocio

- La cantidad que entra es un entero mayor a 0. Desde US-29 las mermas también son enteras: ya no hay medias pizzas
  en stock.
- Una merma no puede superar el stock (`INSUFFICIENT_STOCK`).
- **Primer ingreso de un gusto (US-17, US-28)**: costo y precios de venta son obligatorios en todos los grupos
  (`MISSING_COST`, `MISSING_PRICE`). Los precios tienen que ser los de las presentaciones del grupo: los cuatro en
  Empanadas y Sándwich de miga, sólo el de unidad en el resto (`VALIDATION`). En los ingresos siguientes son opcionales:
  vacío conserva el valor actual, que se muestra como placeholder.
- **Costo y precio** pide siempre el costo y todos los precios del grupo, precargados con los actuales. Filtra por
  `id` y `version` del gusto que se abrió: si alguien lo cambió en el medio, `STALE_VERSION` y no se guarda nada.
  Cada gusto que recibe el precio sube su `version`.
- Sin costo nuevo, el ingreso conserva el costo actual del gusto y lo registra en el historial.
- **Bases (US-29)**: el ingreso de una base pide sólo la cantidad y el proveedor (opcional). Se registra con costo 0
  y la base sigue sin costo ni precios (con costo o precios, `VALIDATION`). La pérdida de una base baja el contador
  con costo 0, así no resta de la ganancia. "Costo y precio" de una base da `VALIDATION`.
- **Gustos de Pizzas y Ciabattas (US-29)**: no reciben ingresos ni pérdidas (`VALIDATION`); su costo y su precio se
  cargan con "Costo y precio" de su fila o desde "Ingresar stock": las categorías Pizzas y Ciabattas piden el gusto,
  el costo y el precio (precargados), sin cantidad ni proveedor, y guardan con `setStockPricingAction` (BUG-25).
  Prepizza y Pan de ciabatta toman la base sin pedir gusto (BUG-23). "Aplicar este precio a todos los gustos" no toca la base (`lockGroup` la excluye).
- **Stock es sólo del administrador** (dev, 2026-10-26, US-16): el vendedor no ve la sección ni puede ingresar
  stock, registrar mermas o leer el historial.
- Cada movimiento sube la `version` del gusto: si alguien lo estaba editando en Alta de productos, recibe
  `STALE_VERSION` y la lista se vuelve a leer sola (US-38).

## Roles y permisos

| Acción | admin | vendedor | público (sin sesión) |
|---|---|---|---|
| Ver `/stock` | Sí | No (lo manda a Ventas/Pedidos) | No |
| Ingresar stock, con costo y proveedor | Sí | No (`FORBIDDEN`) | No |
| Costo y precio (y aplicarlo a todo el grupo) | Sí | No (`FORBIDDEN`) | No (`UNAUTHENTICATED`) |
| Registrar una merma | Sí | No (`FORBIDDEN`) | No |
| Ver el historial, con costo y proveedor | Sí | No (lista vacía) | No |

## Server Actions

| Action | Acceso | Entrada (schema) | Respuesta |
|---|---|---|---|
| `registerStockEntryAction(input)` | admin | `stockEntrySchema` | `ActionResult<{ menuItemId, stock, version }>` |
| `registerStockLossAction(input)` | admin | `stockLossSchema` | `ActionResult<{ menuItemId, stock, version }>` |
| `setStockPricingAction(input)` | admin | `stockPricingSchema`: `{ menuItemId, version, unitCost, prices, applyToGroup }` (`strictObject`); los precios se validan contra el grupo con `priceIssues` | `ActionResult<MenuItemDef>` (validada con `menuItemRowSchema`) |
| `fetchStockEntries(menuItemId)` | admin | id del gusto | `StockEntryDef[]` (los últimos 50; vacío ante error) |

La grilla lee los gustos con `fetchMenuItems` del feature `menu`.

## Datos

- `stock_entries`: gusto (FK sin borrado en cascada), cantidad (`CHECK > 0`), costo (`CHECK >= 0`), proveedor
  (nullable) y usuario. Sólo inserción.
- `stock_losses`: gusto, cantidad (`numeric(10,1)`, `CHECK > 0` y en medias; desde US-29 Zod la pide entera), costo,
  motivo (`CHECK` no vacío) y usuario. Sólo inserción.
- Las bases son filas de `menu_items` con `is_base = true` (migración `0021_prepizzas-y-panes`, que las crea en 0 y
  deja en 0 el stock de los gustos de Pizzas y Ciabattas). El índice único parcial `menu_items_one_base_per_group`
  permite una por grupo, y el check `menu_items_base_check` exige que no tengan costo ni precios, que estén en Pizzas
  o Ciabattas y que su stock sea entero.
- El stock vive en `menu_items.stock`. Un gusto con ingresos o mermas ya no se borra (`HAS_RELATIONS`).
- Auditoría: `CREAR` / `STOCK_ENTRY` y `PÉRDIDA` / `STOCK_LOSS`, con el stock de antes y de después. "Costo y
  precio" audita `ACTUALIZAR` / `MENU_ITEM` con el nombre, el costo, los precios y `appliedTo` (cuántos gustos
  recibieron el precio).
- Concurrencia: `SELECT … FOR UPDATE` sobre el gusto, en la misma transacción (ver `docs/architecture.md`). "Aplicar
  a todos" bloquea además los gustos del grupo, ordenados por id y sin la base (`lockGroup`). `lockBase(group)` bloquea
  la base de un grupo: la usan el cobro y la anulación (feature `order`).

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Sin sesión | `UNAUTHENTICATED` | No autorizado (Token faltante) | `actions/stock-actions.contract.test.ts` |
| El vendedor ingresa stock o registra una merma (US-16) | `FORBIDDEN` | Solo los administradores pueden realizar esta acción | `stock-actions.contract.test.ts` |
| Cantidad ≤ 0 o con decimales (también la merma, desde US-29); motivo vacío | `VALIDATION` | Los datos proporcionados no son válidos. | `stock-actions.contract.test.ts`, `domain/stock.schema.test.ts` |
| Ingreso o pérdida de un gusto de Pizzas o Ciabattas (US-29) | `VALIDATION` | Los datos proporcionados no son válidos. | `stock-actions.contract.test.ts`, `services/stock-bases.test.ts` |
| Ingreso de una base con costo o precios (US-29) | `VALIDATION` | Los datos proporcionados no son válidos. | `services/stock-bases.test.ts` |
| "Costo y precio" de una base (US-29) | `VALIDATION` | Los datos proporcionados no son válidos. | `services/stock-bases.test.ts` |
| El gusto ya no existe | `NOT_FOUND` | El producto ya no existe. | `stock-actions.contract.test.ts` |
| Primer ingreso sin costo (US-17) | `MISSING_COST` | Falta el costo para el local. | `services/stock.service.pricing.test.ts` |
| Primer ingreso sin precio de venta (US-17) | `MISSING_PRICE` | Falta el precio de venta. | `services/stock.service.pricing.test.ts` |
| La merma supera el stock (también el de una base) | `INSUFFICIENT_STOCK` | No hay stock suficiente de <gusto o base>. | `stock-actions.contract.test.ts`, `stock.service.int.test.ts`, `stock-bases.test.ts` |
| El gusto cambió entre la lectura y la escritura | `STALE_VERSION` | Los datos en el servidor han cambiado… | `stock.service.test.ts` |
| Costo y precio sin sesión | `UNAUTHENTICATED` | No autorizado (Token faltante) | `actions/stock-pricing.contract.test.ts` |
| El vendedor cambia costo o precio (US-28) | `FORBIDDEN` | Solo los administradores pueden realizar esta acción | `stock-pricing.contract.test.ts` |
| Costo y precio sin versión, con costo negativo, campos de más o precios que no son los del grupo | `VALIDATION` | Los datos proporcionados no son válidos. | `stock-pricing.contract.test.ts`, `services/stock-pricing.test.ts` |
| Costo y precio de un gusto que ya no existe | `NOT_FOUND` | El producto ya no existe. | `stock-pricing.contract.test.ts`, `stock-pricing.test.ts` |
| Costo y precio de un gusto que cambió desde que se abrió el formulario | `STALE_VERSION` | Los datos en el servidor han cambiado… | `stock-pricing.contract.test.ts`, `stock-pricing.test.ts`, `stock.service.int.test.ts` |

## Pantallas

`src/app/(main)/stock/page.tsx` → `StockPanel`:

- Barra con búsqueda, el desplegable "Ordenar Stock" (orden por categoría, stock creciente o decreciente, solo sin
  stock o quitar sin stock; US-34, `domain/stock-order.ts`), el filtro por categoría ("Filtrar Stock") e "Ingresar
  stock". Al ordenar, los gustos sin stock propio van al final y no cuentan como "sin stock" (D-16).
- Grilla con categoría, gusto, stock ("Sin stock" en rojo), precio (los del gusto, uno por renglón, o "Sin precio";
  BUG-22) y costo ("Sin costo"). Las acciones de cada fila son ingresar, pérdida, "Costo y precio" (ícono `Tags`) e
  historial. La base es su propia categoría, con "—" en gusto, precio y costo y sólo ingresar y pérdida; los gustos de
  Pizzas y Ciabattas muestran "—" en Stock y sólo "Costo y precio" (US-29).
- Modales: `StockEntryModal` (categoría, gusto, cantidad, costo, precios de venta y proveedor; en Prepizza y Pan de
  ciabatta, sin gusto: sólo cantidad y proveedor; en Pizzas y Ciabattas, gusto, costo y precio, y guarda como "Costo y
  precio"), `StockLossModal`,
  `StockPricingModal` (costo, precios del grupo precargados y la casilla "Aplicar este precio a todos los gustos de
  <Grupo>") y `StockHistoryModal` (cargando, vacío y lista).

## Tests

- Unit: `domain/stock.schema.test.ts` (con fuzz), `services/stock.service.test.ts`, `services/stock-pricing.test.ts`,
  `services/stock-bases.test.ts` (US-29) y `ui/stock-forms.test.ts`.
- Contrato y fuzz: `actions/stock-actions.contract.test.ts` y `actions/stock-pricing.contract.test.ts`.
- Repositorio: `testing/stock-repository.behavior.ts`, contra el fake y contra Drizzle.
- Integración: `services/stock.service.int.test.ts` (5 ingresos y 2 mermas simultáneos; "aplicar a todos" en una
  transacción; ingreso y pérdida de una prepizza con costo 0), `src/lib/db/precios-por-gusto.migration.int.test.ts` (la
  migración copia el precio de grupo a cada gusto), `src/lib/db/prepizzas-y-panes.migration.int.test.ts` (US-29) y
  `src/lib/db/menu-schema.checks.int.test.ts` (los checks de las bases).
- Componente: `ui/*.test.tsx`.
- E2E: `tests/stock.spec.ts`, `tests/stock-precios.spec.ts` (también el "aumento de la docena" con la casilla y la
  ciabatta con "Costo y precio") y `tests/prepizzas.spec.ts` (US-29).

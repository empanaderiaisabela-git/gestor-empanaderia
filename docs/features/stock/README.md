# Feature: stock (ingresos y mermas)

- **US relacionadas**: US-4 (Stock). Sobre el catálogo de `menu` (US-3). Lo descuentan las ventas desde US-6.
- **Código**: `src/features/stock/` (domain, repository, services, actions, ui, testing). Las tablas están en
  `src/lib/db/stock-schema.ts` y la pantalla en `src/app/(main)/stock/`.

## Qué hace

Muestra el stock de cada gusto y bebida activos, agrupados por grupo, y permite:

- **Ingresar stock**: suma unidades a un gusto y puede cargar el costo para el local (por unidad; en la pizza, por
  pizza entera), que actualiza el costo del gusto y alimenta la ganancia, y el proveedor.
- **Registrar una merma**: descuenta stock con un motivo y guarda el costo del momento.
- **Ver el historial de ingresos** de cada gusto.

## Reglas de negocio

- La cantidad que entra es un entero mayor a 0. Las mermas admiten media unidad sólo en Pizzas.
- Una merma no puede superar el stock (`INSUFFICIENT_STOCK`).
- Sin costo nuevo, el ingreso conserva el costo actual del gusto y lo registra en el historial.
- **Stock es sólo del administrador** (dev, 2026-10-26, US-16): el vendedor no ve la sección ni puede ingresar
  stock, registrar mermas o leer el historial.
- Cada movimiento sube la `version` del gusto: si alguien lo estaba editando en Alta de productos, recibe
  `STALE_VERSION` y sincroniza.

## Roles y permisos

| Acción | admin | vendedor | público (sin sesión) |
|---|---|---|---|
| Ver `/stock` | Sí | No (lo manda a Ventas/Pedidos) | No |
| Ingresar stock, con costo y proveedor | Sí | No (`FORBIDDEN`) | No |
| Registrar una merma | Sí | No (`FORBIDDEN`) | No |
| Ver el historial, con costo y proveedor | Sí | No (lista vacía) | No |

## Server Actions

| Action | Acceso | Entrada (schema) | Respuesta |
|---|---|---|---|
| `registerStockEntryAction(input)` | admin | `stockEntrySchema` | `ActionResult<{ menuItemId, stock, version }>` |
| `registerStockLossAction(input)` | admin | `stockLossSchema` | `ActionResult<{ menuItemId, stock, version }>` |
| `fetchStockEntries(menuItemId)` | admin | id del gusto | `StockEntryDef[]` (los últimos 50; vacío ante error) |

La grilla lee los gustos con `fetchMenuItems` del feature `menu`.

## Datos

- `stock_entries`: gusto (FK sin borrado en cascada), cantidad (`CHECK > 0`), costo (`CHECK >= 0`), proveedor
  (nullable) y usuario. Sólo inserción.
- `stock_losses`: gusto, cantidad (`numeric(10,1)`, `CHECK > 0` y en medias), costo, motivo (`CHECK` no vacío) y
  usuario. Sólo inserción.
- El stock vive en `menu_items.stock`. Un gusto con ingresos o mermas ya no se borra (`HAS_RELATIONS`).
- Auditoría: `CREAR` / `STOCK_ENTRY` y `PÉRDIDA` / `STOCK_LOSS`, con el stock de antes y de después.
- Concurrencia: `SELECT … FOR UPDATE` sobre el gusto, en la misma transacción (ver `docs/architecture.md`).

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Sin sesión | `UNAUTHENTICATED` | No autorizado (Token faltante) | `actions/stock-actions.contract.test.ts` |
| El vendedor ingresa stock o registra una merma (US-16) | `FORBIDDEN` | Solo los administradores pueden realizar esta acción | `stock-actions.contract.test.ts` |
| Cantidad ≤ 0 o con decimales; media unidad fuera de Pizzas; motivo vacío | `VALIDATION` | Los datos proporcionados no son válidos. | `stock-actions.contract.test.ts`, `services/stock.service.test.ts` |
| El gusto ya no existe | `NOT_FOUND` | El producto ya no existe. | `stock-actions.contract.test.ts` |
| La merma supera el stock | `INSUFFICIENT_STOCK` | No hay stock suficiente de <gusto>. | `stock-actions.contract.test.ts`, `stock.service.int.test.ts` |
| El gusto cambió entre la lectura y la escritura | `STALE_VERSION` | Los datos en el servidor han cambiado… | `stock.service.test.ts` |

## Pantallas

`src/app/(main)/stock/page.tsx` → `StockPanel`:

- Barra con búsqueda, filtro por grupo y "Ingresar stock".
- Grilla con grupo, gusto, stock ("Sin stock" en rojo), precio y costo. Las acciones de cada fila son ingresar,
  merma e historial.
- Modales: `StockEntryModal` (gusto agrupado por grupo, cantidad, costo y proveedor),
  `StockLossModal` y `StockHistoryModal` (cargando, vacío y lista).

## Tests

- Unit: `domain/stock.schema.test.ts` (con fuzz), `services/stock.service.test.ts` y `ui/stock-forms.test.ts`.
- Contrato y fuzz: `actions/stock-actions.contract.test.ts`.
- Repositorio: `testing/stock-repository.behavior.ts`, contra el fake y contra Drizzle.
- Concurrencia: `services/stock.service.int.test.ts` (5 ingresos y 2 mermas simultáneos).
- Componente: `ui/*.test.tsx`.
- E2E: `tests/stock.spec.ts`.

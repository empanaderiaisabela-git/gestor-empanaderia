# Feature: menú (gustos, bebidas y precios)

- **US relacionadas**: US-3 (Alta de productos). Lo usan después US-4 (Stock) y US-5/US-6 (Ventas).
- **Código**: `src/features/menu/` (domain, repository, services, actions, store, ui, testing). Las tablas están en
  `src/lib/db/menu-schema.ts` y la pantalla en `src/app/(main)/alta-de-productos/`.
- **Decisión**: [ADR 0005](../../adr/0005-grupos-fijos-y-precio-del-grupo-o-por-gusto.md).

## Qué hace

El admin da de alta los gustos de cada comida y las bebidas de Coca-Cola y Pepsi, con su costo por unidad, y carga
los precios:

- **Empanadas y Ciabattas** tienen un precio por presentación **para todo el grupo**: todos los gustos valen lo
  mismo. Se cargan una sola vez, arriba de la grilla.
- **Sanguches, Pizzas y bebidas** tienen precio **por gusto**: Primavera no vale lo mismo que Jamón y queso, y cada
  pizza tiene el suyo.

Un gusto nace sin stock. El stock entra por "Ingresar stock" (US-4).

## Reglas de negocio

- **Grupos y presentaciones fijos en el código** (`domain/menu-groups.ts`). Fuente: dev, 2026-10-25.

  | Grupo | Presentaciones | Precio | Stock |
  |---|---|---|---|
  | Empanadas | 1, 3, 6 (½ docena) y 12 (1 docena) u | Del grupo | Unidades |
  | Sanguches (de miga) | 1, 3, 6 y 12 u | Por gusto | Unidades |
  | Pizzas | Entera, de 1 o 2 sabores | Por gusto (la entera) | Pizzas; admite medias |
  | Ciabattas | Unidad | Del grupo | Unidades |
  | Coca-Cola, Pepsi | Unidad | Por bebida | Unidades |

- El precio del grupo y el de cada gusto llevan todas las presentaciones del grupo; ninguna de más. Fuente:
  "Aclaración de precios" de `specs.md`.
- El nombre es único dentro del grupo, sin distinguir mayúsculas. El mismo nombre puede repetirse en otro grupo
  (una Capresse de empanada y otra de ciabatta).
- Mientras Empanadas o Ciabattas no tengan precio cargado, sus gustos no se pueden vender. La pantalla lo avisa.
- Un gusto con ventas o movimientos no se borra: se desactiva. La base rechaza el borrado (`HAS_RELATIONS`).

## Roles y permisos

| Acción | admin | vendedor | público (sin sesión) |
|---|---|---|---|
| Ver la pantalla `/alta-de-productos` | Sí | No: `proxy.ts` lo lleva a `/ventas` | No |
| Listar gustos, bebidas y precios del grupo | Sí | Sí (los necesita para vender), **sin el costo** (`unitCost: null`) mientras el cliente no responda si el vendedor ve costos | No |
| Crear, editar, activar, desactivar y borrar; cambiar precios del grupo | Sí | No (`FORBIDDEN`) | No (`UNAUTHENTICATED`) |

## Server Actions

| Action | Acceso | Entrada (schema) | Respuesta |
|---|---|---|---|
| `fetchMenuItems()` | Cualquier usuario activo | — | `MenuItemDef[]` (vacía ante cualquier error) |
| `createMenuItemAction(input)` | admin | `menuItemCreateSchema` | `ActionResult<MenuItemDef>` |
| `updateMenuItemAction(id, input)` | admin | `menuItemUpdateSchema` (+ precios del grupo del gusto) | `ActionResult<MenuItemDef>` |
| `toggleMenuItemActiveAction(input)` | admin | `menuItemToggleSchema` | `ActionResult` |
| `deleteMenuItemAction(input)` | admin | `menuItemDeleteSchema` | `ActionResult` |
| `fetchMenuGroupPrices()` | Cualquier usuario activo | — | `MenuGroupPriceDef[]` (vacía ante cualquier error) |
| `saveMenuGroupPricesAction(input)` | admin | `menuGroupPricesSchema` (versión 0 = primera carga) | `ActionResult<MenuGroupPriceDef>` |

## Datos

- `menu_items`: grupo (enum `menu_group`), nombre (`varchar(60)`), costo unitario, stock (`numeric(10,1)`), precios
  `price_1`, `price_3`, `price_6` y `price_12` (nulos según el grupo), `is_active`, `version`.
  - `unique(menu_group, name)`.
  - `CHECK`: costo ≥ 0; stock ≥ 0 y en medias; sólo Pizzas admite medias; precios que corresponden a cada grupo.
- `menu_group_prices`: una fila por grupo de precio único (Empanadas y Ciabattas), con sus precios y `version`.
  `CHECK` por grupo.
- Los dos llevan concurrencia optimista: editar filtra por `version`. La primera carga de precios del grupo usa
  `version = 0` y no pisa una fila que ya exista.
- Auditoría en `audit_logs` con `entity` `MENU_ITEM` o `MENU_GROUP_PRICES`.
- Seed (`db:seed`, `src/lib/db/scripts/menu-seed-data.ts`): los gustos de `specs.md`, precios y costos de demo, y
  bebidas de demo.

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Sin sesión | `UNAUTHENTICATED` | No autorizado (Token faltante) | `actions/menu-errors.contract.test.ts` |
| Un vendedor crea, edita, activa, borra o cambia precios | `FORBIDDEN` | Solo los administradores pueden realizar esta acción | `menu-errors.contract.test.ts`, `menu-group-prices.contract.test.ts` |
| Nombre vacío o de más de 60, costo o precio inválido, precios que no corresponden al grupo | `VALIDATION` | Los datos proporcionados no son válidos. | `menu-errors.contract.test.ts`, `domain/*.schema.test.ts` |
| Nombre repetido en el grupo | `DUPLICATE` | Ya existe un registro con esos datos (DNI, nombre o código duplicado). | `menu-errors.contract.test.ts` |
| Editar, activar o borrar con una versión vieja; precios del grupo cambiados por otra persona | `STALE_VERSION` | Los datos en el servidor han cambiado. Por favor, sincroniza la lista e intenta nuevamente. | `menu-errors.contract.test.ts`, `menu-group-prices.contract.test.ts` |
| Editar un producto que ya no existe | `NOT_FOUND` | El/la producto seleccionado ya no existe. | `menu-errors.contract.test.ts` |
| Borrar un producto con movimientos | `HAS_RELATIONS` | No se puede completar la operación porque existen registros relacionados. | `menu-errors.contract.test.ts` |

## Pantallas

`src/app/(main)/alta-de-productos/page.tsx` → `MenuPanel`:

- Arriba, las tarjetas de precios de Empanadas y Ciabattas (`GroupPriceCard`). Sin precio cargado, muestran
  "Sin precio: todavía no se puede vender".
- Debajo, la barra con búsqueda, filtro por grupo y "Ver inactivos", y la grilla: tabla en escritorio y tarjetas en
  mobile.
- El formulario (`MenuItemFormModal`) muestra los campos de precio que corresponden al grupo elegido. El grupo no se
  cambia al editar.
- Estados: esqueleto mientras carga, mensaje cuando el grupo no tiene gustos, y errores del servidor en el
  formulario o en el aviso superior.

## Tests

- Unit: `domain/*.test.ts` (grupos, precios, schemas, con fuzz) y `services/*.test.ts` con el fake.
- Contrato y fuzz: `actions/*.contract.test.ts`.
- Comportamiento del repositorio: `testing/*.behavior.ts`, contra el fake y contra Drizzle (`repository/*.int.test.ts`).
- Componente: `ui/*.test.tsx`.
- Mutación: `menu/{domain,services}` en `stryker.config.mjs`.

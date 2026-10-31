# Feature: menú (gustos, bebidas y precios)

- **US relacionadas**: US-3 (Alta de productos), T-12 (fotos, "visible en el catálogo" y catálogo público) y US-29
  (prepizzas y panes de ciabatta). Lo usan después US-4 (Stock) y US-5 a US-7 (Ventas).
- **Código**: `src/features/menu/` (domain, repository, services, actions, store, ui, testing). Las tablas están en
  `src/lib/db/menu-schema.ts` y la pantalla en `src/app/(main)/alta-de-productos/`.
- **Decisión**: [ADR 0005](../../adr/0005-grupos-fijos-y-precio-del-grupo-o-por-gusto.md). Desde US-28 (Sprint 4, D-4 de
  [`sprint-4.md`](../../plans/sprint-4.md)) ya no hay precio del grupo: todos los precios son por gusto.

## Qué hace

El admin da de alta los gustos de cada comida y las bebidas de Coca-Cola y Quilmes con **sólo el grupo y el nombre**.
El nombre es lo único que se edita después. El **costo para el local** y los **precios de venta** se cargan al
ingresar stock (US-17) o con "Costo y precio" (US-28), los dos en [Stock](../stock/README.md). Desde US-28 **todos
los gustos tienen su propio precio**, también los de Empanadas y Ciabattas: Alta ya no tiene tarjetas de precio por
grupo.

Un gusto nace sin stock, sin costo y sin precio. El stock entra por "Ingresar stock" (US-4). Los gustos de Pizzas y
Ciabattas no tienen stock propio desde US-29: descuentan de su base, "Prepizza" o "Pan de ciabatta", que viene con
el sistema y vive sólo en Stock.

Desde la grilla, el admin también decide qué gustos se **muestran en el catálogo público** (`/home`) y les carga
**fotos** (T-12). El catálogo muestra los gustos activos y visibles, por grupo, con sus precios ("desde $X" si tiene
varias presentaciones), sus fotos y si hay stock.

## Reglas de negocio

- **Grupos y presentaciones fijos en el código** (`domain/menu-groups.ts`). Fuente: dev, 2026-10-25.

  | Grupo | Presentaciones | Precio | Stock |
  |---|---|---|---|
  | Empanadas | 1, 3, 6 (½ docena) y 12 (1 docena) u | Por gusto (US-28) | Unidades |
  | Sándwich de miga | 1, 3, 6 y 12 u | Por gusto | Unidades |
  | Pizzas | Entera, de 1 o 2 sabores | Por gusto (la entera) | De la Prepizza (US-29): 1 por pizza |
  | Ciabattas | Unidad | Por gusto (US-28) | Del Pan de ciabatta (US-29): 1 por ciabatta |
  | Coca-Cola, Quilmes | Unidad | Por bebida | Unidades |

- El precio de cada gusto lleva todas las presentaciones de su grupo; ninguna de más. Fuente: "Aclaración de
  precios" de `specs.md`.
- El nombre es único dentro del grupo, sin distinguir mayúsculas. El mismo nombre puede repetirse en otro grupo
  (una Capresse de empanada y otra de ciabatta).
- Un gusto sin precio cargado no se puede vender ni aparece en el catálogo.
- Un gusto con ventas o movimientos no se borra: se desactiva. La base rechaza el borrado (`HAS_RELATIONS`).
- **Bases (US-29, D-2 de `sprint-4.md`)**: "Prepizza" (Pizzas) y "Pan de ciabatta" (Ciabattas) son filas de
  `menu_items` con `is_base`. No se listan en Alta de productos, no se venden solas ni aparecen en el catálogo, y
  editarlas, activarlas o desactivarlas, mostrarlas en el catálogo o borrarlas da `VALIDATION`. Son la primera fila
  de su grupo en las listas (`findAll` las ordena primero).
- **Catálogo (US-29, D-9)**: un gusto de Pizzas o Ciabattas figura con stock si su base tiene al menos 1.

## Roles y permisos

| Acción | admin | vendedor | público (sin sesión) |
|---|---|---|---|
| Ver la pantalla `/alta-de-productos` | Sí | No: `proxy.ts` lo lleva a `/ventas` | No |
| Listar gustos, bebidas y sus precios | Sí | Sí (los necesita para vender), **sin el costo** (`unitCost: null`) por decisión del dev (2026-10-25) | No |
| Crear, editar, activar, desactivar y borrar| Sí | No (`FORBIDDEN`) | No (`UNAUTHENTICATED`) |
| Mostrar u ocultar en el catálogo; subir y borrar fotos | Sí | No (`FORBIDDEN`) | No (`UNAUTHENTICATED`) |
| Ver el catálogo (`fetchCatalog`, `fetchCatalogItem`) | Sí | Sí | **Sí: son las únicas lecturas públicas** |

## Server Actions

| Action | Acceso | Entrada (schema) | Respuesta |
|---|---|---|---|
| `fetchMenuItems()` | Cualquier usuario activo | — | `MenuItemDef[]` (vacía ante cualquier error) |
| `createMenuItemAction(input)` | admin | `menuItemCreateSchema` | `ActionResult<MenuItemDef>` |
| `updateMenuItemAction(id, input)` | admin | `menuItemUpdateSchema` (nombre y versión) | `ActionResult<MenuItemDef>` |
| `toggleMenuItemActiveAction(input)` | admin | `menuItemToggleSchema` | `ActionResult` |
| `deleteMenuItemAction(input)` | admin | `menuItemDeleteSchema` | `ActionResult` |
| `toggleMenuItemVisibilityAction(input)` | admin | `menuItemVisibilitySchema` | `ActionResult` |
| `fetchMenuPhotos(menuItemId)` | admin | uuid | `MenuPhotoDef[]` (vacía ante cualquier error) |
| `uploadMenuPhotoAction(input)` | admin | `uploadMenuPhotoSchema`: JPG, PNG o WEBP en base64, hasta 5 MB | `ActionResult<MenuPhotoDef>` |
| `deleteMenuPhotoAction(input)` | admin | `deleteMenuPhotoSchema` | `ActionResult` |
| `fetchCatalog()` | **Público** | — | `CatalogItemDef[]` (vacía ante cualquier error) |
| `fetchCatalogItem(id)` | **Público** | uuid (otro valor da `null`) | `CatalogItemDef | null` |

Toda mutación que cambia lo que muestra el catálogo (alta, edición, activar, borrar, visibilidad, fotos, costo y
precio, ingresos y mermas de stock, cobros y anulaciones) llama a `afterCatalogChange` (`src/lib/catalog-cache.ts`,
T-11).

## Datos

- `menu_items`: grupo (enum `menu_group`), nombre (`varchar(60)`), costo unitario, stock (`numeric(10,1)`), precios
  `price_1`, `price_3`, `price_6` y `price_12` (nulos según el grupo), `is_active`, `is_visible` (catálogo, por defecto
  `false`), `is_base` (US-29, por defecto `false`), `version`.
  - `unique(menu_group, name)`.
  - `CHECK`: costo ≥ 0; stock ≥ 0 y en medias; sólo Pizzas admite medias. Precios (`menu_items_prices_check`,
    US-28): Empanadas y Sándwich de miga, los cuatro nulos o los cuatro > 0; Pizzas, Ciabattas y bebidas, `price_1` nulo o
    > 0 y los demás nulos.
  - Bases (US-29, migración `0021_prepizzas-y-panes`): índice único parcial `menu_items_one_base_per_group` (una
    por grupo) y `menu_items_base_check` (sin costo ni precios, sólo en Pizzas o Ciabattas y con stock entero). La
    migración crea las dos bases en 0 y deja en 0 el stock de los gustos de Pizzas y Ciabattas.
  - Concurrencia optimista: editar filtra por `version`.
- `menu_group_prices` ya no existe: la migración `0020_precios-por-gusto` copió el precio de cada grupo a sus gustos y
  después la borró (US-28).
- `menu_item_images`: las fotos de cada gusto (`public_id` de Cloudinary, `url`), que se borran en cascada con el
  gusto. Reemplaza a `product_images` del modelo viejo (T-12).
- Auditoría en `audit_logs` con `entity` `MENU_ITEM` (también "Costo y precio" de Stock). Subir y borrar una foto
  también se audita. Los registros viejos de `MENU_GROUP_PRICES` se siguen mostrando como "PRECIOS".
- Seed (`db:seed`, `src/lib/db/scripts/menu-seed-data.ts`): los gustos de `specs.md`, cada uno con su costo y sus
  precios de demo (todas las empanadas al mismo precio, igual que las ciabattas), y bebidas de demo, todos visibles en
  el catálogo. Los gustos de Pizzas y Ciabattas van sin stock, y la Prepizza y el Pan de ciabatta en 0 (US-29); los
  tests de integración los siembran con `src/test/seed-bases.ts`, porque `truncateAll` los borra.

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Sin sesión | `UNAUTHENTICATED` | No autorizado (Token faltante) | `actions/menu-errors.contract.test.ts` |
| Un vendedor crea, edita, activa o borra | `FORBIDDEN` | Solo los administradores pueden realizar esta acción | `menu-errors.contract.test.ts` |
| Nombre vacío o de más de 60 | `VALIDATION` | Los datos proporcionados no son válidos. | `menu-errors.contract.test.ts`, `domain/*.schema.test.ts` |
| Nombre repetido en el grupo | `DUPLICATE` | Ya existe un registro con esos datos (DNI, nombre o código duplicado). | `menu-errors.contract.test.ts` |
| Editar, activar o borrar con una versión vieja | `STALE_VERSION` | Otro usuario cambió estos datos. Ya se actualizaron; intentá de nuevo. | `menu-errors.contract.test.ts` |
| Editar un producto que ya no existe | `NOT_FOUND` | El producto ya no existe. | `menu-errors.contract.test.ts` |
| Borrar un producto con movimientos | `HAS_RELATIONS` | No se puede completar la operación porque existen registros relacionados. | `menu-errors.contract.test.ts` |
| Editar, activar, desactivar, mostrar en el catálogo o borrar una base (US-29) | `VALIDATION` | Los datos proporcionados no son válidos. | `services/menu-bases.test.ts` |
| Un vendedor muestra u oculta un gusto o maneja fotos | `FORBIDDEN` | Solo los administradores pueden realizar esta acción | `menu-catalog.contract.test.ts` |
| Foto que no es JPG, PNG o WEBP, o una URL (no se llama a Cloudinary) | `VALIDATION` | La imagen tiene que ser JPG, PNG o WEBP | `upload-menu-photo.contract.test.ts`, `menu-catalog.contract.test.ts`, `domain/catalog.test.ts` |
| Foto de más de 5 MB (no se llama a Cloudinary) | `VALIDATION` | La imagen no puede superar los 5 MB | `upload-menu-photo.contract.test.ts`, `domain/catalog.test.ts` |
| Foto para un gusto que ya no existe (no se llama a Cloudinary) | `NOT_FOUND` | El producto ya no existe. | `upload-menu-photo.contract.test.ts`, `services/menu-photo.service.test.ts` |
| Borrar una foto que ya no está | `NOT_FOUND` | La foto ya no existe. | `menu-catalog.contract.test.ts` |
| Visibilidad con una versión vieja | `STALE_VERSION` | Otro usuario cambió estos datos. Ya se actualizaron; intentá de nuevo. | `menu-catalog.contract.test.ts` |

Si Cloudinary sube la foto pero falla el guardado en la base, la imagen se borra de Cloudinary (BUG-11). Los límites (JPG, PNG o WEBP de hasta 5 MB) son una decisión provisoria del agente (D-5 de [`sprint-2.md`](../../plans/sprint-2.md#d-5--formatos-y-tamaño-de-las-fotos-bug-11)).

## Pantallas

`src/app/(main)/alta-de-productos/page.tsx` → `MenuPanel`:

- La barra con búsqueda, filtro por grupo y "Ver inactivos", y la grilla: tabla en escritorio y tarjetas en
  mobile.
- El formulario (`MenuItemFormModal`) pide sólo "Grupo" y "Nombre del gusto o bebida". El grupo no se cambia al editar.
- La grilla muestra Grupo, Gusto / bebida, Stock y Acciones. No lista las bases (US-29).
- Cada fila tiene "Mostrar en el catálogo" / "Ocultar del catálogo" y "Fotos" (`MenuPhotosModal`, `use-menu-photos.ts`).
  Los visibles llevan la marca "En catálogo".
- Estados: esqueleto mientras carga, mensaje cuando el grupo no tiene gustos, y errores del servidor en el
  formulario o en el aviso superior.

Catálogo público: `src/app/home/` (grilla, filtro por grupo, búsqueda y precio) y `src/app/product/[id]/` (ficha con
fotos y precios), con `fetchCatalog` y `fetchCatalogItem`.

## Tests

- Unit: `domain/*.test.ts` (grupos, precios, schemas, con fuzz) y `services/*.test.ts` con el fake (las bases en Alta y
  en el catálogo: `services/menu-bases.test.ts`).
- Contrato y fuzz: `actions/*.contract.test.ts`.
- Comportamiento del repositorio: `testing/*.behavior.ts`, contra el fake y contra Drizzle (`repository/*.int.test.ts`).
- Componente: `ui/*.test.tsx` (también fotos y visibilidad).
- E2E: `tests/landing.spec.ts` (ocultar y mostrar un gusto desde Alta se refleja al instante en el catálogo) y
  `tests/pruebasCompuestas.spec.ts` (un gusto vendido no se puede borrar).
- Mutación: `menu/{domain,services}` en `stryker.config.mjs`.

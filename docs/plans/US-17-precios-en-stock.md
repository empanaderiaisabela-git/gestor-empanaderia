# Plan: US-17 — Alta pide grupo y nombre; costo y precio en Ingresar stock

- **Ítem del backlog**: US-17
- **Autor**: Claude Code · **Fecha**: 2026-10-27 · **Estado**: Aprobado por el dev (plan del Sprint 3, 2026-10-26)
- **Rama**: `feat/us-17-precios-en-stock`
- **Nivel de tests**: 3 · profundo (schema, migración y cambios entre capas)

## Objetivo

Dar de alta un gusto con su grupo y su nombre, nada más. El costo para el local y el precio de venta se cargan al
ingresar stock, que desde US-16 es sólo del administrador.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Qué pide el alta? | Grupo y nombre. La edición, sólo el nombre | dev, 2026-10-26 |
| ¿Dónde se cargan costo y precio? | Sólo en Ingresar stock; para cambiar un precio hay que ingresar mercadería | dev, 2026-10-26 |
| ¿Y el precio de Empanadas y Ciabattas, que es del grupo? | Se carga en Ingresar stock de cualquier gusto del grupo y cambia el precio del grupo | agente, D-1 |
| ¿La grilla de Alta sigue mostrando costo y precio? | No: grupo, gusto, stock y acciones | agente, D-4 |
| ¿Un gusto sin precio se vende o va al catálogo? | No: Ventas muestra sólo gustos con stock (US-19) y el catálogo sólo gustos con precio | dev, 2026-10-26 y agente |
| Textos | Mínimos: "Costo por unidad", "Precio de venta, 1 unidad"; sin aclaraciones largas | dev, 2026-10-26 |

## Cambios por capa

| Capa | Archivos | Cambio |
|---|---|---|
| schema + migración | `src/lib/db/menu-schema.ts` | `unit_cost` nullable con check "nulo o ≥ 0"; `menu_items_prices_check` acepta todos los precios nulos en Pizzas, Sanguches y bebidas |
| domain | `menu/domain/menu-item.schema.ts`, `stock/domain/stock.schema.ts` | Alta `{ group, name }`, edición `{ name, version }`; la entrada de stock suma `prices?` |
| repository | `stock/repository/stock.repository.ts` (+ fake), unidad de trabajo de stock | `saveItem` guarda también los precios; la unidad de trabajo usa el repositorio de precios del grupo |
| service | `stock/services/stock.service.ts`, `menu/services/menu-item.service.ts` | Primer ingreso: costo y precio obligatorios; después, opcionales. El alta no guarda costo ni precio |
| errores | `src/lib/errors` | `MISSING_COST` ("Falta el costo para el local.") y `MISSING_PRICE` ("Falta el precio de venta.") |
| ui | `menu/ui/*` (alta, grilla, tarjetas de precios del grupo), `stock/ui/*` (campos de precio, "Sin precio"/"Sin costo") | Alta simple; precios en Ingresar stock |
| catálogo | `menu/services/catalog.service.ts` | Sólo gustos con precio |

## Restricciones de base de datos

- `menu_items.unit_cost` nulo o ≥ 0.
- Sanguches: los cuatro precios nulos o los cuatro > 0. Pizzas, Coca-Cola y Pepsi: `price_1` nulo o > 0, y los demás
  nulos. Empanadas y Ciabattas: sin precios propios (como hoy).

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Primer ingreso sin costo | `MISSING_COST` | Falta el costo para el local. | `stock.service.test.ts`, contrato |
| Ingreso de un gusto sin precio (ni del gusto ni del grupo) y sin precio nuevo | `MISSING_PRICE` | Falta el precio de venta. | `stock.service.test.ts`, contrato |
| Precio de una presentación que el grupo no vende, o faltan precios del grupo | `VALIDATION` | Los datos proporcionados no son válidos. | `stock.service.test.ts` |
| Alguien cambió el gusto o el precio del grupo a la vez | `STALE_VERSION` | Los datos en el servidor han cambiado… | `stock.service.test.ts` |

## Tests

| Tipo | Casos |
|---|---|
| Unit: dominio y service | Alta sin costo ni precio; primer ingreso con y sin costo/precio; ingreso siguiente con campos vacíos; precio de un gusto y del grupo |
| Contrato y fuzz | `createMenuItemAction` con `{ group, name }`; `registerStockEntryAction` con precios |
| Integración | Los checks nuevos aceptan un gusto sin costo ni precio y rechazan un sanguche con un solo precio |
| Componente | Alta con grupo y nombre; Ingresar stock con los campos de precio de cada grupo |
| E2E | Alta de un gusto, primer ingreso con costo y precio, el gusto aparece con su precio en Stock |

## Riesgos y decisiones

- D-1 y D-4 en `docs/plans/sprint-3.md`.
- Los gustos existentes ya tienen costo y precio: la migración no cambia datos.

# Plan: US-29 — Prepizzas y panes de ciabatta

- **Ítem del backlog**: US-29
- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-28 · **Estado**: Aprobado (modo autónomo del Sprint 4;
  decisiones del dev y provisorias en [`sprint-4.md`](sprint-4.md))
- **Rama**: `feat/us-29-prepizzas-y-panes`
- **Nivel de tests**: 3 · profundo (schema, migración, cobro, anulación y pérdidas)

## Objetivo

El local no guarda pizzas ni ciabattas por gusto: guarda prepizzas y panes de ciabatta. Los gustos siguen existiendo,
con su costo y su precio, pero cada pizza vendida descuenta una prepizza y cada ciabatta, un pan.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Quién carga las bases? | El administrador, en Stock: la base es la primera fila de su grupo, con "Ingresar stock" (cantidad y proveedor opcional, sin costo) y "Registrar pérdida". | dev, 2026-10-28 |
| ¿Dónde se cargan costo y precio de los gustos? | En Stock, con "Costo y precio" (US-28), sin cantidad. | dev |
| ¿Cuánto resta una pérdida de base? | Nada de la ganancia: sólo baja el contador (costo 0). | dev |
| ¿Con cuánto arrancan las bases? | En 0. El stock de los gustos de pizza y ciabatta se descarta. | dev |
| ¿Qué descuenta una mitad y mitad? | 1 prepizza; costo ½ + ½ y precio del gusto más caro, como hoy. | D-1 |
| ¿Dónde aparecen las bases? | Sólo en Stock. No se borran, no se renombran, no se venden solas. | D-2 |
| ¿Cuándo Ventas muestra un gusto de pizza? | Si queda al menos 1 prepizza (contando lo que ya está en el pedido) y el gusto tiene precio. Igual con ciabatta y pan. | D-3 |
| ¿Qué devuelve la anulación? | Una base por cada pizza o ciabatta: suma las unidades guardadas de los gustos del grupo (½ + ½ = 1). Vale para ventas viejas. | D-8 |
| ¿Y el catálogo público? | Un gusto de pizza figura con stock si queda al menos 1 prepizza. | D-9 |
| ¿Y las promos? | Descuentan la base igual que la venta suelta. | D-11 |
| ¿Concurrencia? | La base se bloquea (`for update`) en el cobro, la anulación, el ingreso y la pérdida, y se guarda con `version`. | regla del repo |

**Preguntas abiertas**: ninguna.

## Modelo elegido

Las bases son filas de `menu_items` con una columna nueva `is_base` (`boolean not null default false`): "Prepizza" en
Pizzas y "Pan de ciabatta" en Ciabattas. Así `stock_entries`, `stock_losses`, `lockItem` y `saveItem` sirven sin
cambios, y la grilla de Stock las muestra como una fila más de su grupo.

Se descartó una tabla aparte de bases: obligaba a que ingresos y pérdidas apunten a dos tablas distintas.

## Cambios por capa

| Capa | Archivos | Responsabilidad |
|---|---|---|
| dominio | `src/features/menu/domain/menu-groups.ts` | `BASE_GROUPS` (`pizzas`, `ciabattas`) y `hasBase(group)`. |
| dominio | `src/features/order/domain/order-usage.ts` | `stockUsage(lines, baseOf)`: en los grupos con base cada unidad de la línea consume 1 de la base; en el resto, como hoy. `lineUsage` sigue igual para el costo y para `sale_line_items`. `availableStock` usa la base para los gustos de esos grupos. |
| schema + migración | `src/lib/db/menu-schema.ts`, `0021_prepizzas-y-panes.sql` | Columna `is_base`; índice único parcial "una base por grupo" (`menu_group` donde `is_base`); check: una base no tiene costo ni precios. La migración inserta las dos bases con stock 0 y pone en 0 el stock de los gustos de Pizzas y Ciabattas. |
| repositorio | `stock.repository.ts`, `checkout-unit-of-work.ts`, `sale-history` | Leer la base de un grupo y bloquearla. |
| servicio: cobro | `checkout-steps.ts`, `checkout-promos.ts` | Bloquea las bases que usa el pedido y descuenta con `stockUsage`; sin bases suficientes, `INSUFFICIENT_STOCK` con el nombre de la base ("Prepizza"). |
| servicio: anulación | `sale-history.service.ts` | Suma por grupo las unidades de los gustos con base y las devuelve a la base (D-8). |
| servicio: Stock | `stock-entry-plan.ts`, `stock.service.ts`, servicio de "Costo y precio" | Ingreso de una base: sólo cantidad, costo 0 y sin precios. Ingreso o pérdida de un gusto con base: `VALIDATION`. "Costo y precio" de una base: `VALIDATION`. |
| servicio: precios | `stock-pricing.ts` (US-28) | "Aplicar a todos los gustos del grupo" no toca la base: `lockGroup` la excluye. |
| servicio: Alta | servicio de menú | Las bases no se listan en Alta; editar, activar o borrar una base da `VALIDATION`. |
| catálogo | `catalog.ts`, `catalog.service.ts` | Sin bases; los gustos con base figuran con stock según su base. |
| ui: Stock | `stock-columns.tsx`, `stock-entry-fields.tsx`, `stock-panel.tsx` | La base es la primera fila de su grupo, con su contador y sus dos botones; los gustos con base muestran "—" en Stock y sólo "Costo y precio". En Ingresar stock, la categoría Pizzas ofrece sólo la Prepizza (Ciabattas, el pan). |
| ui: Ventas | `use-order-board.ts`, `flavor-row.tsx` | Gustos con base visibles según D-3; el stock disponible es el de la base menos lo que ya está en el pedido. |
| seed y tests | `seed-menu.ts`, `scripts/e2e-prepare.ts`, `src/test/` | El seed crea las dos bases. Un helper de test las siembra después de `truncateAll`. |

## Restricciones de base de datos

- `menu_items.is_base boolean not null default false`.
- Índice único parcial `menu_items_one_base_per_group` sobre `menu_group` donde `is_base`.
- Check `menu_items_base_check`: `not is_base or (unit_cost is null and price_1 is null and price_3 is null and price_6 is null and price_12 is null and menu_group in ('pizzas', 'ciabattas'))`.
- El stock de la base es entero (el check de medias unidades sigue valiendo sólo para gustos de Pizzas, que quedan en 0).

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Cobrar más pizzas que prepizzas | `INSUFFICIENT_STOCK` | No hay stock suficiente de Prepizza. | servicio + contrato |
| Ingresar stock o registrar pérdida de un gusto de pizza o ciabatta | `VALIDATION` | Los datos proporcionados no son válidos. | servicio |
| "Costo y precio" de una base | `VALIDATION` | idem | servicio |
| Editar, activar o borrar una base en Alta | `VALIDATION` | idem | servicio |

## Tests

| Tipo | Casos |
|---|---|
| Unit: dominio | `stockUsage`: pizza de 1 y de 2 sabores, ciabatta, empanadas sin cambios, cantidad > 1, promo. `availableStock` con base. |
| Unit: servicio | Cobro (descuenta la base, costo congelado del gusto, `INSUFFICIENT_STOCK`), anulación (venta nueva y vieja con ½ + ½), ingreso y pérdida de base (costo 0), rechazos de gustos con base. |
| Contrato | Cobro sin prepizzas; ingreso de un gusto de pizza rechazado. |
| Fuzz | `stockUsage` nunca da negativo y suma una base por unidad. |
| Integración | Migración (bases creadas, stock de gustos en 0, checks), cobro y anulación contra db-test. |
| Componente | Grilla de Stock con la base primero; tablero de Ventas con y sin prepizzas. |
| E2E | Se ingresan 2 prepizzas, se vende una mitad y mitad y una muzzarella, el contador queda en 0 y los gustos de pizza desaparecen de Ventas (CA-5). |

## Riesgos y decisiones

- La migración pone en 0 el stock de los gustos de pizza y ciabatta de la base real: es la decisión del dev ("arrancan
  en 0, el administrador carga lo que hay"). El historial de ingresos de esos gustos queda como registro.
- `truncateAll` borra las bases: cada test que las necesite las siembra con el helper.
- Las ventas viejas guardaron ½ de cada gusto; la anulación las convierte a bases sumando por grupo, así no hace falta
  migrar `sale_line_items`.

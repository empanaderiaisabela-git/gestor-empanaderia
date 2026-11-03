# Plan: US-57 — La promo fija bebida y litros; el sabor se elige al vender

- **Ítem del backlog**: US-57
- **Autor**: Claude Code · **Fecha**: 2026-11-02 · **Estado**: Aprobado por el dev (2026-11-02, "plan y sigo")
- **Rama**: `feat/us-57-bebida-fija-por-familia`
- **Nivel de tests**: 3 · profundo (repositorio y cobro)

## Objetivo

US-55 fija un producto exacto ("Aquarius 1 L Pera"). El cliente quiere fijar sólo la bebida y los litros ("Aquarius
1 L"), y que el vendedor elija el sabor al venderla.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Qué fija el admin? | Bebida + litros, es decir la familia de US-51 ("Aquarius 1 L"). | dev, 2026-11-02 |
| ¿Quién elige el sabor? | El vendedor, al vender: la lista de esa parte muestra sólo los productos de la familia. | dev, 2026-11-02 |
| ¿Y si no hay sabor que elegir? | Se fija tal cual ("Sprite 1L"). Se generaliza: si de la familia hay **un solo producto a la venta**, viene puesto y "Siguiente" lo saltea. | dev, 2026-11-02 (ejemplo "Sprite 1L") |
| ¿Promos con bebida fija ya creadas en producción? | Ninguna. | dev, 2026-11-02 |
| ¿Qué pasa con `menu_item_id`? | Sigue en uso: apunta a un producto de la familia, y de ahí salen bebida y litros. Sin migración. | dev pidió la explicación; ver "Riesgos" |
| ¿Sin stock? | Si ningún producto de la familia está a la venta, la promo queda deshabilitada con "Sin stock de Aquarius 1 L" (US-55 CA-3). | US-55 |

**Preguntas abiertas**: ninguna.

## Cambios por capa

| Capa | Archivos | Responsabilidad |
|---|---|---|
| menu domain | `menu/domain/drink.ts` | `FixedDrink` y `matchesDrink(item, fixed)`: el mismo producto, o la misma bebida y litros (`sizeOf`). `fixedDrinkLabel`: "Aquarius 1 L", o el nombre del producto si es una bebida vieja sin bebida ni litros. |
| promotion domain | `promotion.schema.ts`, `promotion-describe.ts` | La fila suma `drinkName` y `drinkSize` del producto fijado; la descripción usa `fixedDrinkLabel`. |
| repository (+ fake) | `promotion.repository.ts`, `fake-promotion-unit-of-work.ts` | El `leftJoin` también lee bebida y litros del producto (`sizeOf`). |
| order domain y store | `promo-line.ts`, `order-promos.ts` | Cada parte lleva su `drink` fijo (o `null`). `newPromoLine` recibe `single(part)`: si devuelve un producto, la parte viene puesta. |
| order ui | `promo-card.tsx`, `use-picker-target.ts`, `flavor-picker.tsx` | El botón calcula los productos de la familia a la venta: ninguno ⇒ deshabilitado; uno ⇒ puesto. La lista de una parte fija muestra sólo su familia. |
| order cobro | `checkout-promos.ts`, `checkout.service.ts` | Después de bloquear los gustos, cada parte fija tiene que traer productos de su familia; si no, `VALIDATION`. |
| promotion ui | `drink-families.ts` (nuevo), `promotion-component-fields.tsx` | "Bebida" ofrece una opción por familia ("Aquarius 1 L"), con el id del primer producto por nombre; muestra la elegida aunque no tenga productos activos. |

Sin migración: la FK compuesta, el `check` y el `unique` de US-55 siguen valiendo.

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Cobrar una parte fija con un producto de otra familia | `VALIDATION` | Los datos proporcionados no son válidos. | `checkout-promos.test.ts` |
| La misma familia dos veces en el mismo grupo | `VALIDATION` | Ese producto ya está en la promo: sumá la cantidad | `promotion.schema.test.ts` (mismo id) |
| Sin productos de la familia a la venta | — (botón deshabilitado) | Sin stock de Aquarius 1 L | `promo-board.test.tsx` |

## Tests

| Tipo | Casos |
|---|---|
| Unit (menu) | `matchesDrink`: mismo producto, misma familia con otro sabor, otros litros, bebida vieja sólo con su id. `fixedDrinkLabel`. |
| Unit (order) | `newPromoLine` con `single`: puesta si hay uno, abierta si hay varios. Fuzz: sólo quedan completas las partes que `single` resuelve. |
| Unit (cobro) | Parte fija con otro sabor de la familia: cobra. Con otra familia: `VALIDATION`. |
| Unit (promotion ui) | Opciones por familia, sin repetir, con la elegida aunque esté inactiva, y su valor. |
| Integración | El repositorio lee bebida y litros del producto fijado. |
| Componente | Ventas: con varios sabores pide elegir y la lista muestra sólo la familia; con uno viene puesto; sin stock, deshabilitado. Promociones: elegir "Aquarius 1 L". |
| E2E | `promo-venta.spec.ts` (US-55) sigue: "Sprite 1,5 L" es una bebida vieja del seed, familia de un producto, viene puesta. |
| CA → test | CA-1 → promotion ui y componente · CA-2 → order y componente · CA-3 → cobro e integración. |

## Riesgos y decisiones

- **`menu_item_id`** guarda el producto que fijó la promo. Ahora representa a su familia: si el admin edita bebida o
  litros de ese producto, la promo los sigue. Ese producto no se puede borrar mientras esté en una promo
  (`HAS_RELATIONS`, decisión confirmada en US-55), aunque haya otros sabores.
- Dos productos de la misma familia elegidos en momentos distintos podrían quedar como dos filas de la misma
  familia; equivale a sumar la cantidad y no rompe nada.
- "Un solo producto a la venta ⇒ viene puesto" depende del stock del momento: si sólo queda Pera, viene Pera.

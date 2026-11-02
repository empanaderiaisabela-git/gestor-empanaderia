# Plan: US-55 — Bebida fija en las promos

- **Ítem del backlog**: US-55
- **Autor**: Claude Code · **Fecha**: 2026-11-02 · **Estado**: Aprobado por el dev (2026-11-02)
- **Rama**: `feat/us-55-bebida-fija-en-promos`
- **Nivel de tests**: 3 · profundo (schema, migración, repositorio y cobro)

## Objetivo

Hoy una promo dice "Coca-Cola · 1 unidad" y el vendedor elige la bebida al venderla. El cliente quiere que, al armar
la promo, el admin pueda **fijar la bebida** (por ejemplo "Coca-Cola 1.5L"). Al venderla, el vendedor sólo elige la
comida; la bebida ya viene puesta. Si no se fija, todo sigue como hoy.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Qué se puede fijar? | Sólo la bebida de los productos de Coca-Cola y Quilmes. La comida se sigue eligiendo al vender. | dev, 2026-11-02 |
| ¿Es obligatorio fijarla? | No: por defecto queda "Cualquiera", como hoy. | dev ("pueda fijar") |
| ¿Con cantidad 2? | Una bebida por producto de la promo: con cantidad 2, las dos son esa bebida. Para dos bebidas distintas se agregan dos productos de Coca-Cola, cada uno con la suya. | dev, 2026-11-02 |
| ¿Y si al vender la bebida fijada no tiene stock o está desactivada? | El botón de la promo en Ventas queda deshabilitado, con el aviso "Sin stock de &lt;bebida&gt;". | dev, 2026-11-02 |
| ¿Qué rol? | Fija la bebida el admin (Promociones); vende el admin o el vendedor, como hoy. | US-8, US-9 |
| ¿Concurrencia? | Igual que hoy: editar una promo filtra por `version`. | US-8 |
| Carga / vacío / error | La lista de bebidas sale de los productos ya cargados; mientras carga, sólo "Cualquiera". Los errores, en el aviso del formulario como hoy. | código |

**Preguntas abiertas**: ninguna.

## Cambios por capa

| Capa | Archivos | Responsabilidad |
|---|---|---|
| domain | `promotion/domain/promotion.schema.ts` | Cada producto suma `menuItemId` (opcional, `null` = cualquiera). Sólo se acepta en Coca-Cola y Quilmes. "Repetido" pasa a ser grupo + presentación + bebida fijada. La fila devuelve también `menuItemName`. |
| domain | `promotion/domain/promotion-describe.ts` | Un producto con bebida fijada se describe con su nombre: "Empanadas · 1 docena + Coca-Cola 1.5L × 2". |
| schema + migración | `promotion-schema.ts`, `menu-schema.ts`, `0030_bebida-fija-en-promos.sql` | Ver "Restricciones". |
| repository (+ fake) | `promotion.repository.ts`, `fake-promotion-unit-of-work.ts`, `promotion-repository.behavior.ts` | Guarda `menu_item_id` y lee el nombre de la bebida con un `leftJoin` a `menu_items`. El fake simula la FK y el nombre. |
| service | — | Sin cambios: la base garantiza la bebida y la auditoría ya usa `describeComponents`, que trae el nombre. |
| actions | — | Sin cambios: validan con el schema. |
| order (domain y store) | `promo-line.ts`, `order-promos.ts`, `use-picker-target.ts` | Al empezar la promo, el producto con bebida fijada ya viene completo. "Siguiente" salta al próximo producto sin completar, y dice "Listo" si no queda ninguno. |
| order (cobro) | `checkout-promos.ts` | El servidor rechaza una promo cuyo producto fijado trae otra bebida. |
| order (ui) | `promo-card.tsx` | El botón de la promo queda deshabilitado si la bebida fijada no está a la venta. |
| promotion (ui) | `promotion-form.ts`, `promotion-component-fields.tsx`, `use-drink-options.ts` (nuevo) | En Coca-Cola y Quilmes, el selector de presentación (que sólo tiene "1 unidad") se reemplaza por **Bebida**: "Cualquiera" y las bebidas activas del grupo, por nombre. |

## Restricciones de base de datos

Migración 0030, sólo aditiva:

- `promotion_components.menu_item_id uuid` (nullable).
- `menu_items`: `unique (id, menu_group)`, que hace falta para la FK compuesta.
- FK compuesta `(menu_item_id, menu_group) → menu_items (id, menu_group)`, sin `onDelete`. Así la bebida existe y es
  del mismo grupo que el producto. Además, no se puede borrar una bebida fijada en una promo: da `HAS_RELATIONS`, como
  hoy pasa con una bebida ya vendida.
- `check`: `menu_item_id` es `null` o el grupo es `coca_cola` o `pepsi`.
- `promotion_components_unique` se recrea (DROP + ADD en la misma migración, D-5) sobre promo + grupo + presentación
  + bebida, con `NULLS NOT DISTINCT`. Así dos Coca-Cola "Cualquiera" siguen siendo un repetido, y dos Coca-Cola con
  bebidas distintas no.

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Fijar una bebida en un producto de comida | `VALIDATION` | Sólo se puede fijar una bebida | `promotion.schema.test.ts`, contrato |
| La misma bebida (o "Cualquiera") dos veces en el mismo grupo | `VALIDATION` | Ese producto ya está en la promo: sumá la cantidad | `promotion.schema.test.ts` |
| Una bebida que no existe o es de otro grupo | `RELATION_NOT_FOUND` | Una de las entidades relacionadas ya no existe. | behavior del repositorio, contrato |
| Borrar en Alta de productos una bebida fijada en una promo | `HAS_RELATIONS` | No se puede completar la operación porque existen registros relacionados. | integración |
| Cobrar la promo con otra bebida en el producto fijado | `VALIDATION` | Los datos proporcionados no son válidos. | `checkout` service |
| Bebida fijada sin stock o desactivada | — (botón deshabilitado) | Sin stock de &lt;bebida&gt; | componente |

## Tests

| Tipo | Casos |
|---|---|
| Unit (dominio) | El schema acepta la bebida en Coca-Cola y Quilmes, la rechaza en comida y deja dos Coca-Cola con bebidas distintas. `describeComponents` muestra el nombre. `newPromoLine` arranca con la bebida puesta. El próximo producto abierto salta los fijados. |
| Unit (service de cobro) | Una promo con bebida fijada se cobra con esa bebida y descuenta su stock; con otra bebida da `VALIDATION`. |
| Fuzz | Para cualquier lista de productos, `newPromoLine` deja completos exactamente los que tienen bebida fijada. |
| Contrato | Crear una promo con bebida fijada; `VALIDATION` en comida; `RELATION_NOT_FOUND` con una bebida inexistente. |
| Integración | La migración corre sobre `db-test`. La FK rechaza una bebida de otro grupo. Borrar una bebida fijada da `HAS_RELATIONS`. Se leen el id y el nombre de la bebida. |
| Componente | El formulario muestra "Bebida" en Coca-Cola y Quilmes y la guarda. El botón de Ventas se deshabilita sin stock. |
| E2E | `promo-venta.spec.ts`: promo con Sprite fijada; al venderla sólo se elige la comida y el historial muestra la Sprite. |
| CA → test | CA-1 → schema, componente y contrato · CA-2 → dominio de `promo-line` y E2E · CA-3 → componente de Ventas · CA-4 → service de cobro e integración. |

## Riesgos y decisiones

- **Decisión del agente**: borrar una bebida fijada en una promo se bloquea (`HAS_RELATIONS`). Es lo más prudente y lo
  mismo que pasa con una bebida ya vendida. Para sacarla de la venta se desactiva, y la promo queda deshabilitada en
  Ventas hasta cambiar la bebida o volver a activarla. Si el dev prefiere que la promo pase sola a "Cualquiera",
  la FK lleva `onDelete set null`.
- **Cambio chico de comportamiento**: "Siguiente" ahora salta los productos ya completos (los fijados). En una promo
  nueva no cambia nada más, porque los productos que siguen están vacíos.
- El texto "Productos de la promo (los gustos se eligen al vender)" deja de ser cierto para la bebida fijada. Pasa a
  "Productos de la promo".
- Supabase tiene que migrarse a mano (lo hace el dev) antes de llevar esto a `main`.

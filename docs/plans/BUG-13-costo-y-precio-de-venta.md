# Plan: BUG-13 — Alta y Stock confunden el costo con el precio de venta

- **Ítem del backlog**: BUG-13
- **Autor**: Agente · **Fecha**: 2026-10-25 · **Estado**: Aprobado
- **Rama**: `fix/bug-13-costo-y-precio-de-venta`

## Objetivo

En Alta de productos y en Stock, el costo y el precio se confunden:

- en la pizza, "Costo por unidad" parece un precio por porción;
- en Empanadas y Ciabattas, el costo de cada gusto parece un precio por gusto que contradice el del grupo.

Se aclaran los textos. El costo es lo que le cuesta al local y el precio de venta es lo que paga el cliente.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente (US, dev, cliente) |
|---|---|---|
| ¿Costo y precio son lo mismo? | No. El costo es lo que le cuesta al local hacerlo o comprarlo y sirve para la ganancia en limpio. El precio de venta es lo que paga el cliente | Dev, 2026-10-25; `specs.md` (KPI de ganancias) |
| ¿Cómo se nombran? | Siempre "Costo para el local" y "Precio de venta", nunca "costo" o "precio" a secas | Dev: "quiero dejar bien en claro siempre a los usuarios…" |
| ¿La pizza va por porción? | No: costo y precio de la pizza entera | Dev: "el precio de la pizza es entera, no por porciones" |
| ¿Empanadas y Ciabattas tienen costo del grupo? | No: el costo sigue por gusto; sólo el precio de venta es del grupo | Dev (aclaración al preguntar) |
| ¿Cambia la base o algún cálculo? | No: son sólo textos | — |

**Preguntas abiertas**: ninguna.

## Cambios por capa

| Capa | Archivos | Responsabilidad |
|---|---|---|
| domain | `menu/domain/menu-terms.ts` (nuevo), `menu-price-list.ts` | Términos "Costo para el local" y "Precio de venta", con sus aclaraciones; `costLabelOf(group)` (por unidad o por pizza entera). Para Empanadas y Ciabattas, el resumen dice "Igual para todas las <grupo>" |
| ui de menú | `menu-item-fields.tsx`, `group-price-card.tsx`, `menu-item-columns.tsx`, `menu-item-card.tsx` | Formulario, tarjetas "Precios de venta de <grupo>", columnas y tarjeta mobile |
| ui de stock | `stock-entry-fields.tsx`, `stock-columns.tsx`, `stock-history-modal.tsx` | Costo del ingreso según el gusto elegido, columnas e historial |
| página | `alta-de-productos/page.tsx` | Descripción de la pantalla |

No hay cambios de schema, migración, repository, service ni actions.

## Errores

No hay acciones nuevas ni errores nuevos.

## Tests

| Tipo | Casos |
|---|---|
| Unit | `menu-terms.test.ts`: costo por pizza entera y por unidad, y sin gusto elegido |
| Componente | `menu-item-fields.test.tsx` (pizza, sanguche, empanada y ciabatta), `group-price-card.test.tsx`, `menu-item-columns.test.tsx`, `menu-panel.test.tsx`, `stock-panel.test.tsx` (ingreso de una pizza), `stock-columns.test.tsx`, `stock-dialogs.test.tsx` |
| E2E | `tests/stock.spec.ts`: ingreso e historial con los textos nuevos |
| CA → test | CA-1: `menu-item-fields.test.tsx`, `group-price-card.test.tsx`. CA-2: `stock-panel.test.tsx`, `stock-dialogs.test.tsx`. CA-3: `menu-item-columns.test.tsx`, `stock-columns.test.tsx` |

## Riesgos y decisiones

- Las Estadísticas siguen con sus textos heredados hasta US-12, que las rehace con el mismo vocabulario (nota en
  US-12).
- No hace falta ADR: es una regla de textos, registrada en las decisiones del dev del backlog y en el glosario.

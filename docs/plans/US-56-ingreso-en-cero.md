# Plan: US-56 — Ingreso de stock en 0

- **Ítem del backlog**: US-56
- **Autor**: Claude Code · **Fecha**: 2026-11-02 · **Estado**: Aprobado por el dev (2026-11-02)
- **Rama**: `feat/us-56-ingreso-en-cero`
- **Nivel de tests**: 3 · profundo (cambia una restricción de la base y lleva migración)

## Objetivo

Si el cliente carga un ingreso que en realidad no le llegó, quiere corregirlo poniéndole 0 con el lápiz (o desde el
Historial). Así el stock vuelve a lo que había antes. Hoy la cantidad tiene que ser mayor a 0.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Qué pasa con el ingreso en 0? | Queda en el Historial con 0; el stock baja lo que había entrado. Auditoría guarda el antes y el después. | dev, 2026-11-02 |
| ¿Dónde vale el 0? | Al editar un ingreso y también en "Ingresar stock" nuevo. | dev, 2026-11-02 |
| ¿Y si ya se vendieron unidades de ese ingreso? | Se rechaza, como hoy al bajar un ingreso: "No hay stock suficiente de &lt;producto&gt;". El stock nunca queda negativo. | dev, 2026-11-02 |
| ¿Mermas? | Sin cambios: siguen pidiendo más de 0. | código |
| ¿Rol, concurrencia, estados de UI? | Sin cambios: sólo el admin, con `version`, y los mensajes de hoy. | US-46 |

**Preguntas abiertas**: ninguna.

## Cambios por capa

| Capa | Archivos | Responsabilidad |
|---|---|---|
| domain | `src/features/stock/domain/stock.schema.ts` | La cantidad del ingreso acepta 0 ("La cantidad no puede ser negativa" debajo de 0). Vale para crear y editar, porque `stockEntryUpdateSchema` extiende al de alta. |
| schema + migración | `src/lib/db/stock-schema.ts`, `0031_ingreso-en-cero.sql` | `stock_entries_quantity_check` pasa a `quantity >= 0` (DROP + ADD en la misma migración, D-5). |
| service, actions, ui | — | Sin cambios: el service ya resta la diferencia y rechaza el stock negativo; el formulario muestra el error del schema. |

## Restricciones de base de datos

`stock_entries_quantity_check`: `quantity >= 0`. `menu_items_stock_check` sigue impidiendo el stock negativo.

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Cantidad negativa | `VALIDATION` | La cantidad no puede ser negativa | `stock.schema.test.ts`, contrato |
| Bajar a 0 un ingreso del que ya se vendió | `INSUFFICIENT_STOCK` | No hay stock suficiente de &lt;producto&gt;. | `stock-entry-edit.test.ts` |

## Tests

| Tipo | Casos |
|---|---|
| Unit (dominio) | 0 se acepta en alta y en edición; −1 da el mensaje. Mermas siguen rechazando 0. |
| Unit (service) | Editar un ingreso de 24 a 0 devuelve el stock a lo de antes y audita; si ya se vendió, `INSUFFICIENT_STOCK`. |
| Contrato | Registrar un ingreso de 0 responde OK. |
| Componente | El lápiz guarda 0. |
| Integración | La migración corre sobre `db-test` y la base acepta un ingreso en 0. |
| CA → test | CA-1 → service y componente · CA-2 → dominio y contrato · CA-3 → integración. |

## Riesgos y decisiones

- Poner un ingreso en 0 no devuelve el costo ni los precios que ese ingreso cambió: quedan los del formulario, que
  se pueden corregir en el mismo paso.
- Supabase tiene que migrarse a mano (lo hace el dev) antes de llevar esto a `main`: queda en 32 migraciones.

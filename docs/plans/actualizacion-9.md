# Plan: Actualización 9 · US-70 — El lápiz de Stock pisa el stock

- **Autor**: Agente · **Fecha**: 2026-11-09 · **Estado**: Aprobado (dev, 2026-11-09)
- **Ítem**: US-70 (nuevo), sección nueva **Actualización 9 · El lápiz pisa el stock** en `BACKLOG.md`.
- **Rama**: `feat/us-70-lapiz-pisa-stock` desde `develop`.
- **Nivel de tests**: 3. Cambia cómo se mueve el stock: service, schema Zod y action. Cierra con `npm run verify` y E2E.
- **Fuera del commit**: el cambio sin commitear de `src/features/menu/ui/menu-item-fields.tsx` no es de este ítem. No se toca.

## Contexto

El lápiz de cada fila de `/stock` ("Editar último ingreso", US-48) y "Editar ingreso" del Historial (US-46) editan la
**cantidad del ingreso**, y el stock sube o baja la **diferencia** (`stock-entry-edit.ts:44`). Después de las ventas, el
número del formulario no coincide con el de la grilla. El cliente escribe el stock real, aparece otro número, prueba
con un 1 y descalabra el stock.

Pedido del dev (2026-11-09): **el lápiz manda**. El campo es el stock final: guarda exactamente ese valor, sin restar
ventas ni sumar ingresos.

## Decisiones del dev (2026-11-09)

| # | Pregunta | Respuesta |
|---|---|---|
| D-1 | ¿Qué abre el lápiz? | El mismo formulario de editar. "Cantidad que entra" pasa a ser **"Stock"**, precargado con el stock de la grilla, y pisa ese valor. |
| D-2 | ¿Qué queda registrado? | Sólo Auditoría: stock de antes y de después. Ningún ingreso cambia su cantidad, y no hay migración. |
| D-3 | ¿"Editar ingreso" del Historial? | **También pisa**, con el mismo formulario. |
| D-4 | ¿Lápiz en un gusto sin ingresos? | Sí. Abre el mismo formulario **sin Proveedor**. Guarda en el gusto y no crea ningún ingreso. |
| D-5 | ¿Cambio de gusto al editar? | **Bloqueado**: la categoría y el gusto se ven, pero no se cambian. |
| D-6 | ¿Hubo una venta entre que se abrió y se guardó? | `STALE_VERSION`: no guarda. El cliente reabre el formulario con el número nuevo. |

Reglas que siguen iguales:
- El costo del ingreso pasa a ser el costo del gusto sólo si cambió y es su ingreso más reciente (P-6).
- Costo y precio se comparten con la familia de la bebida (US-51).
- Primer costo o precio obligatorio (`MISSING_COST`, `MISSING_PRICE`).
- Las bases no llevan costo ni precios.
- Pizzas y Ciabattas no tienen lápiz.

## Cambios por capa

| Capa | Archivo | Cambio |
|---|---|---|
| domain | `src/features/stock/domain/stock.schema.ts` | Se reemplaza `stockEntryUpdateSchema` por `stockOverwriteSchema` (`strictObject`): `menuItemId`, `itemVersion`, `stock` (entero de 0 a 100.000, con mensajes "Ingresá el stock" y "El stock no puede ser negativo"), `unitCost?`, `prices?`, `providerId?`, `minStock?` y `entry: { id, version } \| null`. Tipo `StockOverwriteInput`. |
| service | `src/features/stock/services/stock-entry-edit.ts` | `updateEntry` pasa a ser `overwriteStock`. Pasos: (1) Si hay `entry`, `lockedEntry`; si es de otro gusto, `VALIDATION`. (2) `lockedItem`; con otra `version` que `itemVersion`, `STALE_VERSION`. (3) Si no hay `entry` y viene `providerId`, `VALIDATION`. (4) `planEntry` sigue validando el costo, los precios, las bases y Pizzas/Ciabattas. (5) Si hay ingreso, se actualizan su costo y su proveedor; la cantidad y el gusto no cambian. (6) `saveItem` con `stock: input.stock`, el mínimo, los precios y el costo: la regla de P-6 con ingreso, siempre sin ingreso. (7) `shareWithFamily`. (8) Audita `ACTUALIZAR` / `MENU_ITEM` con `entityId` del gusto y `{ name, stockBefore, stockAfter, entry?: { before, after } }`. Se borran `lockBoth`, `stockAfter` y la lógica de mover entre gustos. |
| service | `stock-entry-plan.ts` | `planEntry` recibe `Pick<StockEntryInput, 'unitCost' \| 'prices'>`: sólo cambia el tipo. |
| service | `stock.service.ts` | `updateEntry` pasa a `overwriteStock` en el tipo y en `createStockService`. |
| repository | — | Sin cambios: se reusa `updateEntry(ref, { menuItemId, quantity, unitCost, providerId })` y se le pasa la cantidad y el gusto que ya tenía el ingreso. |
| actions | `actions/update-stock-entry.ts` → `actions/overwrite-stock.ts` | `overwriteStockAction`: admin, parse con `stockOverwriteSchema` y mensaje "Stock actualizado: <gusto> queda con N". |
| ui | `ui/use-stock-panel.ts` | Nuevo `kind: 'edit'` en `StockDialog`, con `entry: StockEntryDef \| null`. `submitEntryUpdate` pasa a `submitOverwrite`. |
| ui | `ui/open-last-entry.ts` | Con o sin ingreso, abre `{ kind: 'edit', item, entry: last ?? null }`. Ya no cae al Historial. |
| ui | `ui/stock-history-modal.tsx` | "Editar ingreso" abre `{ kind: 'edit', item, entry }`. |
| ui | `ui/stock-columns.tsx` | El título del lápiz pasa a "Editar stock". `BUTTONS` se tipa sin `'edit'`. |
| ui | `ui/stock-panel.tsx` | Monta `StockEntryEditModal` con `dialog.kind === 'edit'`. |
| ui | `ui/stock-forms.ts` | `entryValuesOf(item, entry \| null)`: `quantity = String(item.stock)`, costo del ingreso o del gusto y proveedor del ingreso o vacío. Nuevo `parseOverwrite(values, { item, entry })`, que valida con `stockOverwriteSchema`. |
| ui | `ui/stock-entry-fields.tsx` / `stock-item-selects.tsx` | `editing` pasa a `{ hideProvider: boolean }` o similar. En edición, en lugar de los selects va una línea fija con la categoría y el nombre del gusto (D-5), el label "Stock" y, sin ingreso, sin Proveedor. Se borra la rama `editing` de `pickedValues`, que queda sin uso. |
| ui | `ui/stock-entry-edit-modal.tsx` | Título "Editar stock". Arma el input con `itemVersion: item.version` y `entry`. |
| db | — | Sin migración: Supabase sigue en 34. |

Respetar el tope de 100 líneas por archivo y de 40 líneas por función. Si `stock-entry-edit.ts` crece, separar la parte del ingreso.

## Errores

| Acción inválida | code | Mensaje |
|---|---|---|
| El vendedor edita el stock | `FORBIDDEN` | Solo los administradores… |
| Stock negativo, con decimales o mayor a 100.000; campos de más; sin `itemVersion` | `VALIDATION` | Los datos proporcionados no son válidos. |
| El ingreso es de otro gusto; proveedor sin ingreso; gusto de Pizzas o Ciabattas; base con costo | `VALIDATION` | ídem |
| El ingreso ya no existe | `NOT_FOUND` | El ingreso ya no existe. |
| El gusto ya no existe | `NOT_FOUND` | El producto ya no existe. |
| Hubo una venta u otro cambio en el gusto (D-6), u otro editó el ingreso | `STALE_VERSION` | Los datos en el servidor han cambiado… |
| Gusto sin costo ni precio y el formulario vacío | `MISSING_COST` / `MISSING_PRICE` | ya existentes |

`INSUFFICIENT_STOCK` desaparece de la edición: el stock lo escribe el usuario y Zod ya impide que sea negativo.

## Tests (TDD, en este orden)

- **Domain**: `stock.schema.test.ts`: válidos e inválidos de `stockOverwriteSchema`, con fuzz.
- **Service**: `stock-entry-edit.test.ts` se reescribe contra el fake. Casos:
  - Stock 40 con ventas que lo dejaron en 17: escribe 17 y queda 17 (regresión del caso del cliente).
  - Escribe 0 y queda 0.
  - Sin ingreso: guarda el stock, el costo y el mínimo, y no crea ningún ingreso.
  - El ingreso conserva su cantidad y cambia su costo y su proveedor.
  - P-6: el costo pasa al gusto sólo si es el último ingreso.
  - La familia recibe costo y precio.
  - La base, sin costo.
  - `itemVersion` vieja da `STALE_VERSION`.
  - Ingreso de otro gusto, o proveedor sin ingreso, dan `VALIDATION`.
  - Queda la auditoría con el stock de antes y de después.
- **Contrato y fuzz**: `update-stock-entry.contract.test.ts` → `overwrite-stock.contract.test.ts` (sin sesión, vendedor, entrada inválida, ok).
- **Integración**: `stock.service.int.test.ts`. Ajustar los casos de edición. Nuevo: una venta (`saveItem`) entre la lectura y el guardado da `STALE_VERSION`, y dos ediciones simultáneas dejan una sola ganadora.
- **Componente**:
  - `stock-entry-edit.test.tsx`: label "Stock" precargado con el de la grilla, gusto fijo, sin Proveedor cuando no hay ingreso.
  - `stock-columns.test.tsx`: título "Editar stock".
  - `open-last-entry.test.ts`: sin ingreso abre el formulario, no el Historial.
- **E2E**: `tests/stock-editar.spec.ts` se reescribe.
  1. Ingresa 5 a Bondiola (queda 53).
  2. El lápiz muestra "Stock" = 53.
  3. Escribe 17 y guarda: "Stock actualizado: … queda con 17" y la grilla muestra 17.
  4. Desde el Historial, "Editar ingreso" escribe 20 y queda 20.
  Se borra el caso de pasar a otro gusto.

## Docs y backlog (en el mismo cambio)

- `BACKLOG.md`: "Actualización 9" con US-70, sus CA (uno por línea, con estimación), las notas (nivel 3, sin migración) y T-30 de cierre.
- `docs/plans/actualizacion-9.md`: este plan, con D-1 a D-6.
- `docs/features/stock/README.md`: reescribir la sección "Editar un ingreso (US-46)" a "Editar stock (US-70)", la tabla de errores, la de Server Actions, la auditoría y las pantallas.
- `docs/initial_prompt.md`: agregar el punto de la Actualización 9 y actualizar la línea de US-48.

## Verificación

1. `npm run lint && npm run typecheck`.
2. `npm run test:coverage`.
3. `docker compose up -d --wait db-test` y después `npm run test:int`.
4. `npm run test:e2e -- stock-editar`.
5. `npm run verify`: cobertura ≥ 90/85 y mutación ≥ 70.
6. Prueba manual en `npm run dev` con el preview:
   1. Ingresar 40.
   2. Vender 23 desde `/ventas/nueva`.
   3. El lápiz muestra 17. Escribir 17 y guardar: queda 17.
   4. Escribir 1: queda 1.
   5. Abrir el lápiz en dos pestañas, vender en el medio y guardar: aparece `STALE_VERSION`.

   Al terminar, detener el servidor y borrar `.next`.
7. Antes del commit, mostrarle al dev la lista simple. Con su OK: merge squash a `develop`, push y borrado de la rama.

## Decisiones de la implementación

- **I-1 · Primero se recarga y después se avisa.** El E2E mostró una carrera: "Stock ingresado" aparecía y el modal se
  cerraba antes de que la grilla trajera el stock nuevo. Si el cliente tocaba el lápiz enseguida, veía el stock viejo
  y al guardar recibía `STALE_VERSION`. Ahora `submit` (`ui/use-stock-panel.ts`) recarga los gustos **antes** de
  cerrar el modal y mostrar el aviso, en todos los modales de Stock. Lo cubre `ui/stock-reload.test.tsx`.
- **I-2 · El E2E usa Fanta 1,5 L.** Con Bondiola fallaba por D-6: `stock-precios.spec.ts`, en paralelo, aplica un
  precio a todas las Empanadas y sube su `version`. Fanta 1,5 L no la usa ningún otro spec.
- **I-3 · Precios heredados de la familia.** Sin ingreso, un sabor de bebida sin precio propio toma el de su familia,
  igual que en "Ingresar stock" (`inheritedPrices`).

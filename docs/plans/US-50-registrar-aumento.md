# Plan: US-50 — Stock: "Registrar aumento" por porcentaje

- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-31 · **Estado**: aprobado por el dev (2026-10-31)
- **Nivel de tests**: 3

## Context
El cliente quiere aumentar de una vez el costo y el precio de venta de una categoría entera. Hoy tiene que entrar a
"Costo y precio" producto por producto. Se pide un botón "Registrar aumento", arriba de "Ingresar stock", que abre
un formulario con estos pasos:
1. Categoría.
2. La lista de sus productos, todos tildados. Se destildan los que no aumentan.
3. Dos porcentajes: el del costo para el local y el del precio de venta.

**Respuestas del dev (2026-10-31)**:
- Sin redondeo: se guarda al centavo. Por ejemplo, $2.750 + 10 % = $3.025.
- Uno de los dos porcentajes puede quedar vacío, pero tiene que haber al menos uno. Sólo aumentos (> 0).
- En Coca-Cola y Quilmes, una fila por familia: "Aquarius 1.5 L (5 sabores)" aumenta todos sus sabores juntos.
- US-49 se sube primero a `develop`.

No hay migración: la base no cambia. Sólo se actualizan `unit_cost` y `price_*` de `menu_items`, con versión.

## Paso 0 · US-49 a develop
Commit en `feat/us-49-bebidas-por-litros`, `git merge --squash` a `develop`, push y borrado de la rama. `main` espera a
que Supabase esté en 27.

## Cambios (rama `feat/us-50-registrar-aumento`)
1. **Domain** (`src/features/stock/domain/stock-increase.ts`, nuevo):
   - `priceIncreaseSchema` (`strictObject`): `menuItemIds` (uuid, de 1 a 200), `costPercent` y `pricePercent`
     (nullable, > 0 y hasta 500, con hasta 2 decimales), con un refine que pide al menos uno.
   - `increased(value, percent)`: `round2(value * (1 + percent / 100))`. Reusa `round2` de
     `features/order/domain/order-pricing.ts`.
2. **Service** (`src/features/stock/services/stock-increase.ts`, nuevo):
   - Bloquea los productos ordenados por id, con `lockItem` y `lockedItem` de `stock-locks.ts`.
   - A cada bebida le suma su familia, con `familyOf` de `stock-family.ts`, para que el precio compartido no se rompa.
   - Calcula el costo y los precios nuevos de lo que no es nulo y guarda con `saveItem`, que filtra por versión.
   - Audita `ACTUALIZAR` / `MENU_ITEM` por producto, con `name`, costo y precios antes y después, y los porcentajes.
   - Lo expone `stockService.applyIncrease`.
3. **Action** (`src/features/stock/actions/apply-price-increase.ts`, nueva): sólo admin; valida con el schema y
   devuelve `{ updated }` con el mensaje "Aumento aplicado a N productos". Llama a `afterCatalogChange`.
4. **UI**:
   - `StockIncreaseModal` (nuevo): Categoría (todas menos Prepizza y Pan de ciabatta, que no tienen precio), los
     productos activos con un tilde cada uno, todos prendidos, y en bebidas una fila por familia.
   - Abajo, "Aumento del costo (%)" y "Aumento del precio de venta (%)", y el botón "Aplicar aumento".
   - `stock-panel.tsx`: botón "Registrar aumento" arriba de "Ingresar stock", sólo para el admin.
   - `use-stock-panel.ts` suma `submitIncrease`, y los fixtures del modelo en los tests suman el campo.

## Errores
| Acción inválida | code | Mensaje |
|---|---|---|
| Ningún producto tildado, sin porcentajes, porcentaje ≤ 0 o > 500 | `VALIDATION` | El del campo (Zod) |
| El vendedor | `FORBIDDEN` | El de siempre |
| Un producto que ya no existe | `NOT_FOUND` | El producto ya no existe. |

## Tests (nivel 3: cruza capas y toca precios)
- Domain: el schema (válidos, inválidos con el mensaje exacto y fuzz) y `increased` ($2.750 + 10 % = $3.025).
- Service (fake): aumenta sólo lo tildado; costo o precio nulos quedan nulos; una bebida arrastra su familia; audita.
- Contrato: admin, `FORBIDDEN`, `VALIDATION` y fuzz. Integración contra `db-test`: un aumento real.
- Componente: todos tildados al elegir la categoría, destildar uno, la fila de familia y lo que se manda.
- E2E: se crea una bebida nueva, se registra un aumento sólo para ella (destildando el resto) y se ve el precio
  nuevo. No toca los precios que usan los otros E2E.
- `npm run verify` completo.

## Decisiones provisorias del agente (aprobadas con el plan)
- **P-1**: el tope es 500 % por porcentaje, para atajar un error de tipeo ("1000" en lugar de "10").
- **P-2**: entran sólo los productos activos, y los que no tienen costo o precio cargado no cambian en ese campo.

## Docs
Plan en `docs/plans/US-50-registrar-aumento.md`, US-50 en `BACKLOG.md` y la regla en `docs/features/stock/README.md`.

## Decisiones durante la implementación

- **I-1 · Estilo del botón**: "Registrar aumento" usa la variante `secondary` (borde, sin relleno), así "Ingresar
  stock" sigue siendo el botón principal. De dónde sale: el pedido no fija el estilo.
- **I-2 · El E2E crea su propia bebida**: destilda el resto de Quilmes y aumenta sólo la suya, para no tocar los
  precios que miran los otros E2E.

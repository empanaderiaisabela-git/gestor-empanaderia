# Plan: US-49 — Bebidas con bebida, litros y sabor

- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-31 · **Estado**: aprobado por el dev (2026-10-31), con P-2 corregida
- **Nivel de tests**: 3 (schema, migración y cambio que cruza capas)

## Objetivo

Hoy cada bebida de Coca-Cola y Quilmes es un producto con todo en el nombre ("Aquarius 1.5 L Manzana"), y cada una
pide su costo, precio de venta y proveedor. El cliente quiere cargar **Bebida**, **Litros** y **Sabor** por separado.
Todos los sabores de una misma bebida y litros (la **familia**: Coca-Cola · Aquarius · 1.5 L) comparten costo,
precio y proveedor. Así, sólo el primer sabor que entra pide todo, y los demás sólo su cantidad. Funciona como el
precio por grupo de las empanadas, pero por familia.

## Descubrimiento (respuestas)

Pedido del cliente vía el dev (2026-10-31) y respuestas del dev a cuatro preguntas:

| Pregunta | Respuesta |
|---|---|
| ¿Dónde se crea cada sabor? | En Alta de productos, como hoy: Categoría, Bebida, Litros y Sabor. En Stock sólo se eligen. |
| ¿El sabor es obligatorio? | No. Una bebida sin variantes queda "Coca-Cola 1.5 L". |
| Si cambia el costo o el precio de un sabor, ¿cambian los demás? | Sí, cambia toda la familia. |
| ¿Qué pasa con las bebidas ya cargadas en producción? | Siguen andando como hoy. "Editar" en Alta les completa Bebida, Litros y Sabor una por una. Ninguna migración toca datos. |

- Roles: sólo el admin da de alta, ingresa stock y cambia precios, como hoy. El vendedor no cambia.
- Lo que cambia es sólo de Coca-Cola y Quilmes (claves `coca_cola` y `pepsi`). Las comidas quedan igual.

## Cambios por capa

1. **Domain** (`src/features/menu/domain/drink.ts`, nuevo):
   - `DRINK_GROUPS`, `drinkNameOf({ drinkName, liters, flavor })` (arma "Aquarius 1.5 L Manzana") y
     `sameFamily(a, b)`: mismo grupo, bebida y litros.
   - En `menu-item.schema.ts`, el alta y la edición de una bebida reciben `{ drinkName, liters, flavor? }` en lugar de
     `name`. Bebida y Sabor: hasta 25 caracteres. Litros: mayor a 0 y hasta 10, con hasta 3 decimales; se escribe con
     punto o coma y se guarda y muestra con punto (P-2).
   - `menuItemRowSchema` suma `drinkName`, `liters` y `flavor`.
2. **Schema y migración 0026** (`menu-schema.ts`), sólo aditiva:
   - `menu_items` suma `drink_name varchar(25)`, `liters numeric(6,3)` y `flavor varchar(25)`, todas nullable.
   - Un check sólo sobre las columnas nuevas: las tres van nulas, o el grupo es de bebidas, bebida y litros no son
     nulos, y litros > 0.
   - `name` se sigue guardando, armado por el servidor: el catálogo, Ventas, el comprobante y el control de
     duplicados (`menu_items_group_name_unique`) no cambian.
3. **Repository**:
   - `menu-item.repository.ts`: guarda los campos nuevos.
   - `stock.repository.ts`: `lockFamily(item)` bloquea los sabores de la familia ordenados por id, como `lockGroup`, y
     `lastProviderOf(ids)` devuelve el proveedor del ingreso más reciente de esos sabores. El fake y la suite de
     comportamiento suman lo mismo.
4. **Services**:
   - `menu-item.service.ts`: alta y edición arman `name`. Un sabor que entra a una familia con precio toma el costo y
     los precios de esa familia (P-1).
   - `stock-entry-plan.ts` y `stock.service.ts`: un sabor sin costo o precio propio toma los de su familia, así que no
     da `MISSING_COST` ni `MISSING_PRICE` si la familia los tiene. Un ingreso que trae costo o precios se los guarda a
     toda la familia.
   - `stock-pricing.ts`: "Costo y precio" de una bebida con familia se aplica siempre a toda la familia.
   - `stock-entry-edit.ts`: si el costo pasa al gusto, pasa a la familia.
5. **Actions**:
   - `create-menu-item` y `update-menu-item` aceptan el esquema nuevo.
   - `fetchLastProvider(menuItemId)` (nueva, sólo admin) devuelve el último proveedor de la familia, para precargarlo.
6. **UI**:
   - Alta (`menu-item-fields.tsx`): con Coca-Cola o Quilmes pide Bebida (con sugerencias de las ya cargadas), Litros
     y Sabor (opcional), en lugar del nombre.
   - Stock, "Ingresar stock" con categoría de bebida: los selects Bebida → Litros → Sabor reemplazan "Gusto o
     bebida". Una bebida vieja sin completar aparece en Bebida con su nombre, sin litros ni sabor. Al elegir un sabor
     de una familia con precio, costo y precios vienen precargados y el proveedor es el último de la familia: sólo
     falta la cantidad.
   - "Costo y precio" de una bebida con familia no muestra "Aplicar a todos": siempre es toda la familia, y lo dice
     "Se aplica a los N sabores".

## Restricciones de base de datos

Migración 0026 aditiva: tres `ADD COLUMN` nullable y un `ADD CONSTRAINT` sobre columnas nuevas. Pasa
`additive-migrations.test.ts` y tiene su test de integración con filas del formato de hoy, como
`stock-minimo.migration.int.test.ts`. Supabase pasa de 26 a **27**. La migra el dev antes de desplegar.

## Errores

| Acción inválida | code | Mensaje |
|---|---|---|
| Bebida o litros vacíos, litros ≤ 0 o > 10, textos largos | `VALIDATION` | Mensaje del campo (Zod) |
| Bebida, litros y sabor repetidos en el grupo | `DUPLICATE` | El mismo de hoy |
| Primer sabor de una familia sin costo o sin precio | `MISSING_COST` / `MISSING_PRICE` | Los de hoy |
| Otro cambió la familia mientras se guardaba | `STALE_VERSION` | El de hoy |

## Tests

- Domain: `drinkNameOf`, `sameFamily` y los schemas nuevos (válidos, inválidos con el mensaje exacto y fuzz).
- Migración 0026: test de integración. `additive-migrations.test.ts` la cubre sola.
- Repository: `lockFamily` y `lastProviderOf` en la suite de comportamiento (fake y Drizzle).
- Service: el primer sabor pide todo; el segundo sólo la cantidad y queda con el precio de la familia; "Costo y
  precio" cambia los 5 sabores; un sabor viejo que se completa en Alta toma el precio de su familia.
- Actions: contrato y fuzz del alta de bebida y de `fetchLastProvider`.
- UI: Alta con los campos de bebida; Stock con Bebida → Litros → Sabor y lo precargado.
- E2E: alta de Aquarius 1.5 L Manzana y Pera. Se ingresa Manzana con costo, precio y proveedor, y Pera sólo con la
  cantidad. Las dos quedan con el mismo precio.
- `npm run verify` completo y los E2E (ya no corren en el CI).

## Riesgos y decisiones

Decisiones provisorias del agente, confirmadas por el dev al aprobar el plan (2026-10-31):

- **P-1 · Un sabor que entra a una familia con precio**: el sabor nuevo, o uno viejo que se completa en Alta, toma el
  costo y los precios de la familia, aunque tuviera otros. Si la familia todavía no tiene precio, conserva el suyo.
- **P-2 · Litros** (corregida por el dev): se escriben con punto o coma, y los dos quedan como punto decimal. Se
  muestran con punto: "1.5 L". Lo que viene en mililitros se carga en litros: 500 ml es "0.5 L".
- **P-3 · Stock mínimo**: es de cada sabor, no de la familia.
- **P-4 · Proveedor**: se precarga con el del último ingreso de la familia y se puede cambiar. Cada ingreso guarda el
  suyo, como hoy.
- **Riesgo**: Bebida (25) + Litros + Sabor (25) tiene que entrar en los 60 caracteres de `name`. Con esos topes
  entra siempre.
- Lo que no cambia: Ventas, promos, el comprobante, Estadísticas y el catálogo leen `name`, `price1` y el stock como
  hoy.

**Estimación**: unas 8 h, con la revisión del dev.

## Decisiones durante la implementación

- **I-1 · Proveedor de la familia sin acción nueva**: el plan proponía `fetchLastProvider`. Se reusó
  `fetchStockEntries` desde la pantalla, con un pedido por sabor de la familia (`use-family-provider.ts`), porque las
  familias tienen pocos sabores. De dónde sale: menos código para lo mismo (P-4).
- **I-2 · Costo y precio precargados como valores**: en las bebidas, al elegir un sabor, costo y precio aparecen
  escritos (no en gris), también en una bebida vieja que ya tenía precio. De dónde sale: CA-3 ("los siguientes los
  traen precargados y sólo piden la cantidad").
- **I-3 · El seed queda con bebidas viejas**: las bebidas de los datos de prueba siguen con el nombre suelto. Así
  los E2E prueban también el camino de las bebidas cargadas antes de US-49. De dónde sale: respuesta 4 del dev
  (las existentes siguen andando).
- **I-4 · Editar un ingreso de bebida**: si se cambia el sabor, el costo del ingreso se conserva y los precios pasan a
  los del sabor nuevo. De dónde sale: I-9 de `sprint-6.md` y CA-4.

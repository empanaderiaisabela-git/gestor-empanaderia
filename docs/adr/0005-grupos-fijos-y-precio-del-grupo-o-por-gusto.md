# 0005 — Grupos y presentaciones fijos; precio del grupo o por gusto

- **Estado**: Aceptado (2026-10-25); reemplazado en parte por US-28 (2026-10-28): el precio es por gusto en todos los grupos y `menu_group_prices` ya no existe

## Contexto

El local vende seis grupos: Empanadas, Pizzas, Sanguches, Ciabattas, Coca-Cola y Pepsi. Cada grupo tiene reglas
propias de venta:

- Empanadas y Sanguches se venden de a 1, 3, 6 o 12, con surtidas.
- La pizza puede ser de 1 o 2 sabores, al precio del más caro.
- Las bebidas se venden por unidad.

El cliente aclaró los precios (`specs.md`):

- las empanadas valen lo mismo en todos los gustos;
- las ciabattas también;
- los sanguches y las pizzas tienen precio por gusto.

El modelo heredado (`devices` + `products`) no tiene ni grupos, ni gustos, ni presentaciones.

> **Reemplazado en parte (US-28, 2026-10-28).** Los grupos y presentaciones fijos siguen vigentes. Dejó de valer "dos fuentes de
> precio": Empanadas y Ciabattas también guardan sus precios en el gusto, y la migración `0020_precios-por-gusto` copió
> el precio de cada grupo a sus gustos y borró `menu_group_prices`. El texto de abajo es el histórico.

## Decisión

- **Los grupos y sus presentaciones son una constante del dominio** (`menu-groups.ts`), no datos editables, porque
  el POS tiene una regla distinta para cada grupo. En la base, el grupo es un enum (`menu_group`).
- **Dos fuentes de precio**:
  - Empanadas y Ciabattas guardan sus precios en `menu_group_prices`, una fila por grupo.
  - Sanguches, Pizzas y bebidas guardan los suyos en columnas del gusto (`price_1`, `price_3`, `price_6` y
    `price_12`).
- **Precios como columnas y no en una tabla aparte**: así un `CHECK` por grupo garantiza en Postgres qué
  presentaciones lleva cada gusto. Con una tabla de precios hacía falta un trigger.
- El modelo nuevo vive **en tablas nuevas, en paralelo al heredado**, hasta que T-12 borre `devices` y `products`.

## Alternativas descartadas

- **Precio por gusto para todos los grupos**: obligaba a cargar 15 veces el mismo precio de empanada, y nada impedía
  que dos gustos quedaran con precios distintos sin querer.
- **Grupos editables desde la UI**: las reglas del POS dependen del grupo, así que un grupo nuevo no sabría cómo
  venderse.
- **Migrar `products` en el lugar**: rompía en un solo ítem el POS, el stock, las estadísticas y el catálogo.

## Consecuencias

- Sumar un grupo o una presentación es un ítem de código (constante, enum y `CHECK`), no una carga de datos.
- Si el cliente pasa un grupo de precio único a precio por gusto (o al revés), es una migración.
- El precio de una surtida (US-5) se calcula con los precios de cada gusto; en Empanadas da siempre el precio del
  grupo.

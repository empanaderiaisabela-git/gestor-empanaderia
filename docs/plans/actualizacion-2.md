# Plan maestro: Actualización 2 · Precio de venta en el Stock del vendedor

- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-11-04 · **Estado**: aprobado por el dev (2026-11-04)
- **Ítems**: US-63, más BUG-31 (arreglado en `develop` el 2026-11-03, que llega a `main` con esta Actualización).

## Contexto

Pedido del dev (2026-11-04): en la grilla de Stock **del vendedor**, y sólo ahí, sumar la columna con el precio de
venta del producto, con el mismo título que ve el admin ("Precio de venta"). Nada más.

El dev pidió hacer todo el proceso sin frenar: se aprueba el cambio, se integra a `develop` y se sube a `main` con el
tag `actualizacion-2`.

## Enfoque

- `getStockViewColumns` (`src/features/stock/ui/stock-columns.tsx`), las columnas que ve el vendedor, suma la columna
  "Precio de venta" que ya tenía el admin, con la misma celda (`PriceCell`). El admin la sigue viendo en el mismo
  lugar, porque sus columnas arrancan con las del vendedor.
- No hace falta tocar el servidor: `fetchMenuItems` ya le manda al vendedor los precios; sólo le oculta el costo.
- Nivel de tests 1 (sólo cambia qué columnas se ven): lint, typecheck, los tests relacionados y los E2E de
  navegación y Stock.
- Las tarjetas de Stock en el celular no cambian: tampoco le muestran el precio al admin.

## Resumen para el dev

### US-63 · Precio de venta en el Stock del vendedor

- Qué es: el vendedor, en Stock, ve una columna más, "Precio de venta", con los precios de cada presentación
  ("1 unidad: $3.000", "½ docena: $15.000"), igual que el admin.
- Por qué importa: el vendedor puede consultar el precio sin pedírselo al admin.
- Adónde va: `develop` y `main` (tag `actualizacion-2`). Sigue sin ver costos ni botones.
- Qué no entra: las tarjetas del celular, que no muestran precios para nadie.

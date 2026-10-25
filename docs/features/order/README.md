# Feature: pedido (tablero de ventas)

- **US relacionadas**: US-5 (tablero y pedido actual). US-6 (cobro) y US-7 (historial) lo extienden.
- **Código**: `src/features/order/` (domain, store, ui, testing). Pantalla en `src/app/(main)/ventas/nueva/`.
- **Datos que usa**: gustos, bebidas, precios del grupo y stock del feature `menu` (`fetchMenuItems`,
  `fetchMenuGroupPrices`).

## Qué hace

El vendedor arma el pedido en un tablero con una subdivisión por grupo (Empanadas, Pizzas, Sanguches, Ciabattas,
Coca-Cola y Pepsi). Cada subdivisión tiene un botón por presentación. Al tocarlo se abre la lista de gustos:

- **Empanadas y Sanguches** (1, 3, 6 y 12): cada gusto tiene **"Agregar uno"** (+1 de ese gusto) y
  **"Completar"** (llena lo que falta con ese gusto). Así se arman las surtidas dentro de la misma presentación.
- **Pizzas**: "1 sabor" pide un gusto; "2 sabores" pide dos gustos distintos (mitad y mitad).
- **Ciabattas y bebidas**: "Agregar" suma una unidad.

La lista queda abierta para seguir cargando hasta tocar "Listo". El "Pedido actual" muestra comida, cantidad,
unidades e importe, el total y el comprador (opcional; vacío = "Sin nombre"). Una línea a medio armar muestra
"faltan N" y no deja cobrar.

## Reglas de negocio

| Regla | Fuente |
|---|---|
| En una presentación de más de 1 unidad, un gusto con "Completar" se carga para toda la cantidad que falta | `specs.md` (EMPANADAS, SANDWICH y AGREGADO) |
| Surtidas con "Agregar uno" y "Completar" dentro de la misma presentación | `specs.md` (AGREGADO) |
| Precio de Empanadas y Ciabattas: el del grupo para esa presentación, sea cual sea el gusto | `specs.md` (Aclaración de precios) |
| Precio de una surtida de Sanguches: Σ (unidades del gusto ÷ unidades de la presentación × precio de esa presentación del gusto), redondeado a 2 decimales | dev, 2026-10-25 |
| Pizza de 2 sabores: el precio del sabor más caro; consume ½ de cada gusto | `specs.md` y dev |
| Costo de una mitad y mitad: ½ del costo de cada gusto | dev, 2026-10-25 |
| No se ofrece un gusto si no alcanza el stock, contando lo que ya está en el pedido | US-5 CA-5 |
| Una línea incompleta bloquea el cobro | dev, 2026-10-25 |
| Dos líneas iguales y completas se juntan con cantidad 2 | US-5 |

Las reglas son funciones puras de `domain/`:

- `order-line.ts`: `addFlavor`, `isComplete`, `remaining` y `mergeLine`.
- `order-pricing.ts`: `unitLinePrice`, `linePrice` y `orderTotal`.
- `order-usage.ts`: consumo de stock, stock disponible y `lineCost`.
- `order-describe.ts`: textos del pedido.

Corren en el navegador y el servidor las reutiliza al cobrar (US-6).

## Roles y permisos

| Acción | admin | vendedor |
|---|---|---|
| Usar el tablero (`/ventas/nueva`) | Sí | Sí |

## Pantallas

`src/app/(main)/ventas/nueva/page.tsx` → `OrderBoard`:

- `GroupCard` por grupo, con ícono, "N en pedido" y botones de presentación con el precio (del grupo) o "desde $X".
  Avisa si el grupo no tiene gustos o si falta el precio del grupo, y deshabilita los botones.
- `FlavorPicker` / `FlavorRow`: gustos con precio y stock disponible, y los botones según la presentación.
- `CurrentOrder` / `OrderTable`: el pedido, con el total, Vaciar y Cobrar (el cobro llega con US-6).

En US-5 se entra desde "Tablero de ventas", en la lista de Ventas. "Nueva Venta" sigue abriendo el POS viejo hasta
que US-6 lo reemplace por el tablero.

## Tests

- Unit y fuzz: `domain/*.test.ts` (la suma de unidades nunca supera la presentación; con precios iguales, la surtida
  cuesta lo mismo que la entera) y `store/order.store.test.ts`.
- Componente: `ui/*.test.tsx` (tarjeta de grupo, lista de gustos, pedido actual y tablero).
- E2E: `tests/tablero-ventas.spec.ts`.

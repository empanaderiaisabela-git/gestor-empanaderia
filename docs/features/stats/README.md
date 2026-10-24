# Feature: estadísticas del dashboard

- **US relacionadas**: ninguna todavía. Lo tocó BUG-5 (consultas en paralelo).
- **Código**: `src/features/stats/`:
  - `domain/stats.schema.ts`: tipos del rango, la foto de datos y los totales.
  - `repository/stats.repository.ts`: `getDashboardSnapshot`.
  - `services/compute-dashboard-stats.ts`: cálculo puro y rango de fechas.
  - `services/dashboard-stats.service.ts`: `getDashboardStats`.
  - `actions/stats.actions.ts`: `fetchDashboardStats`.
  - `store/stats.store.ts`: caché en Zustand.
- **Pantalla**: `src/app/(main)/page.tsx`.

## Qué hace

Muestra los números del negocio para un rango de fechas: unidades en stock, cantidad de productos, valor del
inventario a precio de compra, ingresos, costo de lo vendido, mermas, ganancia neta, lo cobrado en efectivo y por
transferencia, y los 5 vendedores que más vendieron.

## Reglas de negocio

- **Inventario** (no depende del rango):
  - Unidades = suma del stock.
  - Productos = cantidad de productos.
  - Valor = Σ precio de compra × stock.
- **Ventas y mermas del rango**:
  - Ganancia neta = ingresos − costo de lo vendido − costo de las mermas.
  - El costo de lo vendido usa el costo unitario congelado al momento de la venta (`sale_items.unit_cost`).
  - Una merma vale precio de compra actual × cantidad. Si el producto ya no existe, no suma.
- **Vendedores**:
  - Se agrupan por vendedor y se muestran los 5 con más ventas en pesos.
  - Una venta sin vendedor figura como "Sistema".
- **Rango**: sin fechas, va desde el comienzo hasta ahora. Con fechas, va desde las 00:00:00 del primer día hasta las
  23:59:59 del último, **en la hora local del servidor** (brecha de fechas conocida, ver `docs/architecture.md`).
- **Consistencia**: las tres consultas corren de a una, en una transacción `repeatable read` de sólo lectura. Así ven
  la misma foto de la base y no se lanzan consultas simultáneas sobre la misma conexión (BUG-5).

## Roles y permisos

| Acción | admin | vendedor | público (sin sesión) |
|---|---|---|---|
| Ver el dashboard (`/`) | Sí | No: `proxy.ts` lo redirige a `/productos` | No |
| Invocar `fetchDashboardStats` | Sí | **Sí** (BUG-12, pendiente: falta que el cliente decida) | No |

## Server Actions

| Action | Acceso | Entrada | Respuesta |
|---|---|---|---|
| `fetchDashboardStats(startDate?, endDate?)` | `verifyAuthOrAdmin(false)`: cualquier usuario activo | Fechas `AAAA-MM-DD` opcionales | `{ success: true, data: DashboardStats }` o `{ success: false, message }` (todavía no es `ActionResult`, BUG-12) |

## Datos

Sólo lectura de `products` (stock, precio de compra), `sales` (total y vendedor), `sale_items` (costo unitario y
cantidad), `sale_payments` (tipo y monto), `product_losses` (cantidad) y `users` (sólo `username` del vendedor).

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Sin sesión, sesión inválida o cualquier falla | — (sin catálogo todavía) | Error al obtener estadísticas | Pendiente (BUG-12, con `asUser` de T-4) |

## Pantallas

`src/app/(main)/page.tsx`: filtros de fecha y tarjetas de totales.

## Tests

- `services/compute-dashboard-stats.test.ts` (unit): totales, mermas sin producto, cobros por tipo, ranking de
  vendedores, "Sistema" y rango de fechas.
- `repository/stats.repository.int.test.ts` (integración contra `db-test`):
  - `regression BUG-5`: sin el aviso de consultas simultáneas de `pg`.
  - La foto del rango.
  - Los totales calculados sobre datos sembrados (BUG-5 CA-2).

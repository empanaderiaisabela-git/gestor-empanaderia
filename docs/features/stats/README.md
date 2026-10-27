# Feature: estadísticas de la jornada

- **US relacionadas**: US-12 (KPI de la jornada) y US-13 (cuadros de vendedores y de ventas). Antes la tocaron
  BUG-5 (consultas en paralelo), BUG-7 (sin `password_hash`) y BUG-12 (sólo admin).
- **Código**: `src/features/stats/`:
  - `domain/workday.ts`: la jornada de una fecha, la fecha de una jornada y su schema.
  - `domain/stats.schema.ts`: tipos del resumen de la jornada y de los KPI.
  - `repository/stats.repository.ts`: `getWorkdaySnapshot`.
  - `services/compute-workday-stats.ts`: cálculo puro de los KPI; `workday-stats.service.ts`: `getWorkdayStats`.
  - `actions/fetch-workday-stats.ts`: `fetchWorkdayStats`.
  - `store/stats.store.ts`: caché en Zustand.
  - `ui/`: `StatsPanel`, los cuadros (`workday-kpis.tsx`, `kpi-card.tsx`) y `use-workday-stats.ts`.
- **Pantalla**: `src/app/(main)/page.tsx` ("Estadísticas", la primera del menú del admin).

## Qué hace

Muestra los números de una **jornada** del local, por defecto la de hoy, con un selector para elegir otra:

- **Ganancia en limpio**: lo facturado menos el costo para el local de lo vendido y las mermas de la jornada.
- **Ventas registradas**: cuántas ventas hubo.
- **Total facturado**: lo que pagaron los clientes, con el recargo de las cuotas.
- **Dinero generado por comida**: Empanadas, Pizzas, Sanguches, Ciabattas, Coca-Cola y Pepsi, cada cuadro con el color
  y el emoji de su grupo (US-15), y un cuadro aparte para las **Promos**.
- **Facturado por medio de pago**: Efectivo, Transferencia, Débito y Crédito.
- Abajo del todo (US-13), dos cuadros:
  - **Vendedores**: vendedor, turno, número de ventas e importe, de a una fila por vendedor y turno;
  - **Ventas**: comprador ("Sin nombre" si no hay), hora en Argentina e importe, ordenadas por hora.

Se quitaron los KPI heredados que el cliente no nombró: valor del stock, unidades, pérdidas, órdenes procesadas y
mejores vendedores (cliente, 2026-10-25).

## Reglas de negocio

- **Jornada**: de 7:00 a 6:59 del día siguiente, en hora de Argentina (UTC−3, sin horario de verano). Una venta de la
  0:30 cuenta para la jornada que empezó a las 7 (dev, 2026-10-25).
- **Dinero por comida**: cada línea suma en su grupo. El descuento de la venta se reparte entre las comidas en
  proporción a lo que pesa cada una (dev, 2026-10-25): la suma de los cuadros es lo cobrado por los productos. Las
  líneas de promo van al cuadro Promos. El recargo de las cuotas no es de ninguna comida.
- **Ganancia en limpio** = total facturado (con recargo) − Σ unidades × costo congelado (también lo que usó cada
  promo) − Σ mermas de la jornada × su costo. Ejemplo del cliente: comprada a $10 y vendida a $30 ⇒ $20.
- **Por medio de pago**: cada pago suma su monto y, en crédito, su recargo.
- **Turno** (`domain/shift.ts`): mañana de 7:00 a 16:59 y tarde de 17:00 a 6:59, en hora de Argentina (cliente,
  2026-10-25: el local abre de 11 a 16 y de 19 a 1, y el margen cubre lo que se cargue fuera de horario). Una venta
  de la 0:30 es de la tarde de la jornada anterior.
- El importe de cada venta es lo que pagó el cliente, recargo incluido (decisión provisoria D-3).
- Montos redondeados a 2 decimales al final.

## Roles y permisos

| Acción | admin | vendedor | público (sin sesión) |
|---|---|---|---|
| Ver Estadísticas | Sí | No (`FORBIDDEN`; el menú no la muestra y el `proxy` lo redirige) | No (`UNAUTHENTICATED`) |

## Server Actions

| Action | Acceso | Entrada | Respuesta |
|---|---|---|---|
| `fetchWorkdayStats(day?)` | admin | `day` AAAA-MM-DD (`workdaySchema`); sin día, la jornada de hoy | `ActionResult<WorkdayStats>` |

## Datos

Sólo lee, en una transacción `repeatable read` de sólo lectura y con consultas secuenciales (BUG-5): las ventas de la
jornada con su vendedor (sin `password_hash`, BUG-7), sus líneas (grupo y subtotal), lo consumido (`sale_line_items`
con el costo congelado) y los pagos (con el recargo); y las mermas de la jornada.

## Errores

| Situación | code | Mensaje | Test |
|---|---|---|---|
| Sin sesión | `UNAUTHENTICATED` | No autorizado (Token faltante) | `workday-stats.contract.test.ts` |
| El vendedor la pide | `FORBIDDEN` | Solo los administradores pueden realizar esta acción | `workday-stats.contract.test.ts` |
| Jornada inválida | `VALIDATION` | Los datos proporcionados no son válidos. | `workday-stats.contract.test.ts` |
| Falla inesperada | `UNEXPECTED` | Ocurrió un error inesperado al procesar el panel de estadísticas. | `workday-stats.contract.test.ts` |

## Pantallas

`StatsPanel`: selector "Jornada" y "Sincronizar"; los KPI; y al final los cuadros de vendedores y de ventas (con
"Nadie vendió en esta jornada." cuando están vacíos); mientras carga, un esqueleto; si la jornada no tuvo ventas, "No
hubo ventas en esta jornada." con los cuadros en $0; si el servidor falla, el motivo.

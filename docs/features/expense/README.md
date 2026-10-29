# Feature: gastos

- **US relacionadas**: US-14, US-27, US-33.
- **Código**: `src/features/expense/` (domain, repository, services, actions, store, ui), tabla en
  `src/lib/db/expense-schema.ts`, pantalla en `src/app/(main)/gastos/`.

## Qué hace

Un anotador aislado de las facturas de gastos del local: número de factura, título, monto y fecha de la factura. La
fecha de carga y quién lo cargó se guardan solos. **No cambia las Estadísticas** (un test de integración lo
demuestra).

## Reglas de negocio

- Número de factura único, sin distinguir mayúsculas, de hasta 30 caracteres (cliente, 2026-10-25).
- Título de hasta 100 caracteres; monto mayor a 0 con 2 decimales como máximo; fecha de la factura obligatoria, sin
  foto (cliente, 2026-10-25).
- La lista va por fecha de la factura, la más nueva primero, con búsqueda por número o título.
- "Desde" y "Hasta" filtran por fecha de la factura, ambas incluidas, y arrancan en el 1 y el último día del mes en
  curso, en hora de Argentina (US-33, D-13). La X las limpia y muestra todos los gastos. El filtro es del lado del
  cliente: `fetchExpenses` ya trae todos.
- Se edita y se borra con `version`.

## Roles y permisos

| Acción | admin | vendedor | público (sin sesión) |
|---|---|---|---|
| Ver, cargar, editar y borrar gastos | Sí | No (`FORBIDDEN`; la lista vuelve vacía) | No (`UNAUTHENTICATED`) |
| Entrar a `/gastos` | Sí (en el menú, después de Estadísticas) | No (el `proxy` lo manda a Ventas/Pedidos) | No |

## Server Actions

| Action | Acceso | Entrada (schema) | Respuesta |
|---|---|---|---|
| `fetchExpenses()` | admin | — | `ExpenseDef[]` |
| `createExpenseAction(input)` | admin | `expenseCreateSchema` | `ActionResult<ExpenseDef>` |
| `updateExpenseAction(id, input)` | admin | `expenseUpdateSchema` (todo de nuevo + `version`) | `ActionResult<ExpenseDef>` |
| `deleteExpenseAction(input)` | admin | `expenseDeleteSchema` | `ActionResult` |

Cada cambio se audita con la entidad `EXPENSE` ("GASTO" en Auditoría).

## Datos

`expenses`: `invoice_number` (`varchar(30)`, `unique`), `title` (`varchar(100)`), `amount` (`numeric(10,2)`,
`CHECK > 0`), `invoice_date` (`date`, con índice), `user_id` (FK a `users`), `version` y timestamps.

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Sin sesión | `UNAUTHENTICATED` | No autorizado (Token faltante) | `expense-errors.contract.test.ts` |
| Un vendedor carga, edita o borra | `FORBIDDEN` | Solo los administradores pueden realizar esta acción | `expense-errors.contract.test.ts` |
| Número o título vacíos o largos, monto ≤ 0 o con más de 2 decimales, fecha inválida | `VALIDATION` | Los datos proporcionados no son válidos. | `expense-errors.contract.test.ts`, `expense.schema.test.ts` |
| Número de factura repetido | `DUPLICATE` | Ya existe un registro con esos datos (DNI, nombre o código duplicado). | `expense-errors.contract.test.ts` |
| Editar o borrar con una versión vieja | `STALE_VERSION` | Los datos en el servidor han cambiado. Por favor, sincroniza la lista e intenta nuevamente. | `expense-errors.contract.test.ts` |

## Pantallas

`ExpensesPanel`: búsqueda por número o título, "Desde" y "Hasta" (`DateRangePicker`), sincronizar y "Nuevo gasto"; grilla con fecha de la factura, número,
título, monto y acciones (editar, borrar); en mobile, tarjetas. El formulario (`ExpenseFormModal`) pide número,
título, monto y fecha de la factura (por defecto, hoy).

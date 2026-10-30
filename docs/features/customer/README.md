# Feature: Clientes

Feature heredado: el repositorio (`customer.repository.ts`), las acciones y la tarjeta todavía siguen el molde viejo
y están en `eslint-legacy.json`. Pasarlo al molde de Proveedores es un ítem aparte.

## Qué hace

- Alta, edición, activación y desactivación, borrado y listado de los clientes del local.
- Desde el Sprint 5 (US-37), además, la venta da de alta sola a los clientes nuevos.

## Reglas de negocio

- Sólo el nombre es obligatorio, de 2 a 100 caracteres (US-26).
- El teléfono (hasta 30, sólo números, +, - y espacios), el correo, el DNI y el domicilio (hasta 150, US-37) son
  opcionales.
- Un DNI repetido entre clientes activos da `DUPLICATE`. Si es de un cliente inactivo, se reactiva con los datos
  nuevos.
- No se puede borrar un cliente que tiene ventas: se lo desactiva.

### El cliente en la venta (US-37)

El carrito de Ventas pide el nombre del cliente (obligatorio), el teléfono y el domicilio (opcionales):

- Mientras el vendedor escribe el nombre o el teléfono aparecen hasta 5 clientes activos que coinciden, sin importar
  mayúsculas ni acentos (`domain/customer-search.ts`). Al elegir uno se completan sus datos y queda vinculado.
- Si se cambia el teléfono o el domicilio de un cliente elegido, Clientes no cambia: la venta guarda los datos tal
  como se anotaron (`sales.buyer_phone`, `sales.buyer_address`).
- Si se cambia el nombre, deja de ser ese cliente y se cobra como uno nuevo.
- Sin un cliente elegido, el cobro crea el cliente en la misma transacción, con su log "CREAR CUSTOMER". Si la venta
  falla, no queda el cliente.

## Roles y permisos

| Acción | Admin | Vendedor | Sin sesión |
|---|---|---|---|
| Listar (`fetchCustomers`) | Sí | Sí | Lista vacía |
| Crear y editar | Sí | Sí | `UNAUTHENTICATED` |
| Activar o desactivar, borrar | Sí | `FORBIDDEN` | `UNAUTHENTICATED` |
| Alta automática al cobrar | Sí | Sí | `UNAUTHENTICATED` |

## Errores

| Acción inválida | Código | Mensaje |
|---|---|---|
| Nombre vacío o de 1 letra | `VALIDATION` | "El nombre debe tener al menos 2 caracteres" |
| Cobrar sin nombre del cliente | `VALIDATION` | "Anotá el nombre del cliente" |
| Teléfono con letras | `VALIDATION` | "Formato de teléfono inválido (solo números, +, - y espacios)" |
| Domicilio de más de 150 | `VALIDATION` | "Domicilio demasiado largo" |
| DNI repetido | `DUPLICATE` | El de `MESSAGES.ERROR.DATABASE.UNIQUE_VIOLATION` |
| Cobrar con un cliente desactivado o borrado | `NOT_FOUND` | "El cliente ya no existe." |

## Tests

- `domain/customer-search.test.ts`: sugerencias, con fuzz.
- `order/domain/checkout.schema.test.ts`: los datos del cliente en el cobro.
- `order/services/checkout-customer.test.ts` y `checkout-customer.int.test.ts`: alta, vínculo, `NOT_FOUND` y
  rollback.
- `order/ui/customer-fields.test.tsx`: sugerencias y vínculo en el carrito.
- E2E `tests/cliente-en-venta.spec.ts` y `tests/clientes.spec.ts`.

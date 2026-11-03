# Feature: envíos

- **US relacionadas**: US-58 (alta, edición y baja de envíos); US-59 los suma a un pedido en el carrito.
- **Código**: `src/features/shipping/` (domain, repository, services, actions, store, ui), tabla en
  `src/lib/db/shipping-schema.ts` y columnas `shipping_*` de `sales` en `src/lib/db/schema.ts`, pantalla en
  `src/app/(main)/envios/`.

## Qué hace

El admin da de alta los envíos que hace el local: un **título** ("Centro"), un **detalle** con el alcance ("Barrio A
hasta Barrio B") y el **monto** que se suma al pedido. Un envío guardado queda **activo** y aparece en el desplegable
"Envío" del carrito (US-59). Se desactiva para que deje de aparecer, y se reactiva cuando se quiera.

## Reglas de negocio

- Título obligatorio y único, sin distinguir mayúsculas, de hasta 60 caracteres. También cuenta el título de un envío
  desactivado (fuente: dev, D-6 de `docs/plans/actualizacion-1.md`).
- Detalle opcional, texto libre de hasta 150 caracteres (fuente: cliente y D-6).
- Monto de $0 o más, con 2 decimales como máximo: un envío puede ser gratis (fuente: dev, D-6).
- Se borra sólo si nunca se usó en una venta; si no, devuelve `HAS_RELATIONS` y hay que desactivarlo (fuente: dev,
  D-5). Lo controla el service y lo garantiza la FK de `sales.shipping_option_id`.
- Cambiar el monto o el título no cambia las ventas ya hechas: cada venta guarda el título y el monto del momento
  (US-59).

## Roles y permisos

| Acción | admin | vendedor | público (sin sesión) |
|---|---|---|---|
| Listar los envíos | Sí | Sí (los elige en el carrito) | No (lista vacía) |
| Ver la pantalla Envíos | Sí | No: el menú no la muestra y `/envios` lo lleva a `/ventas` | No |
| Crear, editar, activar, desactivar y borrar | Sí | No (`FORBIDDEN`) | No (`UNAUTHENTICATED`) |

## Server Actions

| Action | Acceso | Entrada (schema) | Respuesta |
|---|---|---|---|
| `fetchShippingOptions` | admin y vendedor | — | `ShippingDef[]` (vacía sin sesión) |
| `createShippingAction` | admin | `shippingCreateSchema` | `ActionResult<ShippingDef>` |
| `updateShippingAction` | admin | id + `shippingUpdateSchema` | `ActionResult<ShippingDef>` |
| `toggleShippingActiveAction` | admin | `shippingToggleSchema` | `ActionResult` |
| `deleteShippingAction` | admin | `shippingDeleteSchema` | `ActionResult` |

## Datos

`shipping_options` (migración 0032): `title varchar(60)` único, `detail varchar(150)` con `''` por defecto,
`amount numeric(10,2)` con `check amount >= 0`, `is_active` y `version` (concurrencia optimista: editar, activar y
borrar filtran por `id` y `version`). Toda mutación queda en `audit_logs` con la entidad `SHIPPING` ("ENVÍO").

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Título vacío / de más de 60 | `VALIDATION` | En el formulario: "El título es obligatorio" / "El título no puede superar los 60 caracteres"; del servidor, el de datos inválidos | `shipping.schema.test.ts`, `shipping-errors.contract.test.ts` |
| Detalle de más de 150 | `VALIDATION` | "El detalle no puede superar los 150 caracteres" | ídem |
| Monto negativo / demasiado alto / con 3 decimales | `VALIDATION` | "El monto no puede ser negativo" / "El monto es demasiado alto" / "Máximo 2 decimales" | ídem |
| Título repetido | `DUPLICATE` | El del catálogo | `shipping.service.test.ts`, `shipping-errors.contract.test.ts` |
| Editar, activar o borrar con una versión vieja | `STALE_VERSION` | El del catálogo | ídem |
| Borrar un envío usado en una venta | `HAS_RELATIONS` | El del catálogo | ídem y `shipping.repository.int.test.ts` |
| El vendedor crea, edita, activa o borra | `FORBIDDEN` | El del catálogo | `shipping-errors.contract.test.ts` |
| Sin sesión | `UNAUTHENTICATED` | El del catálogo | ídem |

## Pantallas

`/envios` (`ShippingsPanel`): buscador por título o detalle, "Ver Inactivos" y "Nuevo envío". La tabla (tarjetas en
mobile) muestra Título, Detalle y Monto, con activar o desactivar, editar y eliminar. Mientras carga muestra el
esqueleto; vacía, "Todavía no hay envíos."; un error del servidor se ve en el modal o arriba de la lista.

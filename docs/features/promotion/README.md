# Feature: promociones

- **US relacionadas**: US-8 (armar promos); US-9 las vende desde el tablero.
- **Código**: `src/features/promotion/` (domain, repository, services, actions, store, ui), tablas en
  `src/lib/db/promotion-schema.ts`, pantalla en `src/app/(main)/promociones/`.

## Qué hace

El admin arma promociones que combinan productos de distintos grupos, por ejemplo 1 docena de empanadas + 2 Coca-Cola
de 1 unidad, y les escribe a mano su **precio de venta**. Cada producto de la promo es un grupo, una presentación y
una cantidad. Los gustos y la bebida se eligen al vender (US-9).

Una promo guardada queda **activa** y aparece en Ventas. No vence: sigue activa hasta que el admin la desactiva.

## Reglas de negocio

- Nombre único, sin distinguir mayúsculas, de hasta 60 caracteres. También cuenta el nombre de una promo desactivada
  (fuente: US-8 CA-1).
- De 1 a 10 productos. Cada uno con una presentación que su grupo vende de verdad y una cantidad de 1 a 99. El mismo
  grupo y presentación no se repite: se suma la cantidad (fuente: US-8 CA-1).
- El precio de venta se escribe a mano, mayor a 0 y con 2 decimales como máximo. No hay precio de referencia
  (fuente: cliente, 2026-10-25).
- Sin vigencia: el admin la desactiva cuando quiere (fuente: cliente, 2026-10-25).
- Se puede borrar sólo si nunca se vendió; si no, devuelve `HAS_RELATIONS` y hay que desactivarla (decisión
  provisoria D-1 de `docs/plans/sprint-2.md`). Lo garantiza la FK de `sale_lines.promotion_id` (US-9).

## Roles y permisos

| Acción | admin | vendedor | público (sin sesión) |
|---|---|---|---|
| Listar las promos con sus productos | Sí | Sí (las vende en US-9) | No (lista vacía) |
| Crear, editar, activar, desactivar y borrar | Sí | No (`FORBIDDEN`) | No (`UNAUTHENTICATED`) |
| Entrar a `/promociones` | Sí | No (el `proxy` lo manda a Ventas/Pedidos) | No |

## Server Actions

| Action | Acceso | Entrada (schema) | Respuesta |
|---|---|---|---|
| `fetchPromotions()` | admin y vendedor | — | `PromotionDef[]` |
| `createPromotionAction(input)` | admin | `promotionCreateSchema` | `ActionResult<PromotionDef>` |
| `updatePromotionAction(id, input)` | admin | `promotionUpdateSchema` (todo de nuevo + `version`) | `ActionResult<PromotionDef>` |
| `togglePromotionActiveAction(input)` | admin | `promotionToggleSchema` | `ActionResult` |
| `deletePromotionAction(input)` | admin | `promotionDeleteSchema` | `ActionResult` |

Cada cambio se audita con la entidad `PROMOTION` ("PROMOCIÓN" en Auditoría): nombre, precio y el contenido descrito.

## Datos

- `promotions`: nombre (`varchar(60)`, `unique`), precio (`numeric(10,2)`, `CHECK > 0`), `is_active`, `version` y
  timestamps.
- `promotion_components`: promo (FK con `onDelete cascade`), grupo, presentación, cantidad (`CHECK > 0`) y posición.
  - `unique(promotion_id, menu_group, presentation_key)`.
  - Un `CHECK` exige que la presentación sea del grupo, tal como `GROUPS` (`menu-groups.ts`). Un test de integración
    prueba cada combinación, para que no se desincronicen.
- Editar reemplaza los productos de la promo en la misma transacción. Editar, activar y borrar filtran por `id` y
  `version`.

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Sin sesión | `UNAUTHENTICATED` | No autorizado (Token faltante) | `promotion-errors.contract.test.ts` |
| Un vendedor crea, edita, activa o borra | `FORBIDDEN` | Solo los administradores pueden realizar esta acción | `promotion-errors.contract.test.ts` |
| Sin productos, precio ≤ 0, presentación que no es del grupo, producto repetido, nombre inválido | `VALIDATION` | Los datos proporcionados no son válidos. | `promotion-errors.contract.test.ts`, `promotion.schema.test.ts` |
| Nombre de otra promo | `DUPLICATE` | Ya existe un registro con esos datos (DNI, nombre o código duplicado). | `promotion-errors.contract.test.ts`, `promotion.service.test.ts` |
| Borrar una promo que ya se vendió | `HAS_RELATIONS` | No se puede completar la operación porque existen registros relacionados. | `promotion-errors.contract.test.ts` |
| Editar, activar o borrar con una versión vieja | `STALE_VERSION` | Otro usuario cambió estos datos. Ya se actualizaron; intentá de nuevo. | `promotion-errors.contract.test.ts` |

## Pantallas

`src/app/(main)/promociones/page.tsx` → `PromotionsPanel`:

- Barra con búsqueda por nombre, "Ver Inactivas" y "Nueva promoción".
- Grilla con nombre (marca "Inactiva"), contenido ("Empanadas · 1 docena + Coca-Cola · 1 unidad × 2"), precio de venta
  y acciones (activar o desactivar, editar, borrar). En mobile, tarjetas con lo mismo.
- Formulario (`PromotionFormModal`):
  - nombre;
  - la lista de productos, con grupo, presentación y cantidad, "Agregar producto" y "Quitar producto";
  - el precio de venta de la promo, con la aclaración "Lo que paga el cliente. Se escribe a mano.".
- Estados: esqueleto mientras carga, "Todavía no hay promociones." y los errores del servidor en el formulario o en el
  aviso superior.

# Feature: tarjetas

- **US relacionadas**: US-10 (tarjetas y planes); US-11 las usa al cobrar con crédito.
- **Código**: `src/features/card/` (domain, repository, services, actions, store, ui), tablas en
  `src/lib/db/card-schema.ts`, pantalla en `src/app/(main)/tarjetas/`.

## Qué hace

El admin da de alta las tarjetas de crédito que acepta el local. Cada tarjeta tiene uno o más **planes de cuotas** (1,
3, 6 o 12) con su **recargo** en %. Al cobrar con crédito (US-11), el vendedor elige la tarjeta y el plan, y el
recargo se suma a lo que paga el cliente. El débito no pide tarjeta.

## Reglas de negocio

- Nombre único, sin distinguir mayúsculas, de hasta 40 caracteres; también cuenta el de una tarjeta desactivada
  (fuente: US-10 CA-1).
- De 1 a 4 planes, sin repetir cuotas. Las cuotas son 1, 3, 6 o 12 (fuente: `specs.md` línea 109).
- El recargo va de 0 a 100 %, con 2 decimales como máximo. Cuenta como ganancia en Estadísticas (fuente: cliente,
  2026-10-25).
- Se edita con `version` (los planes se reemplazan enteros), se desactiva y se puede borrar si nunca se usó en un
  cobro: lo protege la FK de los pagos (US-11), con el mismo criterio que D-1 para las promos.

## Roles y permisos

| Acción | admin | vendedor | público (sin sesión) |
|---|---|---|---|
| Listar las tarjetas con sus planes | Sí | Sí (las elige al cobrar) | No (lista vacía) |
| Crear, editar, activar, desactivar y borrar | Sí | No (`FORBIDDEN`) | No (`UNAUTHENTICATED`) |
| Entrar a `/tarjetas` | Sí | No (el `proxy` lo manda a Ventas/Pedidos) | No |

## Server Actions

| Action | Acceso | Entrada (schema) | Respuesta |
|---|---|---|---|
| `fetchCards()` | admin y vendedor | — | `CardDef[]` |
| `createCardAction(input)` | admin | `cardCreateSchema` | `ActionResult<CardDef>` |
| `updateCardAction(id, input)` | admin | `cardUpdateSchema` (todo de nuevo + `version`) | `ActionResult<CardDef>` |
| `toggleCardActiveAction(input)` | admin | `cardToggleSchema` | `ActionResult` |
| `deleteCardAction(input)` | admin | `cardDeleteSchema` | `ActionResult` |

Cada cambio se audita con la entidad `CARD` ("TARJETA" en Auditoría): nombre y planes descritos ("1 cuota sin
recargo · 3 cuotas +10 %").

## Datos

- `cards`: nombre (`varchar(40)`, `unique`), `is_active`, `version` y timestamps.
- `card_plans`: tarjeta (FK con `onDelete cascade`), `installments` (`CHECK IN (1, 3, 6, 12)`), `surcharge_pct`
  (`numeric(5,2)`, `CHECK` de 0 a 100) y `unique(card_id, installments)`.

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Sin sesión | `UNAUTHENTICATED` | No autorizado (Token faltante) | `card-errors.contract.test.ts` |
| Un vendedor crea, edita, activa o borra | `FORBIDDEN` | Solo los administradores pueden realizar esta acción | `card-errors.contract.test.ts` |
| Sin planes, cuotas que no son 1, 3, 6 o 12, cuotas repetidas, recargo fuera de 0–100, nombre inválido | `VALIDATION` | Los datos proporcionados no son válidos. | `card-errors.contract.test.ts`, `card.schema.test.ts` |
| Nombre de otra tarjeta | `DUPLICATE` | Ya existe un registro con esos datos (DNI, nombre o código duplicado). | `card-errors.contract.test.ts` |
| Borrar una tarjeta ya usada en un cobro (US-11) | `HAS_RELATIONS` | No se puede completar la operación porque existen registros relacionados. | `card-errors.contract.test.ts` |
| Editar, activar o borrar con una versión vieja | `STALE_VERSION` | Los datos en el servidor han cambiado. Por favor, sincroniza la lista e intenta nuevamente. | `card-errors.contract.test.ts` |

## Pantallas

`src/app/(main)/tarjetas/page.tsx` → `CardsPanel`: barra con búsqueda, "Ver Inactivas", sincronizar y "Nueva
tarjeta"; grilla con el nombre (marca "Inactiva"), los planes y las acciones; en mobile, tarjetas con lo mismo. El
formulario (`CardFormModal`) pide el nombre y la lista de planes (cuotas y recargo %), con "Agregar plan" y "Quitar
plan".

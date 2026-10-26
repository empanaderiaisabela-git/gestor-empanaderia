# Plan: US-8 — Promociones: armar promos con precio de rebaja

- **Ítem del backlog**: US-8
- **Autor**: Agente · **Fecha**: 2026-10-25 · **Estado**: Aprobado (plan nocturno del Sprint 2, autorizado por el dev)
- **Rama**: `feat/us-8-promociones`

## Objetivo

El admin arma promociones que combinan productos de distintos grupos, por ejemplo 1 docena de empanadas + 1 Coca-Cola,
y les pone a mano un precio de venta. Los gustos se eligen al vender (US-9).

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Qué rol la arma? | Sólo el admin: menú y `proxy.ts` | `specs.md` (botones del admin) |
| ¿De qué se compone? | Uno o más componentes de grupo + presentación + cantidad; los gustos se eligen al vender | Decisiones del dev (Sprint 1) |
| ¿Precio de referencia? | No hay. El admin escribe el precio de venta a mano (> 0) | Cliente, 2026-10-25 |
| ¿Vigencia? | No tiene: sigue activa hasta que el admin la desactiva | Cliente, 2026-10-25 |
| "Una vez agregada, va seleccionada" | La promo guardada queda activa y aparece en Ventas | Dev, 2026-10-25 |
| ¿Concurrencia? | Editar, activar y borrar filtran por `id` y `version` | `AGENTS.md` |
| ¿Se puede borrar? | Sí, si nunca se vendió (decisión provisoria D-1 de `sprint-2.md`); si no, se desactiva | Agente |

## Cambios por capa

| Capa | Archivos | Responsabilidad |
|---|---|---|
| schema + migración | `src/lib/db/promotion-schema.ts`, migración 0012 | `promotions` (nombre único `varchar(60)`, `price > 0`, `is_active`, `version`) y `promotion_components` (FK con `onDelete cascade`, grupo, presentación válida para el grupo por `CHECK`, `quantity > 0`, `position`) |
| domain | `features/promotion/domain/promotion.schema.ts`, `promotion-describe.ts` | Schemas Zod de alta, edición, activar y borrar; fila validada; descripción de cada componente |
| repository | `promotion.repository.ts`, `promotion-unit-of-work.ts` | Drizzle: promo con sus componentes; la edición reemplaza los componentes en la misma transacción |
| testing | `fake-promotion-unit-of-work.ts`, `promotion-repository.behavior.ts` | Fake en memoria y suite de comportamiento contra el fake y contra Drizzle |
| service | `promotion.service.ts` | Nombre único sin distinguir mayúsculas, `STALE_VERSION`, auditoría `PROMOTION` |
| actions | `create-`, `update-`, `toggle-promotion-active`, `delete-promotion`, `fetch-promotions` | Admin para escribir; cualquier usuario con sesión para listar (el vendedor las usa en US-9) |
| ui | `promotions-panel.tsx`, `promotion-form-modal.tsx`, `promotion-component-fields.tsx`, columnas y tarjeta | Grilla, formulario con la lista de componentes, "Agregar producto" y el precio de venta |
| página | `src/app/(main)/promociones/page.tsx`, `config/navigation.ts` | "Promociones" en el menú del admin, después de Ventas/Pedidos |
| auditoría | `audit-reference.ts`, `audit-log.repository.ts` | Etiqueta "PROMOCIÓN" y búsqueda por "promoción" |

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Sin sesión | `UNAUTHENTICATED` | No autorizado (Token faltante) | `promotion-errors.contract.test.ts` |
| Un vendedor crea, edita, activa o borra | `FORBIDDEN` | Solo los administradores pueden realizar esta acción | ídem |
| Sin componentes, precio ≤ 0, presentación que no es del grupo, componente repetido, nombre vacío o de más de 60 | `VALIDATION` | Los datos proporcionados no son válidos. | ídem y `promotion.schema.test.ts` |
| Nombre de otra promo (sin distinguir mayúsculas) | `DUPLICATE` | Ya existe un registro con esos datos… | ídem |
| Editar, activar o borrar con una versión vieja | `STALE_VERSION` | Los datos en el servidor han cambiado… | ídem |

## Tests

| Tipo | Casos |
|---|---|
| Unit: dominio | Schemas (presentación del grupo, repetidos, precio, nombre) con fuzz; descripción de componentes |
| Unit: service | Con el fake: alta, nombre repetido, edición que reemplaza componentes, activar, borrar, `STALE_VERSION`, auditoría |
| Contrato | Tabla de errores y camino feliz por las Server Actions, con fuzz |
| Integración | Suite de comportamiento contra `db-test`, y el `CHECK` de presentación |
| Componente | Formulario (agregar y quitar componentes, errores) y panel |
| E2E | `tests/promociones.spec.ts`: el admin arma una promo y la ve en la grilla; el vendedor no ve el menú |

## Riesgos y decisiones

- El `CHECK` de presentación repite las presentaciones de `GROUPS` (`menu-groups.ts`). Un test de integración prueba
  cada combinación válida, para que no se desincronicen.

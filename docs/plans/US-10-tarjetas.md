# Plan: US-10 — Tarjetas: tarjetas aceptadas y planes de cuotas con recargo

- **Ítem del backlog**: US-10
- **Autor**: Agente · **Fecha**: 2026-10-26 · **Estado**: Aprobado (plan nocturno del Sprint 2, autorizado por el dev)
- **Rama**: `feat/us-10-tarjetas`

## Objetivo

El admin da de alta las tarjetas que acepta el local, cada una con sus planes de 1, 3, 6 o 12 cuotas y el recargo de
cada plan. Al cobrar con crédito (US-11), el vendedor elige la tarjeta y el plan.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Qué cuotas? | 1, 3, 6 o 12 | `specs.md` línea 109 |
| ¿Recargo? | Un % por plan, de 0 a 100 con 2 decimales; cuenta como ganancia | Decisiones del dev; cliente, 2026-10-25 |
| ¿El débito pide tarjeta? | No: las tarjetas son sólo para crédito | Cliente, 2026-10-25 |
| ¿Quién la carga? | Sólo el admin (menú y `proxy.ts`) | `specs.md` (botones del admin) |
| ¿Se puede borrar? | Sí, si nunca se usó en un cobro; si no, se desactiva (mismo criterio que D-1) | Agente |

## Cambios por capa

| Capa | Archivos | Responsabilidad |
|---|---|---|
| schema + migración | `src/lib/db/card-schema.ts`, migración 0014 | `cards` (nombre único `varchar(40)`, `is_active`, `version`) y `card_plans` (FK en cascada, `installments IN (1, 3, 6, 12)`, `surcharge_pct` de 0 a 100, `unique(card_id, installments)`) |
| domain | `features/card/domain/card.schema.ts`, `card-describe.ts` | Schemas de alta, edición, activar y borrar; fila validada; descripción de los planes |
| repository, testing | `card.repository.ts`, `card-unit-of-work.ts`, fake y suite de comportamiento | La edición reemplaza los planes en la misma transacción |
| service | `card.service.ts` | Nombre único sin distinguir mayúsculas, `STALE_VERSION`, auditoría `CARD` |
| actions | `create-`, `update-`, `toggle-card-active`, `delete-card`, `fetch-cards` | Admin para escribir; cualquier usuario con sesión para listar (el vendedor las usa al cobrar) |
| ui y página | `cards-panel.tsx`, `card-form-modal.tsx`, `card-plan-fields.tsx`, `src/app/(main)/tarjetas/` | Grilla, formulario con los planes y "Tarjetas" en el menú del admin, después de Alta de productos (orden de `specs.md`) |

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Sin sesión | `UNAUTHENTICATED` | No autorizado (Token faltante) | `card-errors.contract.test.ts` |
| Un vendedor crea, edita, activa o borra | `FORBIDDEN` | Solo los administradores pueden realizar esta acción | ídem |
| Sin planes, cuotas que no son 1, 3, 6 o 12, cuotas repetidas, recargo fuera de 0–100, nombre vacío o de más de 40 | `VALIDATION` | Los datos proporcionados no son válidos. | ídem y `card.schema.test.ts` |
| Nombre de otra tarjeta | `DUPLICATE` | Ya existe un registro con esos datos… | ídem |
| Editar, activar o borrar con una versión vieja | `STALE_VERSION` | Los datos en el servidor han cambiado… | ídem |

## Tests

Unit (schemas con fuzz, descripción, service con el fake), contrato por las Server Actions, integración de la suite
de comportamiento y de los `CHECK`, componentes (formulario de planes, panel, grilla) y E2E (`tests/tarjetas.spec.ts`).

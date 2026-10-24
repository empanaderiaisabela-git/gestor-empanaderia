# Plan: BUG-1 — Acciones de fotos de producto sin control de sesión

- **Ítem del backlog**: BUG-1
- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-24 · **Estado**: Aprobado (plan del sprint)
- **Rama**: `fix/bug-1-fotos-sesion`

## Objetivo

Que subir, listar y borrar fotos de producto exija una sesión válida, y que el vendedor (que también puede) vea el
botón de fotos.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Qué roles pueden subir, borrar y listar fotos? | `admin` y `vendedor` | dev (2026-10-24) |
| ¿Qué recibe quien no tiene sesión? | `ActionResult` con `code: 'UNAUTHENTICATED'` y el texto de siempre | US, catálogo de T-4 |
| ¿El catálogo público usa estas acciones? | No: `/home` y `/product/[id]` leen las fotos por relaciones de Drizzle | exploración |

## Cambios por capa

| Capa | Archivos | Responsabilidad |
|---|---|---|
| domain | `product/domain/product-permissions.ts` | `canManagePhotos(role)` |
| actions | `upload-product-photo.ts`, `delete-product-photo.ts`, `get-product-photos.ts` | `verifyAuthOrAdmin(false)` al empezar; un `AppError` se devuelve con `toActionFailure`. Cambio mínimo: siguen en la lista legacy (validación y auditoría de fotos, BUG-11) |
| ui | `config/tables/product-columns.tsx`, `config/cards/product-card.tsx` | El botón de fotos usa `canManagePhotos` |

## Errores

| Acción inválida | code | Mensaje | Test |
|---|---|---|---|
| Subir, listar o borrar sin sesión | `UNAUTHENTICATED` | No autorizado (Token faltante) | `product-photos.contract.test.ts` |

## Tests

| Tipo | Casos |
|---|---|
| Contrato (unit) | `regression BUG-1`: sin sesión, las tres devuelven `UNAUTHENTICATED` y no tocan Cloudinary. Antes del fix, subir llamaba a Cloudinary |
| Contrato (integración) | Admin y vendedor suben, listan y borran una foto, con Cloudinary reemplazado por un fake |
| Unit | `canManagePhotos` por rol; render a HTML de la acción de la tabla y del menú de la tarjeta: el vendedor ve "Gestionar Fotos" (con la condición vieja, falla) |

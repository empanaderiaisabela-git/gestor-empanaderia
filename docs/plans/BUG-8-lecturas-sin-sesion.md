# Plan: BUG-8 — Lecturas de productos y proveedores sin sesión

- **Ítem del backlog**: BUG-8
- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-24 · **Estado**: Aprobado (plan del sprint)
- **Rama**: `fix/bug-8-lecturas-sin-sesion`

## Objetivo

Que `fetchProducts` (precios de compra y proveedor) y `fetchSelectorData` (teléfono y mail de los proveedores)
exijan una sesión válida.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Quién las usa? | `/productos` y `/ventas` (admin y vendedor), y el refresco del POS | exploración |
| ¿Qué devuelven sin sesión? | Lo mismo que ante cualquier error: listas vacías (igual que `fetchProviders`) | plan del sprint |
| ¿El vendedor debe ver precios de compra y contacto de proveedores? | Pregunta abierta para el cliente; por ahora no cambia | BACKLOG |

## Cambios

| Capa | Archivos | Responsabilidad |
|---|---|---|
| actions | `product/actions/product.actions.ts` | `verifyAuthOrAdmin(false)` al empezar las dos lecturas. Cambio mínimo: el archivo sigue en la lista legacy |

## Tests

| Tipo | Casos |
|---|---|
| Contrato (unit) | `regression BUG-8`: sin sesión, ninguna devuelve datos ni llama al repositorio (antes devolvían los datos). Con sesión de vendedor, devuelven productos, categorías y proveedores |
